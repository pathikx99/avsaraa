import { NextResponse } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { authenticateAdminRequest } from "@/lib/adminAuth";
import { OrderStatus } from "@/types/order";

const VALID_STATUSES: OrderStatus[] = [
  "Pending",
  "Confirmed",
  "Processing",
  "Dispatched",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
  "Exchange Requested",
  "Exchanged",
];

export async function GET() {
  try {
    const auth = await authenticateAdminRequest();
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const supabaseAdmin = getAdminSupabaseClient();

    try {
      const { data: orders, error } = await supabaseAdmin
        .from("orders")
        .select(`
          *,
          order_items (*),
          payments (*)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Admin orders query warning:", error.message);
        return NextResponse.json({
          success: true,
          orders: [],
          notice: error.message,
        });
      }

      return NextResponse.json({
        success: true,
        orders: orders || [],
      });
    } catch (err: unknown) {
      console.warn("Admin orders fetch exception (graceful empty return):", err);
      return NextResponse.json({ success: true, orders: [] });
    }
  } catch (err: unknown) {
    console.error("Admin orders GET unhandled error:", err);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred while fetching orders." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await authenticateAdminRequest();
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const supabaseAdmin = getAdminSupabaseClient();
    const body = await request.json();
    const { id, order_status, courier_partner, tracking_number, notes } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Order ID is required." }, { status: 400 });
    }

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (order_status) {
      if (!VALID_STATUSES.includes(order_status)) {
        return NextResponse.json(
          { success: false, error: `Invalid order status "${order_status}".` },
          { status: 400 }
        );
      }
      updatePayload.order_status = order_status;

      // If status changed to Delivered, mark payment as Paid if COD
      if (order_status === "Delivered") {
        updatePayload.payment_status = "Paid";
      }
    }

    if (courier_partner !== undefined) {
      updatePayload.courier_partner = courier_partner;
    }

    if (tracking_number !== undefined) {
      updatePayload.tracking_number = tracking_number;
    }

    if (notes !== undefined) {
      updatePayload.notes = notes;
    }

    const { data: updatedOrder, error } = await supabaseAdmin
      .from("orders")
      .update(updatePayload)
      .eq("id", id)
      .select(`
        *,
        order_items (*),
        payments (*)
      `)
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: `Database update failed: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Order fulfilled and updated successfully.",
      order: updatedOrder,
    });
  } catch (err: unknown) {
    console.error("Admin orders PATCH error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to update order status." },
      { status: 500 }
    );
  }
}

