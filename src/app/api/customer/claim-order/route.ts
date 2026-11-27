import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { validateCsrfOrigin } from "@/lib/csrf";
import { checkDbRateLimit } from "@/lib/dbRateLimit";

export async function POST(request: Request) {
  try {
    // CSRF protection for state-changing order claim
    const csrfCheck = validateCsrfOrigin(request);
    if (!csrfCheck.allowed) {
      return NextResponse.json(
        { success: false, error: `CSRF validation failed: ${csrfCheck.reason}` },
        { status: 403 }
      );
    }
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.email) {
      return NextResponse.json(
        { success: false, error: "Authentication required to claim an order" },
        { status: 401 }
      );
    }

    const rateCheck = await checkDbRateLimit(`claim-order:${user.id}`, 10, 300);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: `Too many attempts. Please retry in ${rateCheck.resetSeconds} seconds.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { orderId, orderNumber } = body;

    if (!orderId && !orderNumber) {
      return NextResponse.json(
        { success: false, error: "Order ID or Order Number required" },
        { status: 400 }
      );
    }

    const adminClient = getAdminSupabaseClient();

    const target = String(orderId || orderNumber || "").trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(target);

    // Query order
    let query = adminClient.from("orders").select("*");
    if (isUuid) {
      query = query.eq("id", target);
    } else {
      query = query.eq("order_number", target);
    }

    const { data: order, error } = await query.maybeSingle();

    if (error || !order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Security Check: Strict exact ownership match against verified user credentials (no notes substring matching)
    const isGoogleOAuth = user.app_metadata?.provider === "google";
    const isVerifiedEmail = Boolean(user.email_confirmed_at || isGoogleOAuth) && !user.email.endsWith("@phone.avsaraa.in");
    const userEmail = isVerifiedEmail ? user.email.toLowerCase().trim() : "";
    const addressEmail = order.shipping_address_snapshot?.email
      ? String(order.shipping_address_snapshot.email).toLowerCase().trim()
      : null;

    let userPhoneDigits = "";
    if (user.phone && user.phone_confirmed_at) {
      userPhoneDigits = user.phone.replace(/\D/g, "").slice(-10);
    } else {
      const { data: prof } = await adminClient
        .from("profiles")
        .select("phone_number, phone_verified")
        .eq("id", user.id)
        .maybeSingle();
      if (prof?.phone_verified && prof.phone_number) {
        userPhoneDigits = String(prof.phone_number).replace(/\D/g, "").slice(-10);
      }
    }

    const addressPhone = order.shipping_address_snapshot?.phone_number
      ? String(order.shipping_address_snapshot.phone_number).replace(/\D/g, "").slice(-10)
      : "";

    const emailMatches = Boolean(addressEmail && userEmail && addressEmail === userEmail);
    const phoneMatches = Boolean(userPhoneDigits.length === 10 && addressPhone.length === 10 && userPhoneDigits === addressPhone);

    // If order is already owned by this user
    if (order.user_id === user.id) {
      return NextResponse.json({
        success: true,
        message: "Order is already linked to your account.",
        order,
      });
    }

    const GUEST_SYSTEM_USER_ID = "7a3b2e24-820f-4706-8cc3-4218b42b0da3";
    const isGuestOrder = !order.user_id || order.user_id === GUEST_SYSTEM_USER_ID;

    // Prevent taking over an order that is already assigned to another user
    if (order.user_id && !isGuestOrder && order.user_id !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "This order is already linked to another registered account.",
        },
        { status: 403 }
      );
    }

    if (!emailMatches && !phoneMatches) {
      return NextResponse.json(
        {
          success: false,
          error: "Claim verification failed: Your account email or phone number does not match this order.",
        },
        { status: 403 }
      );
    }

    // Transfer ownership to authenticated customer
    const { data: updatedOrder, error: updateError } = await adminClient
      .from("orders")
      .update({
        user_id: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: "Failed to link order to account." },
        { status: 500 }
      );
    }

    const sanitizeOrderSnapshot = (rawOrder: typeof updatedOrder) => {
      if (!rawOrder?.shipping_address_snapshot || typeof rawOrder.shipping_address_snapshot !== "object") {
        return rawOrder;
      }
      const cleanedSnap = { ...(rawOrder.shipping_address_snapshot as Record<string, unknown>) };
      delete cleanedSnap.verification_tokens;
      return { ...rawOrder, shipping_address_snapshot: cleanedSnap };
    };

    return NextResponse.json({
      success: true,
      message: "Order successfully claimed and linked to your account.",
      order: sanitizeOrderSnapshot(updatedOrder),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
