import { NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { processedWebhooksMemory } from "@/lib/webhooks";
import { dispatchOrderSuccessEmails } from "@/lib/emailService";
import { deductInventory } from "@/lib/inventory";
import { incrementCouponUsage } from "@/lib/couponManager";
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
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json(
        { success: false, error: "Missing x-razorpay-signature header" },
        { status: 400 }
      );
    }

    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

    if (!webhookSecret) {
      if (process.env.NODE_ENV === "production") {
        console.error("FATAL: RAZORPAY_WEBHOOK_SECRET is not configured in production environment.");
        return NextResponse.json(
          { success: false, error: "Webhook signature verification failed due to missing configuration." },
          { status: 500 }
        );
      }
      throw new Error("RAZORPAY_WEBHOOK_SECRET or RAZORPAY_KEY_SECRET must be configured for Razorpay webhook verification.");
    }

    // 1. Verify HMAC SHA256 Signature using configured secret only
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (!timingSafeMatch(expectedSignature, signature)) {
      return NextResponse.json(
        { success: false, error: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    let event: Record<string, unknown>;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON webhook payload" },
        { status: 400 }
      );
    }

    const payloadObj = event.payload as { payment?: { entity?: Record<string, unknown> } } | undefined;
    const paymentEntity = payloadObj?.payment?.entity;
    const headerEventId = request.headers.get("x-razorpay-event-id");
    const eventId = String(
      headerEventId ||
      event.id ||
      event.event_id ||
      (paymentEntity?.id ? `${paymentEntity.id}:${String(event.event || "evt")}` : `evt_${Date.now()}`)
    );

    // 2. Webhook Deduplication: Handle Code 23505 primary key constraint conflict
    if (processedWebhooksMemory.has(eventId)) {
      return NextResponse.json({
        success: true,
        message: "Webhook event previously processed (memory deduplicated).",
        eventId,
      });
    }

    const adminClient = getAdminSupabaseClient();
    const resolveOrderUuid = async (rawOrderId: string): Promise<string> => {
      const cleanId = String(rawOrderId).trim();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
      if (isUuid) return cleanId;
      const { data: matchedOrder } = await adminClient
        .from("orders")
        .select("id")
        .eq("order_number", cleanId)
        .maybeSingle();
      return matchedOrder?.id || cleanId;
    };

    try {
      const { error: dedupErr } = await adminClient.from("processed_webhooks").insert({
        webhook_id: eventId,
        source: "razorpay",
        payload: event,
        processed_at: new Date().toISOString(),
      });

      if (dedupErr && dedupErr.code === "23505") {
        processedWebhooksMemory.add(eventId);
        return NextResponse.json({
          success: true,
          message: "Duplicate webhook event acknowledged without re-processing.",
          eventId,
        });
      }
    } catch {
      // Table may not exist in mock/fallback; memory dedup handles it
    }

    // 3. Process Payment Event
    if (event.event === "payment.captured" || event.event === "order.paid") {
      const notes = (paymentEntity?.notes || {}) as Record<string, string | undefined>;
      const orderId = notes.order_id || notes.orderId;

      if (orderId) {
        const actualOrderId = await resolveOrderUuid(orderId);

        // Order-payment binding & amount validation
        const webhookRzpOrderId = paymentEntity?.order_id ? String(paymentEntity.order_id) : null;
        const { data: existingOrder } = await adminClient
          .from("orders")
          .select("id, total_amount, payment_status, shipping_address_snapshot")
          .eq("id", actualOrderId)
          .maybeSingle();

        if (webhookRzpOrderId) {
          const { data: orderPayments } = await adminClient
            .from("payments")
            .select("id, transaction_id, raw_payload")
            .eq("order_id", actualOrderId);
          const snapRzpId = (
            existingOrder?.shipping_address_snapshot as { razorpay_order_id?: string } | null
          )?.razorpay_order_id;
          const hasPaymentBinding = Boolean(
            orderPayments?.some((p) => {
              const raw = (p.raw_payload || {}) as Record<string, unknown>;
              return p.transaction_id === webhookRzpOrderId || raw.razorpay_order_id === webhookRzpOrderId;
            })
          );
          const hasSnapshotBinding = Boolean(snapRzpId && snapRzpId === webhookRzpOrderId);
          if ((orderPayments && orderPayments.length > 0 && !hasPaymentBinding) || (snapRzpId && !hasSnapshotBinding)) {
            return NextResponse.json(
              { success: false, error: "Webhook razorpay_order_id does not match target order." },
              { status: 400 }
            );
          }
        }

        if (existingOrder) {
          const paidAmountPaise = Number(paymentEntity?.amount || 0);
          const expectedAmountPaise = Math.round(Number(existingOrder.total_amount) * 100);

          if (paidAmountPaise < expectedAmountPaise) {
            console.error(
              `Security Alert: Razorpay webhook amount mismatch for order ${actualOrderId}. Paid: ${paidAmountPaise} paise, Expected: ${expectedAmountPaise} paise.`
            );
            await adminClient
              .from("orders")
              .update({
                payment_status: "Failed",
                notes: `Security warning: Underpaid transaction: received ₹${paidAmountPaise / 100}, expected ₹${expectedAmountPaise / 100}`,
                updated_at: new Date().toISOString(),
              })
              .eq("id", actualOrderId);

            return NextResponse.json(
              { success: false, error: "Payment amount does not match required order total." },
              { status: 400 }
            );
          }
        }

        // Concurrency Guard: Only update if not already Paid
        const { data: updatedOrder } = await adminClient
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

        if (updatedOrder) {
          // This webhook won the race: record payment and trigger emails
          const webhookTxnId = String(paymentEntity?.id || `TXN_${Date.now()}`);
          const { data: pendingPayment } = webhookRzpOrderId
            ? await adminClient
                .from("payments")
                .select("id")
                .eq("order_id", actualOrderId)
                .eq("transaction_id", webhookRzpOrderId)
                .maybeSingle()
            : { data: null };

          if (pendingPayment?.id) {
            await adminClient
              .from("payments")
              .update({
                gateway: "Razorpay Webhook",
                transaction_id: webhookTxnId,
                amount: Number(paymentEntity?.amount || 0) / 100,
                currency: String(paymentEntity?.currency || "INR"),
                status: "Paid",
                raw_payload: event,
              })
              .eq("id", pendingPayment.id);
          } else {
            await adminClient.from("payments").insert({
              order_id: actualOrderId,
              gateway: "Razorpay Webhook",
              transaction_id: webhookTxnId,
              amount: Number(paymentEntity?.amount || 0) / 100,
              currency: String(paymentEntity?.currency || "INR"),
              status: "Paid",
              raw_payload: event,
            });
          }

          // Deduct inventory stock upon verified payment (AVS-004)
          try {
            const itemsToDeduct = (updatedOrder.order_items || []) as OrderItem[];
            await deductInventory(adminClient, itemsToDeduct);
          } catch (invErr) {
            console.warn("Notice: Razorpay webhook inventory deduction notice:", invErr);
          }

          // Concurrency-guarded coupon usage increment (AVS-006)
          if (updatedOrder.coupon_code) {
            await incrementCouponUsage(adminClient, updatedOrder.coupon_code);
          }

          // Single-use proof token deduplication: consume tokens now that payment is confirmed
          const snapshot = updatedOrder.shipping_address_snapshot as { verification_tokens?: { phone_token?: string; email_token?: string } } | null;
          if (snapshot && typeof snapshot === "object" && snapshot.verification_tokens) {
            await consumeContactProofTokens(snapshot.verification_tokens, adminClient);
          }

          // Asynchronous email dispatch (Customer GST Tax Invoice + Admin Alert)
          dispatchOrderSuccessEmails(updatedOrder as Order).catch((e) =>
            console.warn("Notice: webhook background email dispatch error:", e)
          );
        }
      }
    } else if (event.event === "payment.failed") {
      const notes = (paymentEntity?.notes || {}) as Record<string, string | undefined>;
      const orderId = notes.order_id || notes.orderId;

      if (orderId) {
        try {
          const actualOrderId = await resolveOrderUuid(orderId);
          await adminClient
            .from("orders")
            .update({
              payment_status: "Failed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", actualOrderId)
            .neq("payment_status", "Paid");
        } catch {
          // Ignore
        }
      }
    }

    processedWebhooksMemory.add(eventId);

    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully",
      eventId,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
