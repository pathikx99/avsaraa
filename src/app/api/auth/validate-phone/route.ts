import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { normalizePhoneNumber, maskEmail, maskPhoneNumber } from "@/lib/phoneUtils";
import { checkDbRateLimit } from "@/lib/dbRateLimit";
import { validateCsrfOrigin } from "@/lib/csrf";

export async function POST(request: Request) {
  try {
    const csrfCheck = validateCsrfOrigin(request);
    if (!csrfCheck.allowed) {
      return NextResponse.json(
        { valid: false, available: false, error: `CSRF validation failed: ${csrfCheck.reason}` },
        { status: 403 }
      );
    }

    const headerList = await headers();
    const forwardedFor = headerList.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown-ip";

    // Rate Limiting Protection (10 validations per minute per IP to prevent bulk enumeration)
    const rateCheck = await checkDbRateLimit(`phone-validate:${ip}`, 10, 60);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          valid: false,
          available: false,
          error: `Too many phone verification attempts. Please retry in ${rateCheck.resetSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

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
    const encNormalized = encodeURIComponent(normalized);

    const supabaseAdmin = getAdminSupabaseClient();

    // 2. Query public.profiles using admin client to check for conflicts
    // We check both exact normalized string, stripped format, and last 10 digits
    // to catch any legacy or differently formatted records.
    let query = supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, phone_number")
      .or(
        `phone_number.eq.${encNormalized},phone_number.eq.${digitsOnly},phone_number.ilike.%${last10Digits}`
      );

    // Security: Only allow excluding currentUserId if the caller is verified to own that session ID
    let verifiedCurrentUserId: string | null = null;
    if (currentUserId && typeof currentUserId === "string") {
      try {
        const supabase = await createSupabaseServerClient();
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user && authData.user.id === currentUserId) {
          verifiedCurrentUserId = authData.user.id;
          query = query.neq("id", verifiedCurrentUserId);
        }
      } catch {
        // Unauthenticated - do not exclude
      }
    }

    let existingProfiles: Array<{ id: string; email?: string; full_name?: string; phone_number?: string }> | null = null;
    let phoneExists = false;

    const { data: queryData, error: queryError } = await query;

    if (!queryError && queryData) {
      existingProfiles = queryData;
      phoneExists = queryData.length > 0;
    } else {
      // Fallback: Query via SECURITY DEFINER RPC check_phone_exists using verified session ID only
      try {
        const { data: rpcExists, error: rpcErr } = await supabaseAdmin.rpc("check_phone_exists", {
          phone_to_check: digitsOnly,
          current_user_id: verifiedCurrentUserId,
        });
        if (!rpcErr) {
          phoneExists = Boolean(rpcExists);
        } else {
          console.warn("Notice: Phone validation RPC lookup notice:", rpcErr.message);
        }
      } catch (ex) {
        console.warn("Notice: Phone validation lookup exception:", ex);
      }
    }

    // 3. Handle conflict if existing profile found
    if (phoneExists) {
      const match = existingProfiles && existingProfiles.length > 0 ? existingProfiles[0] : null;
      const maskedMail = match?.email ? maskEmail(match.email) : undefined;
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
          canResetPassword: Boolean(match?.email),
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
    console.error("Phone validation error:", err);
    return NextResponse.json(
      {
        valid: false,
        available: false,
        error: "Unable to complete phone validation at this time. Please try again.",
      },
      { status: 500 }
    );
  }
}
