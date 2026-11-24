import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import crypto from "crypto";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { dispatchOrderSuccessEmails } from "@/lib/emailService";
import { verifyAdminSession } from "@/lib/jwtAdmin";
import { deductInventory } from "@/lib/inventory";
import { incrementCouponUsage } from "@/lib/couponManager";
import { validateCsrfOrigin } from "@/lib/csrf";
import { consumeContactProofTokens } from "@/lib/contactVerification";
import type { Order, OrderItem } from "@/types/order";

function timingSafeMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf-8");
  const bufB = Buffer.from(b, "utf-8");
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(request: Request) {
  try {
    // CSRF protection for state-changing payment verification
    const csrfCheck = validateCsrfOrigin(request);
    if (!csrfCheck.allowed) {
      return NextResponse.json(
        { success: false, error: `CSRF validation failed: ${csrfCheck.reason}` },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
    const order_id = body.order_id || body.orderId;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: "Missing required Razorpay verification parameters." },
        { status: 400 }
      );
    }

    const isLiveGateway = (
      process.env.RAZORPAY_KEY_ID ||
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      ""
    ).startsWith("rzp_live_");

    if (isLiveGateway && process.env.NODE_ENV === "production" && razorpay_payment_id.startsWith("pay_test_")) {
      return NextResponse.json(
        { success: false, error: "Sandbox test payments are prohibited in live production environment." },
        { status: 403 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      if (process.env.NODE_ENV === "production") {
        console.error("FATAL: RAZORPAY_KEY_SECRET environment variable is not configured in production.");
        return NextResponse.json(
          { success: false, error: "Payment verification service is temporarily unavailable." },
          { status: 500 }
        );
      }
      throw new Error("RAZORPAY_KEY_SECRET environment variable must be configured for Razorpay payment verification.");
    }

    // 1. Compute expected HMAC SHA256 signature using configured secret only
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    // 2. Constant-time comparison to prevent timing attacks
    const isValid = timingSafeMatch(expectedSignature, razorpay_signature);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Razorpay signature verification failed." },
        { status: 400 }
      );
    }

    // 3. Resolve internal order and enforce ownership
    const adminClient = getAdminSupabaseClient();
    let fullOrder: Order | null = null;

    if (order_id) {
      const serverClient = await createSupabaseServerClient();
      const {
        data: { user },
      } = await serverClient.auth.getUser();

      const GUEST_SYSTEM_USER_ID = "7a3b2e24-820f-4706-8cc3-4218b42b0da3";
      const isAdmin = (await verifyAdminSession(request)).authorized;

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(order_id);
      let actualOrderId = order_id;

      if (!isUuid) {
        const { data: matchedOrder } = await adminClient
          .from("orders")
          .select("id")
          .eq("order_number", order_id)
          .maybeSingle();

        if (matchedOrder?.id) {
          actualOrderId = matchedOrder.id;
        }
      }

      const { data: order, error: fetchErr } = await adminClient
        .from("orders")
        .select("id, user_id, order_number, payment_status, order_status, total_amount, coupon_code")
        .eq("id", actualOrderId)
        .maybeSingle();

      if (fetchErr || !order) {
        return NextResponse.json(
          { success: false, error: "Order not found." },
          { status: 404 }
        );
      }

      const isGuestOrder = !order.user_id || order.user_id === GUEST_SYSTEM_USER_ID;

      // Enforce ownership: Registered customer orders require owner session or admin authority
      if (!isGuestOrder && (!user || user.id !== order.user_id) && !isAdmin) {
        return NextResponse.json(
          {
            success: false,
            error: user
              ? "Not authorized to verify payment for this order."
              : "Authentication required to verify payment for this order.",
          },
          { status: user ? 403 : 401 }
        );
      }

      // Idempotency: never double-record the same Razorpay transaction.
      const { data: existingPayment } = await adminClient
        .from("payments")
        .select("id")
        .eq("transaction_id", razorpay_payment_id)
        .maybeSingle();

      if (existingPayment) {
        const { data: existingOrder } = await adminClient
          .from("orders")
          .select(`
            *,
            order_items (*)
          `)
          .eq("id", order.id)
          .maybeSingle();
        return NextResponse.json({
          success: true,
          message: "Payment already verified for this transaction.",
          payment_id: razorpay_payment_id,
          order: existingOrder,
        });
      }

      // Concurrency lock: Only update if payment_status is NOT already 'Paid'
      const { data: updatedOrder, error: updateErr } = await adminClient
        .from("orders")
        .update({
          payment_status: "Paid",
          order_status: "Confirmed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id)
        .neq("payment_status", "Paid")
        .select(`
          *,
          order_items (*)
        `)
        .maybeSingle();

      if (!updateErr && updatedOrder) {
        // This invocation won the race: Record payment and send emails
        fullOrder = updatedOrder as Order;

        await adminClient.from("payments").insert({
          order_id: order.id,
          gateway: "Razorpay",
          transaction_id: razorpay_payment_id,
          amount: fullOrder.total_amount || body.amount || 0,
          currency: "INR",
          status: "Paid",
          raw_payload: {
            razorpay_order_id,
            razorpay_payment_id,
            verified_at: new Date().toISOString(),
          },
        });

        // Deduct inventory stock upon verified payment (AVS-004)
        try {
          const itemsToDeduct = (updatedOrder.order_items || []) as OrderItem[];
          await deductInventory(adminClient, itemsToDeduct);
        } catch (invErr) {
          console.warn("Notice: Payment verify inventory deduction notice:", invErr);
        }

        // Concurrency-guarded coupon usage increment (AVS-006)
        if (fullOrder.coupon_code) {
          await incrementCouponUsage(adminClient, fullOrder.coupon_code);
        }

        // Single-use proof token deduplication: consume tokens now that payment is confirmed
        const snapshot = fullOrder.shipping_address_snapshot as unknown as Record<string, unknown> | null;
        if (snapshot && typeof snapshot === "object" && "verification_tokens" in snapshot) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await consumeContactProofTokens((snapshot as any).verification_tokens, adminClient);
        }

        // Fire-and-forget email notifications (Customer GST Tax Invoice + Admin Alert)
        dispatchOrderSuccessEmails(fullOrder).catch((e) =>
          console.warn("Notice: background email dispatch error:", e)
        );
      } else {
        // Already updated by webhook or parallel request: retrieve existing order
        const { data: existingOrder } = await adminClient
          .from("orders")
          .select(`
            *,
            order_items (*)
          `)
          .eq("id", order.id)
          .maybeSingle();

        if (existingOrder) {
          fullOrder = existingOrder as Order;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payment successfully verified and order confirmed.",
      payment_id: razorpay_payment_id,
      order: fullOrder,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
