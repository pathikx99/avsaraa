import { NextResponse } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { authenticateAdminRequest } from "@/lib/adminAuth";
import { sendInquiryAcknowledgementEmail } from "@/lib/emailService";

export async function GET() {
  try {
    const auth = await authenticateAdminRequest();
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const supabaseAdmin = getAdminSupabaseClient();

    const { data: inquiries, error: inqErr } = await supabaseAdmin
      .from("contact_inquiries")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: subscribers, error: subErr } = await supabaseAdmin
      .from("newsletter_subscribers")
      .select("*")
      .order("created_at", { ascending: false });

    return NextResponse.json({
      success: true,
      inquiries: (!inqErr && inquiries) ? inquiries : [],
      subscribers: (!subErr && subscribers) ? subscribers : [],
    });
  } catch (err: unknown) {
    console.error("Inquiries GET exception:", err);
    return NextResponse.json({ success: false, error: "An unexpected error occurred while fetching inquiries." }, { status: 500 });
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
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: "Missing inquiry ID or status." }, { status: 400 });
    }

    const validStatuses = ["Unread", "In Progress", "Resolved", "Archived"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status value." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("contact_inquiries")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Inquiry status update database error:", error);
      return NextResponse.json({ success: false, error: "Failed to update inquiry status." }, { status: 500 });
    }

    return NextResponse.json({ success: true, data, message: "Inquiry status updated." });
  } catch (err: unknown) {
    console.error("Inquiry PATCH exception:", err);
    return NextResponse.json({ success: false, error: "An unexpected error occurred while updating inquiry." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await authenticateAdminRequest();
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const supabaseAdmin = getAdminSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const target = searchParams.get("target") || "inquiry"; // "inquiry" | "subscriber"

    if (!id) {
      return NextResponse.json({ success: false, error: "Record ID is required." }, { status: 400 });
    }

    const tableName = target === "subscriber" ? "newsletter_subscribers" : "contact_inquiries";
    const { error } = await supabaseAdmin.from(tableName).delete().eq("id", id);

    if (error) {
      console.error("Inquiry delete database error:", error);
      return NextResponse.json({ success: false, error: "Failed to delete inquiry record." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `${target === "subscriber" ? "Subscriber" : "Inquiry"} deleted successfully.` });
  } catch (err: unknown) {
    console.error("Inquiry DELETE exception:", err);
    return NextResponse.json({ success: false, error: "An unexpected error occurred while deleting record." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getAdminSupabaseClient();
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "Invalid request payload." }, { status: 400 });
    }

    // Action 1: Admin manually sends or resends an acknowledgement email for an existing inquiry
    if (body.action === "acknowledge") {
      const auth = await authenticateAdminRequest();
      if (!auth.authorized) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
      }

      const inquiryId = body.id;
      if (!inquiryId) {
        return NextResponse.json({ success: false, error: "Inquiry ID is required to send acknowledgement." }, { status: 400 });
      }

      const { data: inquiry, error: fetchErr } = await supabaseAdmin
        .from("contact_inquiries")
        .select("*")
        .eq("id", inquiryId)
        .maybeSingle();

      if (fetchErr || !inquiry) {
        return NextResponse.json({ success: false, error: "Inquiry record not found." }, { status: 404 });
      }

      const emailResult = await sendInquiryAcknowledgementEmail({
        customerName: inquiry.full_name,
        customerEmail: inquiry.email,
        subject: inquiry.subject,
        message: inquiry.message,
        inquiryId: inquiry.id,
      });

      return NextResponse.json({
        success: emailResult.success,
        message: emailResult.success
          ? `Acknowledgement email dispatched to ${inquiry.email} from support@avsaraa.in.`
          : `Acknowledgement queued. Note: ${emailResult.error}`,
        emailResult,
      });
    }

    // Action 2: Direct submission of an inquiry (e.g. from B2B wholesale form)
    const fullName = String(body.full_name || body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone_number || body.phone || "").trim() || null;
    const subject = String(body.subject || "Customer Inquiry").trim();
    const message = String(body.message || "").trim();
    const userId = body.user_id && typeof body.user_id === "string" ? body.user_id : null;

    if (!fullName || !email || !message) {
      return NextResponse.json(
        { success: false, error: "Please provide your name, email, and message." },
        { status: 400 }
      );
    }

    if (!email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("contact_inquiries")
      .insert([
        {
          full_name: fullName,
          email,
          phone_number: phone,
          subject,
          message,
          user_id: userId,
          status: "Unread",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("[InquiriesPOST:InsertError]", error);
      return NextResponse.json(
        { success: false, error: "Failed to create inquiry record." },
        { status: 500 }
      );
    }

    // Send enquiry acknowledgement email from support@avsaraa.in
    const emailResult = await sendInquiryAcknowledgementEmail({
      customerName: fullName,
      customerEmail: email,
      subject,
      message,
      inquiryId: data?.id,
    });

    return NextResponse.json({
      success: true,
      message: "Inquiry registered and acknowledgement email sent.",
      data,
      emailResult,
    });
  } catch (err: unknown) {
    console.error("Inquiries POST exception:", err);
    return NextResponse.json({ success: false, error: "An unexpected error occurred while processing inquiry." }, { status: 500 });
  }
}
