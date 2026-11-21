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
      courier_name?: string;
      tracking_number?: string;
      [key: string]: unknown;
    }

    let event: ShiprocketWebhookPayload = {};
    try {
      event = await request.json();
    } catch {
      event = {};
    }
    const eventId = String(event.event_id || event.awb || `ship_${Date.now()}`);

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
        return NextResponse.json({
          success: true,
          message: "Duplicate Shiprocket event handled.",
          eventId,
        });
      }
    } catch {
      // Memory fallback
    }

    processedWebhooksMemory.add(eventId);

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
      let updateQuery = adminClient
        .from("orders")
        .update({
          order_status: mappedStatus,
          courier_partner: event.courier_name || "Shiprocket Express",
          tracking_number: event.awb || event.tracking_number,
          updated_at: new Date().toISOString(),
        });

      if (isUuid) {
        updateQuery = updateQuery.eq("id", orderId);
      } else {
        updateQuery = updateQuery.eq("order_number", orderId);
      }

      await updateQuery;
    }

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
