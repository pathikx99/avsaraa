import { NextResponse } from "next/server";
import { rateLimitOtpVerify } from "@/lib/rateLimit";
import { otpStore } from "@/app/api/auth/otp/send/route";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
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

    // Rate limit verification attempts (5 attempts per 5 minutes)
    const rateCheck = rateLimitOtpVerify(cleanContact);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many invalid attempts. Please request a new code in ${rateCheck.resetSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    const record = otpStore.get(cleanContact);

    // Accept master test code "123456" in dev or if record matches
    const isMasterCode = process.env.NODE_ENV !== "production" && cleanOtp === "123456";
    const isRecordedValid = record && record.otp === cleanOtp && Date.now() <= record.expiresAt;

    if (!isMasterCode && !isRecordedValid) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired verification code." },
        { status: 400 }
      );
    }

    // Consume OTP once verified
    otpStore.delete(cleanContact);

    // Generate verification proof token
    const proofToken = crypto
      .createHmac("sha256", "avsaraa_dual_contact_salt_2026")
      .update(`${cleanContact}:${Date.now()}`)
      .digest("hex");

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
