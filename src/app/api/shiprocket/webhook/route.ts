import { NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { processedWebhooksMemory } from "@/lib/webhooks";

function timingSafeMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf-8");
  const bufB = Buffer.from(b, "utf-8");
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Fulfillment & tracking webhook endpoint active. Send POST requests with payload.",
  });
}

export async function POST(request: Request) {
  try {
    // 1. Authenticate Shiprocket Webhook token/secret across supported auth types
    const authHeader = request.headers.get("authorization") || "";
    const bearerOrTokenMatch = authHeader.replace(/^(Bearer|Token)\s+/i, "").trim();

    const incomingToken =
      request.headers.get("x-api-key") ||
      request.headers.get("x-shiprocket-token") ||
      request.headers.get("token") ||
      bearerOrTokenMatch;

    const expectedSecret =
      process.env.SHIPROCKET_WEBHOOK_TOKEN ||
      process.env.SHIPROCKET_WEBHOOK_SECRET ||
      (process.env.NODE_ENV !== "production" ? "avsaraa_test_shiprocket_token_2026" : "");

    if (!expectedSecret || !incomingToken || !timingSafeMatch(incomingToken, expectedSecret)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized webhook request: missing or invalid credentials." },
        { status: 401 }
      );
    }

    interface ShiprocketWebhookPayload {
      event_id?: string;
      awb?: string;
      order_id?: string;
      custom_order_id?: string;
      current_status?: string;
      current_timestamp?: string;
      etd?: string;
      updated_at?: string;
      courier_name?: string;
      tracking_number?: string;
      [key: string]: unknown;
    }

    let event: ShiprocketWebhookPayload;
    try {
      event = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON webhook payload." },
        { status: 400 }
      );
    }
    const fallbackParts = [
      event.awb || event.tracking_number,
      event.current_status,
      event.current_timestamp || event.etd || event.updated_at || String(Date.now()),
    ].filter(Boolean);
    const eventId = String(
      event.event_id || (fallbackParts.length > 0 ? fallbackParts.join(":") : `ship_${Date.now()}`)
    );

    // Deduplication via in-memory and database
    if (processedWebhooksMemory.has(eventId)) {
      return NextResponse.json({
        success: true,
        message: "Duplicate Shiprocket event acknowledged.",
        eventId,
      });
    }

    const adminClient = getAdminSupabaseClient();
    try {
      const { error: dedupErr } = await adminClient.from("processed_webhooks").insert({
        webhook_id: eventId,
        source: "shiprocket",
        payload: event,
        processed_at: new Date().toISOString(),
      });

      if (dedupErr && dedupErr.code === "23505") {
        processedWebhooksMemory.add(eventId);
        return NextResponse.json({
          success: true,
          message: "Duplicate Shiprocket event handled.",
          eventId,
        });
      }
    } catch {
      // Memory fallback
    }

    // Map Shiprocket status to Avsaraa order_status
    const orderId = event.order_id || event.custom_order_id;
    const currentStatus = String(event.current_status || "").toUpperCase();

    let mappedStatus: string | null = null;
    if (currentStatus.includes("DELIVERED")) {
      mappedStatus = "Delivered";
    } else if (currentStatus.includes("OUT FOR DELIVERY")) {
      mappedStatus = "Out for Delivery";
    } else if (
      currentStatus.includes("IN TRANSIT") ||
      currentStatus.includes("DISPATCHED") ||
      currentStatus.includes("PICKED UP") ||
      currentStatus.includes("SHIPPED")
    ) {
      mappedStatus = "Dispatched";
    } else if (
      currentStatus.includes("MANIFEST") ||
      currentStatus.includes("AWB ASSIGNED") ||
      currentStatus.includes("PROCESSING")
    ) {
      mappedStatus = "Processing";
    } else if (currentStatus.includes("CANCEL")) {
      mappedStatus = "Cancelled";
    }

    if (orderId && mappedStatus) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
      const lookupColumn = isUuid ? "id" : "order_number";
      const { data: existingOrder } = await adminClient
        .from("orders")
        .select("id, order_status")
        .eq(lookupColumn, orderId)
        .maybeSingle();

      if (
        existingOrder &&
        existingOrder.order_status !== "Cancelled" &&
        existingOrder.order_status !== "Exchanged" &&
        existingOrder.order_status !== "Exchange Requested"
      ) {
        const STATUS_RANK: Record<string, number> = {
          Pending: 0,
          Confirmed: 1,
          Processing: 2,
          Dispatched: 3,
          "Out for Delivery": 4,
          Delivered: 5,
        };
        const currentRank = STATUS_RANK[existingOrder.order_status] ?? 0;
        const nextRank = STATUS_RANK[mappedStatus] ?? 0;
        const isMonotonicForward = mappedStatus === "Cancelled" || nextRank >= currentRank;

        if (isMonotonicForward) {
          const updatePayload: Record<string, unknown> = {
            order_status: mappedStatus,
            courier_partner: event.courier_name || "Shiprocket Express",
            tracking_number: event.awb || event.tracking_number,
            updated_at: new Date().toISOString(),
          };

          if (mappedStatus === "Delivered") {
            updatePayload.payment_status = "Paid";
          }

          let updateQuery = adminClient
            .from("orders")
            .update(updatePayload)
            .eq("id", existingOrder.id);

          if (mappedStatus === "Cancelled") {
            updateQuery = updateQuery.neq("order_status", "Cancelled");
          }

          const { data: updatedOrder } = await updateQuery.select("id").maybeSingle();

          // Atomically restore inventory only if this webhook transitioned order -> Cancelled
          if (updatedOrder && mappedStatus === "Cancelled") {
            const { data: items } = await adminClient
              .from("order_items")
              .select("product_id, quantity")
              .eq("order_id", existingOrder.id);
            if (items) {
              for (const item of items) {
                if (item.product_id) {
                  await adminClient.rpc("increment_stock", { p_id: item.product_id, p_qty: item.quantity });
                }
              }
            }
          }
        }
      }
    }

    processedWebhooksMemory.add(eventId);

    return NextResponse.json({
      success: true,
      message: "Shiprocket webhook processed.",
      eventId,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
