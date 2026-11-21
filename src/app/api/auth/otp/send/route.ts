import { NextResponse } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { sendEmailVerificationEmail } from "@/lib/emailService";
import crypto from "crypto";
import { checkDbRateLimit } from "@/lib/dbRateLimit";
import { validateCsrfOrigin } from "@/lib/csrf";

export async function POST(request: Request) {
  try {
    // CSRF protection for state-changing OTP request
    const csrfCheck = validateCsrfOrigin(request);
    if (!csrfCheck.allowed) {
      return NextResponse.json(
        { success: false, error: `CSRF validation failed: ${csrfCheck.reason}` },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { contact, channel = "email" } = body;

    const cleanContact = String(contact || "").trim().toLowerCase();
    if (!cleanContact || cleanContact.length < 5) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid phone number or email address." },
        { status: 400 }
      );
    }

    // Rate Limit: 3 attempts per 5 minutes (database-backed, cross-instance)
    const rateCheck = await checkDbRateLimit(`otp-send:${cleanContact}`, 3, 300);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many OTP requests. Please wait ${rateCheck.resetSeconds} seconds before requesting a new code.`,
        },
        { status: 429 }
      );
    }

    // Generate 6-digit cryptographic OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store OTP hash in database (serverless-safe across instances)
    const adminClient = getAdminSupabaseClient();

    // Invalidate any previous unconsumed OTPs for this contact
    await adminClient
      .from("otp_codes")
      .update({ consumed: true })
      .eq("contact", cleanContact)
      .eq("consumed", false);

    const { error: insertErr } = await adminClient.from("otp_codes").insert({
      contact: cleanContact,
      otp_hash: otpHash,
      channel,
      expires_at: expiresAt.toISOString(),
      consumed: false,
    });

    if (insertErr) {
      throw new Error(insertErr.message || "Failed to store OTP code.");
    }

    // When verifying email, dispatch verification OTP email using support@avsaraa.in
    let emailResult = null;
    if (channel === "email" || cleanContact.includes("@")) {
      emailResult = await sendEmailVerificationEmail({
        to: cleanContact,
        otp,
      });
    }

    // For automated verification in tests
    const isTestExecution =
      process.env.ENABLE_TEST_OTP === "true" || process.env.NODE_ENV === "test";

    return NextResponse.json({
      success: true,
      message: `Verification code sent via ${channel === "whatsapp" ? "WhatsApp" : "Email"} from support@avsaraa.in.`,
      expiresInSeconds: 300,
      emailResult: emailResult ? { success: emailResult.success } : undefined,
      debugOtp: isTestExecution ? otp : undefined,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
