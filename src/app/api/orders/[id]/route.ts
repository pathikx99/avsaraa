import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { verifyAdminSession } from "@/lib/jwtAdmin";
import { isSuperAdminUser } from "@/lib/adminConstants";
import { checkRateLimit } from "@/lib/rateLimit";
import { maskEmail, maskPhoneNumber } from "@/lib/phoneUtils";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const headerList = await headers();
    const forwardedFor = headerList.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown-ip";

    // Rate Limiting Protection (30 order lookups per minute per IP)
    const rateCheck = checkRateLimit(`order-lookup:${ip}`, 30, 60);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, message: "Too many requests. Please try again shortly." },
        { status: 429 }
      );
    }

    const { id } = await props.params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Order identifier required" },
        { status: 400 }
      );
    }

    // 1. Authenticate Requester (Customer or Admin)
    const serverClient = await createSupabaseServerClient();
    const {
      data: { user },
    } = await serverClient.auth.getUser();

    const adminSession = await verifyAdminSession(request);
    const isAdmin = Boolean(
      adminSession.authorized ||
      (user && isSuperAdminUser(user))
    );

    const supabase = getAdminSupabaseClient();

    // Query order with items and payments
    let query = supabase
      .from("orders")
      .select(`
        *,
        order_items (*),
        payments (*)
      `);

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (isUuid) {
      query = query.eq("id", id);
    } else {
      query = query.eq("order_number", id);
    }

    const { data: order, error } = await query.maybeSingle();

    if (error || !order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // 2. Strict Access Control & IDOR Protection:
    // a) Admin has full access
    // b) Authenticated order owner has full access
    // c) Guest order: if matching contact provided in query/header, grant full access; otherwise return masked PII summary
    const GUEST_SYSTEM_USER_ID = "7a3b2e24-820f-4706-8cc3-4218b42b0da3";
    const isOwner = Boolean(user && user.id === order.user_id);
    const isGuestOrder = Boolean(
      order.user_id === GUEST_SYSTEM_USER_ID ||
      order.shipping_address_snapshot?.is_guest === true
    );

    if (!isAdmin && !isOwner && !isGuestOrder) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Access to this order is restricted." },
        { status: user ? 403 : 401 }
      );
    }

    // Contact verification for guest orders
    const { searchParams } = new URL(request.url);
    const contactParam = (searchParams.get("contact") || headerList.get("x-order-contact") || "").trim().toLowerCase();

    let isContactVerified = false;
    if (contactParam) {
      const snap = order.shipping_address_snapshot || {};
      const orderPhone = String(snap.phone_number || "").replace(/\D/g, "");
      const orderEmail = String(snap.email || "").toLowerCase().trim();
      const inputDigits = contactParam.replace(/\D/g, "");

      if (inputDigits.length >= 10 && orderPhone) {
        isContactVerified = orderPhone.slice(-10) === inputDigits.slice(-10);
      } else if (orderEmail && orderEmail === contactParam) {
        isContactVerified = true;
      }
    }

    // Sanitize internal OTP tokens out of snapshots before sending any response
    const stripInternalTokens = (snapshot: Record<string, unknown> | null | undefined) => {
      if (!snapshot || typeof snapshot !== "object") return snapshot;
      const cleaned = { ...snapshot };
      delete cleaned.verification_tokens;
      return cleaned;
    };

    // If guest and not verified by contact, mask sensitive PII to prevent scraping
    if (isGuestOrder && !isAdmin && !isOwner && !isContactVerified) {
      const snap = order.shipping_address_snapshot || {};
      const maskedSnap = {
        ...stripInternalTokens(snap),
        recipient_name: snap.recipient_name ? `${snap.recipient_name.slice(0, 2)}••••` : "Customer",
        phone_number: snap.phone_number ? maskPhoneNumber(snap.phone_number) : "••••••••••",
        email: snap.email ? maskEmail(snap.email) : "••••@••••",
        address_line1: snap.address_line1 ? "•••• Protected Address ••••" : "",
        address_line2: null,
        landmark: null,
      };

      return NextResponse.json({
        success: true,
        order: {
          ...order,
          shipping_address_snapshot: maskedSnap,
          payments: (order.payments || []).map((p: Record<string, unknown>) => {
            const safePayment = { ...p };
            delete safePayment.raw_payload;
            return safePayment;
          }),
        },
        masked: true,
      });
    }

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        shipping_address_snapshot: stripInternalTokens(order.shipping_address_snapshot),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error retrieving order";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
