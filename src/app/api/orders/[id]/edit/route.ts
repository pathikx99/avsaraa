import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { verifyAdminSession } from "@/lib/jwtAdmin";
import { isSuperAdminUser } from "@/lib/adminConstants";
import { checkRateLimit } from "@/lib/rateLimit";
import { validateCsrfOrigin } from "@/lib/csrf";
import { isValidIndianPincode } from "@/lib/financials";

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    // CSRF protection for state-changing order editing
    const csrfCheck = validateCsrfOrigin(request);
    if (!csrfCheck.allowed) {
      return NextResponse.json(
        { success: false, error: `CSRF validation failed: ${csrfCheck.reason}` },
        { status: 403 }
      );
    }

    const { id } = await props.params;
    if (!id) {
      return NextResponse.json({ success: false, message: "Order ID required." }, { status: 400 });
    }

    const serverClient = await createSupabaseServerClient();
    const { data: { user } } = await serverClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Sign in to edit an order." }, { status: 401 });
    }

    const rateCheck = checkRateLimit(`order-edit:${user.id}`, 10, 300);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, message: `Too many requests. Retry in ${rateCheck.resetSeconds}s.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { reason, shipping_address_snapshot, notes } = body;

    const adminClient = getAdminSupabaseClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let orderLookup = adminClient.from("orders").select("*");
    if (isUuid) orderLookup = orderLookup.eq("id", id);
    else orderLookup = orderLookup.eq("order_number", id);

    const { data: order, error: fetchErr } = await orderLookup.maybeSingle();
    if (fetchErr || !order) {
      return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
    }

    const adminSession = await verifyAdminSession(request);
    const isAdmin = Boolean(adminSession.authorized || isSuperAdminUser(user));
    if (order.user_id !== user.id && !isAdmin) {
      return NextResponse.json({ success: false, message: "Unauthorized to edit this order." }, { status: 403 });
    }

    const nonEditable = ["Dispatched", "Out for Delivery", "Delivered", "Cancelled", "Exchange Requested", "Exchanged"];
    if (nonEditable.includes(order.order_status)) {
      return NextResponse.json(
        { success: false, message: `Cannot edit an order with status ${order.order_status}.` },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();
    const updateFields: Record<string, unknown> = { updated_at: nowIso };
    if (shipping_address_snapshot) {
      const postalCode = shipping_address_snapshot.postal_code;
      if (!postalCode || !isValidIndianPincode(postalCode)) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid postal code: Pin code "${postalCode || "empty"}" must be a valid 6-digit Indian PIN code.`,
          },
          { status: 400 }
        );
      }
      if (
        !shipping_address_snapshot.recipient_name ||
        !shipping_address_snapshot.phone_number ||
        !shipping_address_snapshot.address_line1 ||
        !shipping_address_snapshot.city
      ) {
        return NextResponse.json(
          { success: false, message: "A complete delivery address is required." },
          { status: 400 }
        );
      }
      updateFields.shipping_address_snapshot = shipping_address_snapshot;
    }
    if (notes !== undefined) {
      updateFields.notes = typeof notes === "string" ? notes.trim().slice(0, 1000) : null;
    }

    const derivedEditType = shipping_address_snapshot ? "address_change" : "note_change";
    const safeBeforeSnapshot: Record<string, unknown> = {};
    const safeAfterSnapshot: Record<string, unknown> = {};
    if (shipping_address_snapshot) {
      safeBeforeSnapshot.shipping_address_snapshot = order.shipping_address_snapshot;
      safeAfterSnapshot.shipping_address_snapshot = updateFields.shipping_address_snapshot;
    }
    if (notes !== undefined) {
      safeBeforeSnapshot.notes = order.notes ?? null;
      safeAfterSnapshot.notes = updateFields.notes;
    }

    const existingHistory = Array.isArray((order as { edit_history?: unknown[] }).edit_history)
      ? ((order as { edit_history?: unknown[] }).edit_history as unknown[])
      : [];
    updateFields.edit_history = [
      ...existingHistory,
      {
        edited_by: user.id,
        edit_type: derivedEditType,
        before_snapshot: safeBeforeSnapshot,
        after_snapshot: safeAfterSnapshot,
        reason: typeof reason === "string" ? reason.trim().slice(0, 500) : null,
        created_at: nowIso,
      },
    ];

    const { data: updatedOrder, error: updateErr } = await adminClient
      .from("orders")
      .update(updateFields)
      .eq("id", order.id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    return NextResponse.json({
      success: true,
      message: "Order updated successfully.",
      order: updatedOrder,
    });
  } catch (err: unknown) {
    console.error("Order edit exception:", err);
    return NextResponse.json({ success: false, message: "Unable to update order right now." }, { status: 500 });
  }
}
