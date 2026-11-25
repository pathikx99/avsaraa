import { NextResponse } from "next/server";
import { sendEmailVerificationEmail } from "@/lib/emailService";
import { sendWhatsAppOtp } from "@/lib/whatsappService";
import { normalizePhoneNumber } from "@/lib/phoneUtils";
import crypto from "crypto";
import { checkDbRateLimit } from "@/lib/dbRateLimit";
import { storeOtpCode, deleteOtpCode } from "@/lib/otpStore";
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

    let cleanContact = String(contact || "").trim();
    if (!cleanContact || cleanContact.length < 5) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid phone number or email address." },
        { status: 400 }
      );
    }

    const isEmail = cleanContact.includes("@");
    let normalizedPhone: string | null = null;

    if (!isEmail) {
      const phoneCheck = normalizePhoneNumber(cleanContact);
      if (!phoneCheck.isValid) {
        return NextResponse.json(
          { success: false, error: phoneCheck.error || "Please enter a valid mobile number." },
          { status: 400 }
        );
      }
      cleanContact = phoneCheck.normalized;
      normalizedPhone = phoneCheck.normalized;
    } else {
      cleanContact = cleanContact.toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanContact) || cleanContact.length > 254) {
        return NextResponse.json(
          { success: false, error: "Please enter a valid email address." },
          { status: 400 }
        );
      }
    }

    const resolvedChannel = channel === "whatsapp" || !isEmail ? "whatsapp" : "email";

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

    // Store OTP hash in Upstash Redis (5-minute TTL, atomically supersedes prior code)
    await storeOtpCode({
      contact: cleanContact,
      otpHash,
      channel: resolvedChannel,
      ttlSeconds: 300,
    });

    // Dispatch OTP via appropriate channel
    let emailResult = null;
    let whatsappResult = null;

    if (resolvedChannel === "whatsapp" && normalizedPhone) {
      whatsappResult = await sendWhatsAppOtp({
        to: normalizedPhone,
        otp,
      });

      // Fail-closed enforcement: if provider rejects delivery, remove stored OTP and surface error
      if (!whatsappResult.success && !whatsappResult.simulated) {
        console.warn("[OtpSend] WhatsApp delivery failure:", whatsappResult.error);
        await deleteOtpCode(cleanContact);

        const rawErr = whatsappResult.error || "";
        // Sanitize technical Meta API errors (e.g. "(#100) Parameter ...") for end users
        const isTechnicalMetaError =
          rawErr.startsWith("(#") ||
          rawErr.toLowerCase().includes("param") ||
          rawErr.toLowerCase().includes("graph.facebook");
        const userFacingError = isTechnicalMetaError
          ? "Failed to deliver WhatsApp verification code. Please check your mobile number or try again later."
          : rawErr || "Failed to deliver WhatsApp verification code. Please check your mobile number or try again later.";

        return NextResponse.json(
          {
            success: false,
            error: userFacingError,
          },
          { status: 502 }
        );
      }
    } else {
      emailResult = await sendEmailVerificationEmail({
        to: cleanContact,
        otp,
      });

      // Fail-closed enforcement: if email provider rejects delivery, remove stored OTP and surface error
      if (!emailResult.success && !emailResult.simulated) {
        console.warn("[OtpSend] Email delivery failure:", emailResult.error);
        await deleteOtpCode(cleanContact);

        return NextResponse.json(
          {
            success: false,
            error:
              emailResult.error ||
              "Failed to deliver Email verification code. Please verify your email address or try again later.",
          },
          { status: 502 }
        );
      }
    }

    // Restrict debugOtp strictly to non-production test environments
    const isTestExecution =
      process.env.NODE_ENV !== "production" &&
      (process.env.ENABLE_TEST_OTP === "true" || process.env.NODE_ENV === "test");

    const displayMsg =
      resolvedChannel === "whatsapp"
        ? `Verification code dispatched to your WhatsApp (${cleanContact}).`
        : `Verification code sent via Email to ${cleanContact} from support@avsaraa.in.`;

    return NextResponse.json({
      success: true,
      message: displayMsg,
      channel: resolvedChannel,
      expiresInSeconds: 300,
      emailResult: emailResult ? { success: emailResult.success } : undefined,
      whatsappResult: whatsappResult ? { success: whatsappResult.success, simulated: whatsappResult.simulated } : undefined,
      debugOtp: isTestExecution ? otp : undefined,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
