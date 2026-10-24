import { NextResponse } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { authenticateAdminRequest } from "@/lib/adminAuth";

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
