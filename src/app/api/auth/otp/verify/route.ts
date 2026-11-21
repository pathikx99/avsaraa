import { NextResponse } from "next/server";
import { checkDbRateLimit } from "@/lib/dbRateLimit";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import crypto from "crypto";
import { validateCsrfOrigin } from "@/lib/csrf";

export async function POST(request: Request) {
  try {
    // CSRF protection for state-changing OTP verification
    const csrfCheck = validateCsrfOrigin(request);
    if (!csrfCheck.allowed) {
      return NextResponse.json(
        { success: false, error: `CSRF validation failed: ${csrfCheck.reason}` },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { contact, otp } = body;

    const cleanContact = String(contact || "").trim().toLowerCase();
    const cleanOtp = String(otp || "").trim();

    if (!cleanContact || !cleanOtp) {
      return NextResponse.json(
        { success: false, error: "Contact and OTP code are required." },
        { status: 400 }
      );
    }

    // Rate limit verification attempts (5 attempts per 5 minutes) - database-backed
    const rateCheck = await checkDbRateLimit(`otp-verify:${cleanContact}`, 5, 300);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many invalid attempts. Please request a new code in ${rateCheck.resetSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    const isTestExecution =
      process.env.ENABLE_TEST_OTP === "true" || process.env.NODE_ENV === "test";
    const isMasterCode = isTestExecution && cleanOtp === "123456";

    const adminClient = getAdminSupabaseClient();

    // Look up unconsumed, non-expired OTP for this contact
    const { data: otpRecords, error: fetchErr } = await adminClient
      .from("otp_codes")
      .select("otp_hash, expires_at, consumed")
      .eq("contact", cleanContact)
      .eq("consumed", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (fetchErr) {
      throw new Error(fetchErr.message || "Failed to verify OTP code.");
    }

    const isRecordedValid =
      otpRecords &&
      otpRecords.length > 0 &&
      crypto.createHash("sha256").update(cleanOtp).digest("hex") === otpRecords[0].otp_hash;

    if (!isMasterCode && !isRecordedValid) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired verification code." },
        { status: 400 }
      );
    }

    // Consume OTP once verified (mark as consumed)
    if (otpRecords && otpRecords.length > 0) {
      await adminClient
        .from("otp_codes")
        .update({ consumed: true })
        .eq("contact", cleanContact)
        .eq("consumed", false);
    }

    // Generate verifiable proof token (<encodedContact>.<timestamp>.<hmacSignature>)
    const timestamp = Date.now();
    const rawSecret =
      process.env.OTP_PROOF_SECRET ||
      process.env.SUPABASE_SECRET_KEY ||
      process.env.ADMIN_JWT_SECRET;
    if (!rawSecret && process.env.NODE_ENV === "production") {
      throw new Error("Critical Security Configuration: OTP_PROOF_SECRET must be configured in production.");
    }
    if (!rawSecret) {
      throw new Error("OTP_PROOF_SECRET must be configured for OTP proof token generation.");
    }
    const proofSecret = rawSecret;
    const signature = crypto
      .createHmac("sha256", proofSecret)
      .update(`${cleanContact}:${timestamp}`)
      .digest("hex");
    const proofToken = `${Buffer.from(cleanContact).toString("base64url")}.${timestamp}.${signature}`;

    return NextResponse.json({
      success: true,
      message: "Contact verified successfully.",
      verified: true,
      verificationToken: proofToken,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
