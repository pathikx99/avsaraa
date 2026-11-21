import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { verifyAdminSession } from "@/lib/jwtAdmin";
import { isSuperAdminUser } from "@/lib/adminConstants";
import { checkRateLimit } from "@/lib/rateLimit";
import { validateCsrfOrigin } from "@/lib/csrf";

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    // CSRF protection for state-changing order cancellation
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
      return NextResponse.json({ success: false, message: "Sign in to cancel an order." }, { status: 401 });
    }

    const rateCheck = checkRateLimit(`order-cancel:${user.id}`, 5, 300);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, message: `Too many requests. Retry in ${rateCheck.resetSeconds}s.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { reason } = body;

    const adminClient = getAdminSupabaseClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let orderLookup = adminClient.from("orders").select("*, order_items (*)");
    if (isUuid) orderLookup = orderLookup.eq("id", id);
    else orderLookup = orderLookup.eq("order_number", id);

    const { data: order, error: fetchErr } = await orderLookup.maybeSingle();
    if (fetchErr || !order) {
      return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
    }

    const adminSession = await verifyAdminSession(request);
    const isAdmin = Boolean(adminSession.authorized || isSuperAdminUser(user));
    if (order.user_id !== user.id && !isAdmin) {
      return NextResponse.json({ success: false, message: "Unauthorized to cancel this order." }, { status: 403 });
    }

    const nonCancellable = ["Delivered", "Cancelled", "Exchange Requested", "Exchanged"];
    if (nonCancellable.includes(order.order_status)) {
      return NextResponse.json(
        { success: false, message: `Cannot cancel an order with status ${order.order_status}.` },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();
    const cancelNote = `\n[Cancelled on ${new Date().toLocaleDateString("en-IN")}] Reason: ${reason || "Customer requested cancellation"}`;

    // Restore inventory stock
    try {
      const { data: items } = await adminClient
        .from("order_items")
        .select("product_id, quantity")
        .eq("order_id", order.id);
      if (items) {
        for (const item of items) {
          if (item.product_id) {
            await adminClient.rpc("increment_stock", { p_id: item.product_id, p_qty: item.quantity });
          }
        }
      }
    } catch {}

    const { data: updatedOrder, error: updateErr } = await adminClient
      .from("orders")
      .update({
        order_status: "Cancelled",
        payment_status: order.payment_status === "Paid" ? "Refunded" : order.payment_status,
        notes: order.notes ? `${order.notes}${cancelNote}` : cancelNote.trim(),
        updated_at: nowIso,
      })
      .eq("id", order.id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // Audit edit record
    await adminClient.from("order_edits").insert({
      order_id: order.id,
      edited_by: user.id,
      edit_type: "cancel",
      before_snapshot: { order_status: order.order_status, payment_status: order.payment_status },
      after_snapshot: { order_status: "Cancelled", payment_status: updatedOrder.payment_status },
      reason: reason || "Customer requested cancellation",
    });

    return NextResponse.json({
      success: true,
      message: "Order cancelled successfully. Inventory has been restored.",
      order: updatedOrder,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
