import { NextResponse } from "next/server";
import { checkDbRateLimit } from "@/lib/dbRateLimit";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import crypto from "crypto";
import { validateCsrfOrigin } from "@/lib/csrf";
import { normalizePhoneNumber } from "@/lib/phoneUtils";
import { issueContactProofToken, ContactPurpose } from "@/lib/contactVerification";

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
    const { contact, otp, purpose } = body;

    let cleanContact = String(contact || "").trim();
    const cleanOtp = String(otp || "").trim();

    if (!cleanContact || !cleanOtp) {
      return NextResponse.json(
        { success: false, error: "Contact and OTP code are required." },
        { status: 400 }
      );
    }

    const isEmail = cleanContact.includes("@");
    if (!isEmail) {
      const phoneNorm = normalizePhoneNumber(cleanContact);
      if (phoneNorm.isValid) {
        cleanContact = phoneNorm.normalized;
      }
    } else {
      cleanContact = cleanContact.toLowerCase();
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
      process.env.NODE_ENV !== "production" &&
      (process.env.ENABLE_TEST_OTP === "true" || process.env.NODE_ENV === "test");
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

    let isRecordedValid = false;
    if (otpRecords && otpRecords.length > 0 && otpRecords[0].otp_hash) {
      const computedHash = crypto.createHash("sha256").update(cleanOtp).digest("hex");
      const bufA = Buffer.from(computedHash, "utf-8");
      const bufB = Buffer.from(otpRecords[0].otp_hash, "utf-8");
      if (bufA.length === bufB.length) {
        isRecordedValid = crypto.timingSafeEqual(bufA, bufB);
      }
    }

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

    // Resolve and validate allowed purpose before signing proof token
    const ALLOWED_PURPOSES: ReadonlyArray<ContactPurpose> = [
      "phone",
      "email",
      "order_phone",
      "order_email",
    ];
    let resolvedPurpose: ContactPurpose = isEmail ? "order_email" : "order_phone";
    if (purpose !== undefined && purpose !== null && String(purpose).trim() !== "") {
      const cleanPurpose = String(purpose).trim() as ContactPurpose;
      if (!ALLOWED_PURPOSES.includes(cleanPurpose)) {
        return NextResponse.json(
          { success: false, error: "Invalid verification purpose." },
          { status: 400 }
        );
      }
      resolvedPurpose = cleanPurpose;
    }

    const proofToken = issueContactProofToken(cleanContact, resolvedPurpose);

    return NextResponse.json({
      success: true,
      message: "Contact verified successfully.",
      verified: true,
      contact: cleanContact,
      purpose: resolvedPurpose,
      verificationToken: proofToken,
      token: proofToken,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
