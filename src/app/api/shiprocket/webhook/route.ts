import { NextResponse } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { processedWebhooksMemory } from "@/lib/webhooks";

export async function POST(request: Request) {
  try {
    const event = await request.json();
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
    } else if (currentStatus.includes("IN TRANSIT") || currentStatus.includes("DISPATCHED") || currentStatus.includes("PICKED UP")) {
      mappedStatus = "Dispatched";
    }

    if (orderId && mappedStatus) {
      await adminClient
        .from("orders")
        .update({
          order_status: mappedStatus,
          courier_partner: event.courier_name || "Shiprocket Express",
          tracking_number: event.awb || event.tracking_number,
          updated_at: new Date().toISOString(),
        })
        .or(`id.eq.${orderId},order_number.eq.${orderId}`);
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
