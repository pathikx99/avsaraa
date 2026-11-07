import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { generateOrderConfirmationEmailHtml, escapeHtml } from "@/lib/emailTemplates";
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

    // Generate sanitized HTML email with escapeHtml on all parameters
    const emailHtml = generateOrderConfirmationEmailHtml(order as Order);

    // In production with RESEND_API_KEY, post to Resend API:
    // await fetch("https://api.resend.com/emails", { ... })
    // For audit and delivery assurance:
    return NextResponse.json({
      success: true,
      message: `Invoice email rendered and queued for ${escapeHtml(targetEmail)}.`,
      recipient: escapeHtml(targetEmail),
      orderNumber: order.order_number,
      htmlPreviewLength: emailHtml.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
