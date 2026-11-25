import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { normalizePhoneNumber } from "@/lib/phoneUtils";
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
    const { data: profile, error } = await adminClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Profile query error:", error);
      return NextResponse.json({ success: false, error: "Failed to retrieve profile." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      profile: profile || {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || "",
      },
    });
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
    const { full_name, phone_number, preferred_currency } = body;

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    const adminClient = getAdminSupabaseClient();
    const { data: currentProfile } = await adminClient
      .from("profiles")
      .select("phone_number")
      .eq("id", user.id)
      .maybeSingle();

    if (full_name !== undefined) updates.full_name = String(full_name).trim().slice(0, 100);
    if (phone_number !== undefined) {
      let nextPhone: string | null = null;
      if (phone_number && String(phone_number).trim()) {
        const phoneValidation = normalizePhoneNumber(String(phone_number));
        if (!phoneValidation.isValid) {
          return NextResponse.json(
            { success: false, error: phoneValidation.error || "Invalid mobile number format." },
            { status: 400 }
          );
        }
        nextPhone = phoneValidation.normalized;
      }
      updates.phone_number = nextPhone;
      if (nextPhone !== (currentProfile?.phone_number ?? null)) {
        updates.phone_verified = false;
        updates.phone_verified_at = null;
      }
    }
    if (preferred_currency !== undefined) updates.preferred_currency = String(preferred_currency).trim();

    const { data: updated, error } = await adminClient
      .from("profiles")
      .update(updates)
      .eq("id", user.id) // Strictly scoped to session
      .select()
      .single();

    if (error) {
      console.error("Profile update error:", error);
      if (error.code === "23505") {
        return NextResponse.json(
          { success: false, error: "This mobile number is already linked to another account." },
          { status: 409 }
        );
      }
      return NextResponse.json({ success: false, error: "Failed to update profile details." }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
