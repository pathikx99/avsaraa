import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { rateLimitOrderTracking } from "@/lib/rateLimit";
import { trackShiprocketShipment } from "@/lib/shiprocket";
import { maskEmail, maskPhoneNumber } from "@/lib/phoneUtils";

async function processTrackingRequest(rawOrderId: string, rawContact: string) {
  const adminClient = getAdminSupabaseClient();

  // Check if caller has an active customer or admin session
  let authenticatedUserId: string | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.id) {
      authenticatedUserId = user.id;
    }
  } catch {
    // Unauthenticated caller
  }

  let query = adminClient
    .from("orders")
    .select(`
      id,
      user_id,
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

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawOrderId);
  if (isUuid) {
    query = query.eq("id", rawOrderId);
  } else {
    query = query.eq("order_number", rawOrderId);
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

  // 2. Access Verification:
  // a) Authenticated user who owns this order
  // b) Otherwise, dual contact verification matching phone or email
  const isDirectOwner = Boolean(authenticatedUserId && authenticatedUserId === order.user_id);

  if (!isDirectOwner) {
    if (!rawContact) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter your registered phone number or email address for parcel security verification.",
        },
        { status: 400 }
      );
    }

    const snapshot = order.shipping_address_snapshot || {};
    const recordedPhone = String(snapshot.phone_number || "").replace(/\D/g, "");
    const recordedEmail = String(snapshot.email || "").toLowerCase().trim();

    const inputDigits = rawContact.replace(/\D/g, "");
    const inputIsPhone = inputDigits.length >= 10;

    let contactMatches = false;
    if (inputIsPhone && recordedPhone) {
      contactMatches = recordedPhone.slice(-10) === inputDigits.slice(-10);
    } else if (recordedEmail && recordedEmail === rawContact) {
      contactMatches = true;
    }

    if (!contactMatches) {
      return NextResponse.json(
        {
          success: false,
          error: "No matching order found with the provided details. Please verify your order ID and contact information.",
        },
        { status: 404 }
      );
    }
  }

  const snapshot = order.shipping_address_snapshot || {};

  // 3. Query Live Carrier / Shiprocket tracking milestones
  const trackingData = await trackShiprocketShipment({
    orderNumber: order.order_number,
    orderId: order.id,
    awb: order.tracking_number,
    orderStatus: order.order_status,
    createdAt: order.created_at,
    city: snapshot.city || "Gujarat",
    postalCode: snapshot.postal_code || "395007",
    courierPartner: order.courier_partner || "Blue Dart Express Gujarat",
  });

  const sanitizedOrder = {
    order_number: order.order_number,
    order_status: trackingData.current_status || order.order_status,
    payment_status: order.payment_status,
    courier_partner: trackingData.courier_name || order.courier_partner || "Blue Dart Express",
    tracking_number: trackingData.awb_code || order.tracking_number,
    estimated_delivery: trackingData.estimated_delivery || order.estimated_delivery,
    etd: trackingData.etd,
    destination_city: snapshot.city || "Gujarat",
    destination_postal_code: snapshot.postal_code,
    masked_phone: snapshot.phone_number ? maskPhoneNumber(snapshot.phone_number) : undefined,
    masked_email: snapshot.email ? maskEmail(snapshot.email) : undefined,
    total_amount: order.total_amount,
    items: order.order_items || [],
    created_at: order.created_at,
    activities: trackingData.activities || [],
    tracking_source: trackingData.source,
  };

  return NextResponse.json({
    success: true,
    order: sanitizedOrder,
  });
}

export async function POST(request: Request) {
  try {
    const headerList = await headers();
    const forwardedFor = headerList.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown-ip";

    // Rate Limiting Protection (15 requests per minute)
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

    if (!rawOrderId) {
      return NextResponse.json(
        { success: false, error: "Order ID or Order Number is required." },
        { status: 400 }
      );
    }

    return await processTrackingRequest(rawOrderId, rawContact);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const headerList = await headers();
    const forwardedFor = headerList.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown-ip";

    // Rate Limiting Protection (15 requests per minute)
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

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId") || searchParams.get("id");
    const contact = searchParams.get("contact") || searchParams.get("phone") || searchParams.get("email");

    const rawOrderId = String(orderId || "").trim();
    const rawContact = String(contact || "").trim().toLowerCase();

    if (!rawOrderId) {
      return NextResponse.json(
        { success: false, error: "Order ID parameter is required." },
        { status: 400 }
      );
    }

    return await processTrackingRequest(rawOrderId, rawContact);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
