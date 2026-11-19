import { NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { processedWebhooksMemory } from "@/lib/webhooks";
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
      console.warn("WARNING: Using development fallback secret for Razorpay webhook verification.");
    }

    const activeSecret =
      webhookSecret || "avsaraa_test_razorpay_webhook_secret_2026";

    // 1. Verify HMAC SHA256 Signature
    const expectedSignature = crypto
      .createHmac("sha256", activeSecret)
      .update(rawBody)
      .digest("hex");

    if (!timingSafeMatch(expectedSignature, signature)) {
      return NextResponse.json(
        { success: false, error: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    const event = JSON.parse(rawBody);
    const eventId = String(event.id || event.event_id || `evt_${Date.now()}`);

    // 2. Webhook Deduplication: Handle Code 23505 primary key constraint conflict
    if (processedWebhooksMemory.has(eventId)) {
      return NextResponse.json({
        success: true,
        message: "Webhook event previously processed (memory deduplicated).",
        eventId,
      });
    }

    const adminClient = getAdminSupabaseClient();
    try {
      const { error: dedupErr } = await adminClient.from("processed_webhooks").insert({
        webhook_id: eventId,
        source: "razorpay",
        payload: event,
        processed_at: new Date().toISOString(),
      });

      if (dedupErr) {
        if (dedupErr.code === "23505") {
          return NextResponse.json({
            success: true,
            message: "Duplicate webhook event acknowledged without re-processing.",
            eventId,
          });
        }
      }
    } catch {
      // Table may not exist in mock/fallback; memory dedup handles it
    }

    processedWebhooksMemory.add(eventId);

    // 3. Process Payment Event
    if (event.event === "payment.captured" || event.event === "order.paid") {
      const paymentEntity = event.payload?.payment?.entity;
      const notes = paymentEntity?.notes || {};
      const orderId = notes.order_id || notes.orderId;

      if (orderId) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
        let actualOrderId = orderId;

        if (!isUuid) {
          const { data: matchedOrder } = await adminClient
            .from("orders")
            .select("id")
            .eq("order_number", orderId)
            .maybeSingle();

          if (matchedOrder?.id) {
            actualOrderId = matchedOrder.id;
          }
        }

        // Amount Verification: Prevent partial or underpaid payment capture
        const { data: existingOrder } = await adminClient
          .from("orders")
          .select("id, total_amount, payment_status")
          .eq("id", actualOrderId)
          .maybeSingle();

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
          await adminClient.from("payments").insert({
            order_id: actualOrderId,
            gateway: "Razorpay Webhook",
            transaction_id: paymentEntity.id || `TXN_${Date.now()}`,
            amount: (paymentEntity.amount || 0) / 100,
            currency: paymentEntity.currency || "INR",
            status: "Paid",
            raw_payload: event,
          });

          if (updatedOrder.coupon_code) {
            try {
              const { data: coupRow } = await adminClient
                .from("coupons")
                .select("id, used_count")
                .ilike("code", updatedOrder.coupon_code)
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

          // Asynchronous email dispatch (Customer GST Tax Invoice + Admin Alert)
          dispatchOrderSuccessEmails(updatedOrder as Order).catch((e) =>
            console.warn("Notice: webhook background email dispatch error:", e)
          );
        }
      }
    } else if (event.event === "payment.failed") {
      const paymentEntity = event.payload?.payment?.entity;
      const notes = paymentEntity?.notes || {};
      const orderId = notes.order_id || notes.orderId;

      if (orderId) {
        try {
          await adminClient
            .from("orders")
            .update({
              payment_status: "Failed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", orderId)
            .neq("payment_status", "Paid");
        } catch {
          // Ignore
        }
      }
    }

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
