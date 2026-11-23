import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { sendInquiryAcknowledgementEmail } from "@/lib/emailService";
import { checkRateLimit } from "@/lib/rateLimit";
import { validateCsrfOrigin } from "@/lib/csrf";

export async function POST(request: Request) {
  try {
    // CSRF protection for inquiry submission
    const csrfCheck = validateCsrfOrigin(request);
    if (!csrfCheck.allowed) {
      return NextResponse.json(
        { success: false, error: `CSRF validation failed: ${csrfCheck.reason}` },
        { status: 403 }
      );
    }
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
    const rateCheck = checkRateLimit(`inquiry-submit:${ip}`, 5, 300);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many inquiries submitted. Please wait a few moments before sending another message.",
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid request payload." },
        { status: 400 }
      );
    }

    const fullName = String(body.full_name || body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone_number || body.phone || "").trim() || null;
    const subject = String(body.subject || "Customer Inquiry").trim();
    const message = String(body.message || "").trim();

    // Derive user_id from verified server session rather than trusting client-supplied parameter
    let verifiedUserId: string | null = null;
    try {
      const serverClient = await createSupabaseServerClient();
      const { data: { user } } = await serverClient.auth.getUser();
      verifiedUserId = user?.id || null;
    } catch {
      // Unauthenticated visitor
    }

    if (!fullName || !email || !message) {
      return NextResponse.json(
        { success: false, error: "Please provide your name, email, and message." },
        { status: 400 }
      );
    }

    if (!email.includes("@") || email.length < 5) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getAdminSupabaseClient();

    // Support both schema naming variants: 'name' (live DB schema) vs 'full_name' (clean SQL migration)
    const primaryPayload: Record<string, unknown> = {
      name: fullName,
      email,
      phone_number: phone,
      subject,
      message,
      user_id: verifiedUserId,
      status: "New",
    };

    let { data, error } = await supabaseAdmin
      .from("contact_inquiries")
      .insert([primaryPayload])
      .select()
      .single();

    // Fallback if schema has 'full_name' column or 'Unread' status instead
    if (error && (error.message?.includes("name") || error.code === "PGRST204" || error.code === "23514")) {
      const fallbackPayload: Record<string, unknown> = {
        full_name: fullName,
        email,
        phone_number: phone,
        subject,
        message,
        user_id: verifiedUserId,
        status: "Unread",
      };
      const retry = await supabaseAdmin
        .from("contact_inquiries")
        .insert([fallbackPayload])
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error("[InquiriesAPI:InsertError]", error);
      return NextResponse.json(
        { success: false, error: "Failed to submit inquiry. Please try again." },
        { status: 500 }
      );
    }

    // Automatically send brand-aligned acknowledgement email from support@avsaraa.in
    const emailResult = await sendInquiryAcknowledgementEmail({
      customerName: fullName,
      customerEmail: email,
      subject,
      message,
      inquiryId: data?.id,
    });

    return NextResponse.json({
      success: true,
      message: "Thank you! Your inquiry has been received and an acknowledgement email has been sent.",
      data,
      emailResult,
    });
  } catch (err: unknown) {
    console.error("[InquiriesAPI:Exception]", err);
    const message = err instanceof Error ? err.message : "Internal error occurred";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
