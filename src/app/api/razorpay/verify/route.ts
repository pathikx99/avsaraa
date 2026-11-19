import { NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { dispatchOrderSuccessEmails } from "@/lib/emailService";
import type { Order } from "@/types/order";

function timingSafeMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf-8");
  const bufB = Buffer.from(b, "utf-8");
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: "Missing required Razorpay verification parameters." },
        { status: 400 }
      );
    }

    if (process.env.NODE_ENV === "production" && razorpay_payment_id.startsWith("pay_test_")) {
      return NextResponse.json(
        { success: false, error: "Sandbox test payments are prohibited in production environment." },
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
      console.warn("WARNING: Using development fallback secret for Razorpay verification.");
    }
    const activeSecret = keySecret || "avsaraa_test_razorpay_secret_key_2026";

    // 1. Compute expected HMAC SHA256 signature
    const expectedSignature = crypto
      .createHmac("sha256", activeSecret)
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

    // 3. Update database payment status atomically with concurrency guard
    const adminClient = getAdminSupabaseClient();
    let fullOrder: Order | null = null;

    if (order_id) {
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

      // Concurrency lock: Only update if payment_status is NOT already 'Paid'
      const { data: updatedOrder, error: updateErr } = await adminClient
        .from("orders")
        .update({
          payment_status: "Paid",
          order_status: "Confirmed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", actualOrderId)
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
          order_id: actualOrderId,
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

        // Increment coupon used_count
        if (fullOrder.coupon_code) {
          try {
            const { data: coupRow } = await adminClient
              .from("coupons")
              .select("id, used_count")
              .ilike("code", fullOrder.coupon_code)
              .maybeSingle();

            if (coupRow) {
              await adminClient
                .from("coupons")
                .update({ used_count: (coupRow.used_count || 0) + 1 })
                .eq("id", coupRow.id);
            }
          } catch (cErr) {
            console.warn("Coupon increment notice:", cErr);
          }
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
          .eq("id", actualOrderId)
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
