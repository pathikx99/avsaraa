import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { isSuperAdminUser } from "@/lib/adminConstants";
import { verifyAdminSession } from "@/lib/jwtAdmin";
import { checkRateLimit } from "@/lib/rateLimit";
import { validateCsrfOrigin } from "@/lib/csrf";

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    // CSRF protection for state-changing exchange requests
    const csrfCheck = validateCsrfOrigin(request);
    if (!csrfCheck.allowed) {
      return NextResponse.json(
        { success: false, error: `CSRF validation failed: ${csrfCheck.reason}` },
        { status: 403 }
      );
    }

    const { id } = await props.params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Order ID is required." },
        { status: 400 }
      );
    }

    // Authenticate patron
    const serverClient = await createSupabaseServerClient();
    const {
      data: { user },
    } = await serverClient.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please sign in to request an exchange." },
        { status: 401 }
      );
    }

    // Rate Limiting Protection (5 exchange submissions per 5 minutes per user)
    const rateCheck = checkRateLimit(`order-exchange:${user.id}`, 5, 300);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, message: `Too many exchange requests. Please wait ${rateCheck.resetSeconds} seconds.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { reason, details, requested_replacement } = body;

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { success: false, message: "Please specify a reason for your exchange request." },
        { status: 400 }
      );
    }

    const supabase = getAdminSupabaseClient();

    // Fetch order to verify ownership & status (support both UUID and order_number)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let orderLookup = supabase.from("orders").select("*");
    if (isUuid) {
      orderLookup = orderLookup.eq("id", id);
    } else {
      orderLookup = orderLookup.eq("order_number", id);
    }
    const { data: order, error: fetchErr } = await orderLookup.maybeSingle();

    if (fetchErr || !order) {
      return NextResponse.json(
        { success: false, message: "Order not found." },
        { status: 404 }
      );
    }

    // Security check: order must belong to user unless admin
    const adminSession = await verifyAdminSession(request);
    const isAdmin = Boolean(
      adminSession.authorized ||
      (user && isSuperAdminUser(user))
    );
    if (order.user_id !== user.id && !isAdmin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized to request exchange for this order." },
        { status: 403 }
      );
    }

    // Check exchange window: within 7 days of delivery
    if (order.order_status !== "Delivered") {
      return NextResponse.json(
        { success: false, message: `Exchange requests can only be initiated for delivered orders (current status: ${order.order_status}).` },
        { status: 400 }
      );
    }

    const deliveryTimestamp = new Date(order.updated_at || order.created_at).getTime();
    const daysSinceDelivery = (Date.now() - deliveryTimestamp) / (1000 * 60 * 60 * 24);
    if (daysSinceDelivery > 7) {
      return NextResponse.json(
        { success: false, message: "The 7-Day Heritage Exchange window for this order has expired." },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();
    const exchangeNote = `\n[Exchange Requested on ${new Date().toLocaleDateString("en-IN")}] Reason: ${reason.trim()}${requested_replacement ? ` | Desired Replacement: ${requested_replacement.trim()}` : ""}${details ? ` | Notes: ${details.trim()}` : ""}`;
    const updatedNotes = order.notes ? `${order.notes}${exchangeNote}` : exchangeNote.trim();

    const { data: updatedOrder, error: updateErr } = await supabase
      .from("orders")
      .update({
        order_status: "Exchange Requested",
        notes: updatedNotes,
        updated_at: nowIso,
      })
      .eq("id", order.id)
      .eq("order_status", "Delivered")
      .select(`
        *,
        order_items (*)
      `)
      .maybeSingle();

    if (updateErr) {
      console.error("Exchange update error:", updateErr);
      return NextResponse.json(
        { success: false, message: "Could not process exchange request at this time." },
        { status: 500 }
      );
    }

    if (!updatedOrder) {
      return NextResponse.json(
        { success: false, message: "Exchange request was already submitted or order status changed." },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Your 7-Day Heritage Exchange request has been received. Our concierge team will arrange doorstep pick-up.",
      order: updatedOrder,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error submitting exchange request.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

