import { NextResponse } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { normalizePhoneNumber, maskEmail } from "@/lib/phoneUtils";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, email, phoneNumber, countryCode = "+91", password } = body;

    // 1. Full name validation
    if (!fullName || typeof fullName !== "string" || fullName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Please enter your full name (minimum 2 characters)." },
        { status: 400 }
      );
    }

    // 2. Email validation
    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim().toLowerCase())) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 3. Password validation
    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // 4. Phone validation and format check
    const phoneValidation = normalizePhoneNumber(phoneNumber, countryCode);
    if (!phoneValidation.isValid) {
      return NextResponse.json(
        { success: false, error: phoneValidation.error || "Please enter a valid mobile number." },
        { status: 400 }
      );
    }

    const { normalized, formatted } = phoneValidation;
    const digitsOnly = normalized.replace(/\D/g, "");
    const last10Digits = digitsOnly.slice(-10);

    const supabaseAdmin = getAdminSupabaseClient();

    // 5. Server-side check: Is this phone number already linked to an existing account?
    const { data: phoneMatches, error: phoneErr } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, phone_number")
      .or(
        `phone_number.eq.${normalized},phone_number.eq.${digitsOnly},phone_number.ilike.%${last10Digits}`
      )
      .limit(1);

    if (phoneErr) {
      console.error("Database check error for phone:", phoneErr);
    }

    if (phoneMatches && phoneMatches.length > 0) {
      const match = phoneMatches[0];
      const masked = match.email ? maskEmail(match.email) : undefined;
      return NextResponse.json(
        {
          success: false,
          error: `The phone number ${formatted} is already linked to an existing account. Please sign in or use a different phone number.`,
          code: "PHONE_ALREADY_EXISTS",
          hasExistingAccount: true,
          maskedEmail: masked,
          loginUrl: "/login",
          forgotPasswordUrl: "/forgot-password",
        },
        { status: 409 }
      );
    }

    // 6. Server-side check: Is this email already registered?
    const { data: emailMatches, error: emailErr } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .eq("email", cleanEmail)
      .limit(1);

    if (emailErr) {
      console.error("Database check error for email:", emailErr);
    }

    if (emailMatches && emailMatches.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `An account with ${cleanEmail} already exists. Please log in or reset your password.`,
          code: "EMAIL_ALREADY_EXISTS",
          hasExistingAccount: true,
          loginUrl: "/login",
          forgotPasswordUrl: "/forgot-password",
        },
        { status: 409 }
      );
    }

    // All server-side validations passed
    return NextResponse.json({
      success: true,
      normalizedPhone: normalized,
      formattedPhone: formatted,
      cleanEmail,
      message: "Pre-registration checks passed.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Validation error";
    console.error("Register check error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
