import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { normalizePhoneNumber } from "@/lib/phoneUtils";
import { validateCsrfOrigin } from "@/lib/csrf";
import type { BodyProfile } from "@/types/bodyProfile";

function sanitizeBodyProfiles(rawList: unknown): BodyProfile[] {
  if (!Array.isArray(rawList)) return [];
  const toOptNum = (v: unknown, min: number, max: number): number | null => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    if (!Number.isFinite(n) || n < min || n > max) return null;
    return Math.round(n * 10) / 10;
  };

  return rawList.slice(0, 10).map((item, idx) => {
    const rec = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    const rawGender = String(rec.gender || "female").toLowerCase();
    const gender: BodyProfile["gender"] =
      rawGender === "male" ? "male" : rawGender === "other" ? "other" : "female";
    const rawFit = String(rec.fit_preference || "regular").toLowerCase();
    const fit_preference: BodyProfile["fit_preference"] =
      rawFit === "snug" ? "snug" : rawFit === "relaxed" ? "relaxed" : "regular";

    return {
      id: String(rec.id || `bp-${Date.now()}-${idx}`).slice(0, 64),
      profile_name: String(rec.profile_name || (idx === 0 ? "My Profile" : `Family ${idx + 1}`))
        .trim()
        .slice(0, 60),
      gender,
      height_cm: toOptNum(rec.height_cm, 90, 240),
      weight_kg: toOptNum(rec.weight_kg, 25, 220),
      bust_chest_in: toOptNum(rec.bust_chest_in, 24, 65),
      waist_in: toOptNum(rec.waist_in, 20, 60),
      hip_in: toOptNum(rec.hip_in, 24, 70),
      shoulder_in: toOptNum(rec.shoulder_in, 10, 30),
      fit_preference,
      preferred_size: rec.preferred_size ? String(rec.preferred_size).trim().slice(0, 12) : undefined,
      is_default: Boolean(rec.is_default),
      updated_at: new Date().toISOString(),
    };
  });
}

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

    const bodyProfiles = Array.isArray(user.user_metadata?.body_profiles)
      ? sanitizeBodyProfiles(user.user_metadata.body_profiles)
      : [];

    return NextResponse.json({
      success: true,
      profile: profile || {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || "",
      },
      body_profiles: bodyProfiles,
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
    const { full_name, phone_number, preferred_currency, body_profiles } = body;

    const adminClient = getAdminSupabaseClient();
    const hasProfileUpdates =
      full_name !== undefined || phone_number !== undefined || preferred_currency !== undefined;

    let updatedProfile: unknown = null;
    if (hasProfileUpdates) {
      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

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
        .upsert({
          id: user.id,
          email: user.email || "",
          ...updates,
        })
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
      updatedProfile = updated;
    }

    let updatedBodyProfiles: BodyProfile[] | undefined;

    if (body_profiles !== undefined) {
      updatedBodyProfiles = sanitizeBodyProfiles(body_profiles);
      if (updatedBodyProfiles.length > 0 && !updatedBodyProfiles.some((p) => p.is_default)) {
        updatedBodyProfiles[0].is_default = true;
      }

      const { error: metaErr } = await adminClient.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...(user.user_metadata || {}),
          body_profiles: updatedBodyProfiles,
        },
      });
      if (metaErr) {
        console.error("Body profiles save error:", metaErr);
        return NextResponse.json({ success: false, error: "Failed to save body profiles." }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      ...(updatedProfile ? { profile: updatedProfile } : {}),
      ...(updatedBodyProfiles !== undefined ? { body_profiles: updatedBodyProfiles } : {}),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
