import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { verifyAdminSession } from "@/lib/jwtAdmin";
import { isSuperAdminUser } from "@/lib/adminConstants";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Order identifier required" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const checkoutSecret = searchParams.get("checkout_id") || request.headers.get("x-checkout-id");

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

    if (id.startsWith("AVS-")) {
      query = query.eq("order_number", id);
    } else {
      query = query.eq("id", id);
    }

    const { data: order, error } = await query.maybeSingle();

    if (error || !order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // 2. Strict Access Control & IDOR Protection:
    // Access is granted ONLY IF:
    // a) Requester is an authorized Admin
    // b) Requester is the authenticated owner (user.id === order.user_id)
    // c) Requester has a matching secret checkout_id (for guest confirmation immediately post-purchase)
    const isOwner = Boolean(user && user.id === order.user_id);
    const isMatchingSecret = Boolean(checkoutSecret && checkoutSecret === order.id);

    if (!isAdmin && !isOwner && !isMatchingSecret) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Access to this order is restricted." },
        { status: user ? 403 : 401 }
      );
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error retrieving order";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
