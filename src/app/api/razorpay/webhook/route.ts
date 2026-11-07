import { NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { processedWebhooksMemory } from "@/lib/webhooks";

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
      process.env.RAZORPAY_WEBHOOK_SECRET ||
      process.env.RAZORPAY_KEY_SECRET ||
      "avsaraa_test_razorpay_webhook_secret_2026";

    // 1. Verify HMAC SHA256 Signature
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
          // Unique constraint violation: duplicate delivery from Razorpay
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
        await adminClient
          .from("orders")
          .update({
            payment_status: "Paid",
            order_status: "Confirmed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        await adminClient.from("payments").insert({
          order_id: orderId,
          gateway: "Razorpay Webhook",
          transaction_id: paymentEntity.id || `TXN_${Date.now()}`,
          amount: (paymentEntity.amount || 0) / 100,
          currency: paymentEntity.currency || "INR",
          status: "Paid",
          raw_payload: event,
        });
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
