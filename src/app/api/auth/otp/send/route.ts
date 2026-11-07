import { NextResponse } from "next/server";
import { rateLimitOtpSend } from "@/lib/rateLimit";
import crypto from "crypto";

// Store OTPs in memory with timestamp (In production, backed by Redis or SMS Gateway)
interface OtpEntry {
  otp: string;
  expiresAt: number;
}
export const otpStore = new Map<string, OtpEntry>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { contact, channel = "whatsapp" } = body;

    const cleanContact = String(contact || "").trim().toLowerCase();
    if (!cleanContact || cleanContact.length < 5) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid phone number or email address." },
        { status: 400 }
      );
    }

    // Rate Limit: 3 attempts per 5 minutes
    const rateCheck = rateLimitOtpSend(cleanContact);
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
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore.set(cleanContact, { otp, expiresAt });

    // In a live environment, dispatch via WhatsApp Cloud API / Twilio / Resend
    // For test and auditing convenience, return simulated dispatch confirmation
    return NextResponse.json({
      success: true,
      message: `Verification code sent via ${channel === "whatsapp" ? "WhatsApp" : "Email"}.`,
      expiresInSeconds: 300,
      // For automated verification in tests
      debugOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
