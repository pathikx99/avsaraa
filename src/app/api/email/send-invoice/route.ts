import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { generateOrderConfirmationEmailHtml, escapeHtml } from "@/lib/emailTemplates";
import { sendCustomerOrderInvoice } from "@/lib/emailService";
import { Order } from "@/types/order";
import { isSuperAdminUser } from "@/lib/adminConstants";
import { verifyAdminSession } from "@/lib/jwtAdmin";

export async function POST(request: Request) {
  try {
    const serverClient = await createSupabaseServerClient();
    const {
      data: { user },
    } = await serverClient.auth.getUser();

    const adminSession = await verifyAdminSession(request);
    const isAdmin = Boolean(
      adminSession.authorized ||
      (user && isSuperAdminUser(user))
    );

    const body = await request.json();
    const { orderId, recipientEmail } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order ID required" },
        { status: 400 }
      );
    }

    const adminClient = getAdminSupabaseClient();
    const { data: order, error } = await adminClient
      .from("orders")
      .select(`
        *,
        order_items (*)
      `)
      .eq("id", orderId)
      .maybeSingle();

    if (error || !order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    // Access control: only order owner or admin
    if (!isAdmin && (!user || user.id !== order.user_id)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access to order invoice." },
        { status: 403 }
      );
    }

    const targetEmail = recipientEmail || user?.email || order.shipping_address_snapshot?.email;

    if (!targetEmail) {
      return NextResponse.json(
        { success: false, error: "Recipient email address not found." },
        { status: 400 }
      );
    }

    // Prepare order copy with target email if specified
    const orderForDispatch: Order = {
      ...(order as Order),
      shipping_address_snapshot: {
        ...(order.shipping_address_snapshot || {}),
        email: targetEmail,
      },
    };

    // Generate sanitized HTML email with escapeHtml on all parameters
    const emailHtml = generateOrderConfirmationEmailHtml(orderForDispatch);

    // Dispatch official tax invoice / bill via order@avsaraa.in
    const dispatchResult = await sendCustomerOrderInvoice(orderForDispatch);

    return NextResponse.json({
      success: dispatchResult.success,
      message: dispatchResult.success
        ? `Invoice bill dispatched to ${escapeHtml(targetEmail)} from order@avsaraa.in.`
        : `Invoice queued. Dispatch note: ${dispatchResult.error || "Simulated mode"}`,
      recipient: escapeHtml(targetEmail),
      orderNumber: order.order_number,
      htmlPreviewLength: emailHtml.length,
      simulated: dispatchResult.simulated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
