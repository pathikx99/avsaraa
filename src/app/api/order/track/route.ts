import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { rateLimitOrderTracking } from "@/lib/rateLimit";

export async function POST(request: Request) {
  try {
    const headerList = await headers();
    const forwardedFor = headerList.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown-ip";

    // 1. Rate Limiting Protection (10 requests per minute)
    const rateCheck = rateLimitOrderTracking(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Tracking request limit reached. Please retry in ${rateCheck.resetSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { orderId, contact } = body;

    const rawOrderId = String(orderId || "").trim();
    const rawContact = String(contact || "").trim().toLowerCase();

    // Strict validation: BOTH Order ID/Number AND contact (phone/email) are mandatory
    if (!rawOrderId || !rawContact) {
      return NextResponse.json(
        {
          success: false,
          error: "Both Order ID/Number and your registered Phone Number or Email are required.",
        },
        { status: 400 }
      );
    }

    const adminClient = getAdminSupabaseClient();

    let query = adminClient
      .from("orders")
      .select(`
        id,
        order_number,
        order_status,
        payment_status,
        courier_partner,
        tracking_number,
        estimated_delivery,
        shipping_fee,
        subtotal,
        total_amount,
        shipping_address_snapshot,
        created_at,
        order_items (
          product_name,
          quantity,
          image_url,
          size,
          color
        )
      `);

    if (rawOrderId.startsWith("AVS-")) {
      query = query.eq("order_number", rawOrderId);
    } else {
      query = query.eq("id", rawOrderId);
    }

    const { data: order, error } = await query.maybeSingle();

    if (error || !order) {
      return NextResponse.json(
        {
          success: false,
          error: "No matching order found with the provided details. Please verify your order ID and contact information.",
        },
        { status: 404 }
      );
    }

    // 2. Strict IDOR Verification: Verify phone or email matches the order record
    const snapshot = order.shipping_address_snapshot || {};
    const recordedPhone = String(snapshot.phone_number || "").replace(/\D/g, "");
    const recordedEmail = String(snapshot.email || "").toLowerCase().trim();

    const inputDigits = rawContact.replace(/\D/g, "");
    const inputIsPhone = inputDigits.length >= 10;

    let contactMatches = false;

    if (inputIsPhone && recordedPhone) {
      // Check last 10 digits match
      contactMatches = recordedPhone.slice(-10) === inputDigits.slice(-10);
    } else if (recordedEmail && recordedEmail === rawContact) {
      contactMatches = true;
    }

    if (!contactMatches) {
      // Return identical error to prevent user enumeration
      return NextResponse.json(
        {
          success: false,
          error: "No matching order found with the provided details. Please verify your order ID and contact information.",
        },
        { status: 404 }
      );
    }

    // 3. Return sanitized tracking timeline
    const sanitizedOrder = {
      order_number: order.order_number,
      order_status: order.order_status,
      payment_status: order.payment_status,
      courier_partner: order.courier_partner || "Blue Dart Express",
      tracking_number: order.tracking_number,
      estimated_delivery: order.estimated_delivery,
      destination_city: snapshot.city || "Gujarat",
      destination_postal_code: snapshot.postal_code,
      total_amount: order.total_amount,
      items: order.order_items || [],
      created_at: order.created_at,
    };

    return NextResponse.json({
      success: true,
      order: sanitizedOrder,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
