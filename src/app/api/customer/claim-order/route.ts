import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
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

    const body = await request.json();
    const { orderId, orderNumber, checkoutUuid } = body;

    if (!orderId && !orderNumber) {
      return NextResponse.json(
        { success: false, error: "Order ID or Order Number required" },
        { status: 400 }
      );
    }

    const adminClient = getAdminSupabaseClient();

    // Query order
    let query = adminClient.from("orders").select("*");
    if (orderId) {
      query = query.eq("id", orderId);
    } else {
      query = query.eq("order_number", orderNumber);
    }

    const { data: order, error } = await query.maybeSingle();

    if (error || !order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Security Check: Order claiming verification
    const userEmail = user.email.toLowerCase().trim();
    const addressEmail = order.shipping_address_snapshot?.email
      ? String(order.shipping_address_snapshot.email).toLowerCase().trim()
      : null;
    const orderNotes = order.notes ? String(order.notes).toLowerCase() : "";

    const emailMatches = Boolean(addressEmail && addressEmail === userEmail) || orderNotes.includes(userEmail);
    const checkoutUuidMatches = Boolean(checkoutUuid && order.id === checkoutUuid);

    // If order is already owned by this user
    if (order.user_id === user.id) {
      return NextResponse.json({
        success: true,
        message: "Order is already linked to your account.",
        order,
      });
    }

    if (!emailMatches && !checkoutUuidMatches) {
      return NextResponse.json(
        {
          success: false,
          error: "Claim verification failed: The email or checkout UUID does not match this order.",
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

    return NextResponse.json({
      success: true,
      message: "Order successfully claimed and linked to your account.",
      order: updatedOrder,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
