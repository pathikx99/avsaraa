import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { validateCsrfOrigin } from "@/lib/csrf";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = getAdminSupabaseClient();
    const { data: addresses, error } = await adminClient
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false });

    if (error) {
      console.error("Address query error:", error);
      return NextResponse.json({ success: false, error: "Failed to retrieve addresses." }, { status: 500 });
    }

    return NextResponse.json({ success: true, addresses: addresses || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const csrfCheck = validateCsrfOrigin(request);
    if (!csrfCheck.allowed) {
      return NextResponse.json(
        { success: false, error: `CSRF validation failed: ${csrfCheck.reason}` },
        { status: 403 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      recipient_name,
      phone_number,
      address_line1,
      address_line2,
      landmark,
      city,
      state,
      postal_code,
      country = "India",
      address_type = "Home",
      is_default = false,
    } = body;

    if (!recipient_name || !phone_number || !address_line1 || !city || !postal_code) {
      return NextResponse.json(
        { success: false, error: "Missing required address fields" },
        { status: 400 }
      );
    }

    const adminClient = getAdminSupabaseClient();

    // If default, reset other addresses for this user
    if (is_default) {
      await adminClient
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", user.id);
    }

    const { data: created, error } = await adminClient
      .from("addresses")
      .insert({
        user_id: user.id, // Strictly scoped to session
        recipient_name: String(recipient_name).trim(),
        phone_number: String(phone_number).trim(),
        address_line1: String(address_line1).trim(),
        address_line2: address_line2 ? String(address_line2).trim() : null,
        landmark: landmark ? String(landmark).trim() : null,
        city: String(city).trim(),
        state: String(state || "Gujarat").trim(),
        postal_code: String(postal_code).trim(),
        country: String(country).trim(),
        address_type: String(address_type).trim(),
        is_default: Boolean(is_default),
      })
      .select()
      .single();

    if (error) {
      console.error("Address insert error:", error);
      return NextResponse.json({ success: false, error: "Failed to save delivery address." }, { status: 500 });
    }

    return NextResponse.json({ success: true, address: created });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const csrfCheck = validateCsrfOrigin(request);
    if (!csrfCheck.allowed) {
      return NextResponse.json(
        { success: false, error: `CSRF validation failed: ${csrfCheck.reason}` },
        { status: 403 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ success: false, error: "Valid Address ID required" }, { status: 400 });
    }

    const adminClient = getAdminSupabaseClient();

    // Verify ownership first (Strict IDOR prevention)
    const { data: existing } = await adminClient
      .from("addresses")
      .select("id, user_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Address not found or unauthorized access" },
        { status: 404 }
      );
    }

    // Strict Whitelisting to prevent Mass Assignment and ownership tampering
    const allowedFields = [
      "recipient_name",
      "phone_number",
      "address_line1",
      "address_line2",
      "landmark",
      "city",
      "state",
      "postal_code",
      "country",
      "address_type",
      "is_default",
    ] as const;

    const sanitizedUpdates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        if (field === "is_default") {
          sanitizedUpdates[field] = Boolean(body[field]);
        } else if (body[field] === null) {
          sanitizedUpdates[field] = null;
        } else {
          sanitizedUpdates[field] = String(body[field]).trim();
        }
      }
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      return NextResponse.json(
        { success: false, error: "No editable address fields provided" },
        { status: 400 }
      );
    }

    // If making this address the default, unmark other user addresses
    if (sanitizedUpdates.is_default) {
      await adminClient
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", user.id);
    }

    const { data: updated, error } = await adminClient
      .from("addresses")
      .update(sanitizedUpdates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Address query error:", error);
      return NextResponse.json({ success: false, error: "Failed to retrieve addresses." }, { status: 500 });
    }

    return NextResponse.json({ success: true, address: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const csrfCheck = validateCsrfOrigin(request);
    if (!csrfCheck.allowed) {
      return NextResponse.json(
        { success: false, error: `CSRF validation failed: ${csrfCheck.reason}` },
        { status: 403 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Address ID required" }, { status: 400 });
    }

    const adminClient = getAdminSupabaseClient();

    // Verify ownership and delete (Strict IDOR prevention)
    const { error } = await adminClient
      .from("addresses")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Address query error:", error);
      return NextResponse.json({ success: false, error: "Failed to retrieve addresses." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Address deleted successfully" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
