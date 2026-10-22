import { NextResponse } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { normalizePhoneNumber, maskEmail, maskPhoneNumber } from "@/lib/phoneUtils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phoneNumber, countryCode = "+91", currentUserId } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        {
          valid: false,
          available: false,
          error: "Please enter a mobile number to validate.",
        },
        { status: 400 }
      );
    }

    // 1. Format and Validate phone number structure
    const validation = normalizePhoneNumber(phoneNumber, countryCode);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          valid: false,
          available: false,
          error: validation.error || "Invalid mobile number format.",
        },
        { status: 400 }
      );
    }

    const { normalized, formatted } = validation;
    const digitsOnly = normalized.replace(/\D/g, "");
    const last10Digits = digitsOnly.slice(-10);

    const supabaseAdmin = getAdminSupabaseClient();

    // 2. Query public.profiles using admin client to check for conflicts
    // We check both exact normalized string, stripped format, and last 10 digits
    // to catch any legacy or differently formatted records.
    let query = supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, phone_number")
      .or(
        `phone_number.eq.${normalized},phone_number.eq.${digitsOnly},phone_number.ilike.%${last10Digits}`
      );

    if (currentUserId && typeof currentUserId === "string") {
      query = query.neq("id", currentUserId);
    }

    const { data: existingProfiles, error: queryError } = await query;

    if (queryError) {
      console.error("Database error while checking phone uniqueness:", queryError);
      return NextResponse.json(
        {
          valid: true,
          available: false,
          error: "Could not verify phone availability. Please try again.",
        },
        { status: 500 }
      );
    }

    // 3. Handle conflict if existing profile found
    if (existingProfiles && existingProfiles.length > 0) {
      const match = existingProfiles[0];
      const maskedMail = match.email ? maskEmail(match.email) : undefined;
      const maskedPhone = maskPhoneNumber(formatted);

      return NextResponse.json({
        valid: true,
        available: false,
        normalizedPhone: normalized,
        formattedPhone: formatted,
        error: `This mobile number (${formatted}) is already linked to another account. A phone number cannot be linked to multiple accounts.`,
        code: "PHONE_ALREADY_LINKED",
        hasAccount: true,
        maskedEmail: maskedMail,
        maskedPhone,
        recoveryOptions: {
          canLogin: true,
          canResetPassword: Boolean(match.email),
          loginUrl: "/login",
          forgotPasswordUrl: "/forgot-password",
        },
      });
    }

    // 4. Available for registration or linking
    return NextResponse.json({
      valid: true,
      available: true,
      normalizedPhone: normalized,
      formattedPhone: formatted,
      message: "Phone number is valid and available.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Phone validation failed";
    console.error("Phone validation error:", err);
    return NextResponse.json(
      {
        valid: false,
        available: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
