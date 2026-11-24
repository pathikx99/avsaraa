import { NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { normalizePhoneNumber } from "@/lib/phoneUtils";
import { checkDbRateLimit } from "@/lib/dbRateLimit";
import { validateCsrfOrigin } from "@/lib/csrf";

export async function POST(request: Request) {
  try {
    // 1. CSRF Protection
    const csrfCheck = validateCsrfOrigin(request);
    if (!csrfCheck.allowed) {
      return NextResponse.json(
        { success: false, error: `CSRF validation failed: ${csrfCheck.reason}` },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { phoneNumber, otp, fullName } = body;

    const rawPhone = String(phoneNumber || "").trim();
    const cleanOtp = String(otp || "").trim();

    if (!rawPhone || !cleanOtp) {
      return NextResponse.json(
        { success: false, error: "Mobile number and 6-digit OTP are required." },
        { status: 400 }
      );
    }

    const phoneValidation = normalizePhoneNumber(rawPhone);
    if (!phoneValidation.isValid) {
      return NextResponse.json(
        { success: false, error: phoneValidation.error || "Invalid mobile number format." },
        { status: 400 }
      );
    }

    const normalizedPhone = phoneValidation.normalized; // e.g. "+919876543210"
    const digitsOnly = normalizedPhone.replace(/\D/g, ""); // e.g. "919876543210"

    // 2. Database-backed Rate Limiting (5 login attempts per 5 minutes)
    const rateCheck = await checkDbRateLimit(`whatsapp-login:${normalizedPhone}`, 5, 300);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many login attempts. Please wait ${rateCheck.resetSeconds} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    // 3. Verify OTP in database
    const isTestExecution =
      process.env.NODE_ENV !== "production" &&
      (process.env.ENABLE_TEST_OTP === "true" || process.env.NODE_ENV === "test");
    const isMasterCode = isTestExecution && cleanOtp === "123456";

    const adminClient = getAdminSupabaseClient();

    // Match OTP records using either normalized format or clean format
    const { data: otpRecords, error: fetchErr } = await adminClient
      .from("otp_codes")
      .select("otp_hash, expires_at, consumed")
      .or(`contact.eq.${normalizedPhone},contact.eq.${digitsOnly}`)
      .eq("consumed", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (fetchErr) {
      throw new Error(fetchErr.message || "Failed to query verification records.");
    }

    let isOtpValid = false;
    if (otpRecords && otpRecords.length > 0 && otpRecords[0].otp_hash) {
      const computedHash = crypto.createHash("sha256").update(cleanOtp).digest("hex");
      const bufA = Buffer.from(computedHash, "utf-8");
      const bufB = Buffer.from(otpRecords[0].otp_hash, "utf-8");
      if (bufA.length === bufB.length) {
        isOtpValid = crypto.timingSafeEqual(bufA, bufB);
      }
    }

    if (!isMasterCode && !isOtpValid) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired WhatsApp verification code." },
        { status: 400 }
      );
    }

    // 4. Invalidate verified OTP
    if (otpRecords && otpRecords.length > 0) {
      await adminClient
        .from("otp_codes")
        .update({ consumed: true })
        .or(`contact.eq.${normalizedPhone},contact.eq.${digitsOnly}`)
        .eq("consumed", false);
    }

    // 5. Look up existing profile or provision new account
    const syntheticEmail = `${digitsOnly}@phone.avsaraa.in`;
    let existingProfiles: Array<{
      id: string;
      email?: string | null;
      full_name?: string | null;
      phone_number?: string | null;
      phone_verified?: boolean | null;
    }> | null = null;

    const { data: profs, error: profsErr } = await adminClient
      .from("profiles")
      .select("id, email, full_name, phone_number, phone_verified")
      .or(
        `phone_number.eq.${normalizedPhone},email.eq.${syntheticEmail}`
      )
      .limit(1);

    if (profsErr) {
      const fallback = await adminClient
        .from("profiles")
        .select("id, email, full_name, phone_number")
        .or(
          `phone_number.eq.${normalizedPhone},email.eq.${syntheticEmail}`
        )
        .limit(1);
      existingProfiles = fallback.data;
    } else {
      existingProfiles = profs;
    }

    let authUserId: string | null = null;
    let userEmail: string | null = null;
    let displayName = fullName?.trim() || "Avsaraa Patron";

    const matchedProfile = existingProfiles?.[0];
    const isVerifiedPhoneMatch = Boolean(
      matchedProfile?.phone_number === normalizedPhone
    );
    const isSyntheticEmailMatch = Boolean(matchedProfile?.email === syntheticEmail);

    if (matchedProfile && (isVerifiedPhoneMatch || isSyntheticEmailMatch)) {
      const profileUserId = matchedProfile.id;
      authUserId = profileUserId;
      displayName = matchedProfile.full_name || displayName;

      // Synchronize phone confirmation to auth.users and resolve canonical email
      try {
        const { data: authUserData } = await adminClient.auth.admin.updateUserById(profileUserId, {
          phone: normalizedPhone,
          phone_confirm: true,
          user_metadata: {
            auth_provider: "whatsapp_otp",
            phone: normalizedPhone,
            full_name: displayName,
          },
        });
        userEmail = authUserData?.user?.email || matchedProfile.email || null;
      } catch {
        // Fallback: fetch user email if update failed (e.g. phone conflict on another auth record)
        try {
          const { data: authUserData } = await adminClient.auth.admin.getUserById(profileUserId);
          userEmail = authUserData?.user?.email || matchedProfile.email || null;
        } catch {
          userEmail = matchedProfile.email || null;
        }
      }

      // Update profile to mark phone as verified
      const { error: updateErr } = await adminClient
        .from("profiles")
        .update({
          phone_number: normalizedPhone,
          phone_verified: true,
          phone_verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", profileUserId);

      if (updateErr) {
        await adminClient
          .from("profiles")
          .update({
            phone_number: normalizedPhone,
            updated_at: new Date().toISOString(),
          })
          .eq("id", profileUserId);
      }
    } else {
      // Create new user in auth.users and public.profiles
      userEmail = syntheticEmail;

      const { data: createAuthUser, error: createAuthErr } =
        await adminClient.auth.admin.createUser({
          email: syntheticEmail,
          email_confirm: true,
          phone: normalizedPhone,
          phone_confirm: true,
          user_metadata: {
            full_name: displayName,
            phone: normalizedPhone,
            auth_provider: "whatsapp_otp",
          },
        });

      if (createAuthErr || !createAuthUser.user) {
        // Fallback: If user already exists in auth.users, generate link to resolve user ID directly
        const { data: linkCheck, error: linkCheckErr } =
          await adminClient.auth.admin.generateLink({
            type: "magiclink",
            email: syntheticEmail,
          });

        if (linkCheck?.user?.id) {
          authUserId = linkCheck.user.id;
        } else {
          throw new Error(createAuthErr?.message || linkCheckErr?.message || "Failed to provision customer account.");
        }
      } else {
        authUserId = createAuthUser.user.id;
      }

      // Upsert profile record
      await adminClient.from("profiles").upsert({
        id: authUserId,
        email: syntheticEmail,
        full_name: displayName,
        phone_number: normalizedPhone,
        phone_verified: true,
        phone_verified_at: new Date().toISOString(),
        status: "Active",
        membership_tier: "Standard",
        reward_points: 100,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    // 6. Establish SSR Session via magic link token exchange
    // We generate a magic link token for the user's email, then verify it on the SSR server client
    // so standard Supabase Auth cookies are set on the response seamlessly.
    const serverClient = await createSupabaseServerClient();
    const targetEmail = userEmail || `${digitsOnly}@phone.avsaraa.in`;

    const { data: linkData, error: linkErr } =
      await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email: targetEmail,
      });

    if (linkErr || !linkData.properties?.hashed_token) {
      throw new Error(linkErr?.message || "Failed to generate authentication session.");
    }

    const { data: sessionData, error: sessionErr } =
      await serverClient.auth.verifyOtp({
        token_hash: linkData.properties.hashed_token,
        type: "magiclink",
      });

    if (sessionErr) {
      throw new Error(sessionErr.message || "Failed to establish customer session.");
    }

    return NextResponse.json({
      success: true,
      message: `Welcome to Avsaraa, ${displayName}!`,
      user: sessionData.user,
      session: sessionData.session,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "WhatsApp authentication failed.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
