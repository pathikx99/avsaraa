"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AvsaraaLogo from "./AvsaraaLogo";
import { supabase } from "@/lib/supabaseClient";
import {
  BackArrowIcon,
  UserIcon,
  PhoneIcon,
  MailIcon,
  GoogleIcon,
  SpinnerIcon,
} from "./Icons";
import { normalizePhoneNumber } from "@/lib/phoneUtils";

interface RegisterFormProps {
  onNavigateToLogin?: () => void;
  onBack?: () => void;
  isStandalone?: boolean;
}

export default function RegisterForm({
  onNavigateToLogin,
  onBack,
}: RegisterFormProps) {
  const router = useRouter();

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode] = useState("+91");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);

  // Status & Validation States
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneConflict, setPhoneConflict] = useState<{
    exists: boolean;
    message?: string;
    maskedEmail?: string;
  } | null>(null);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [isEmailVerificationSent, setIsEmailVerificationSent] = useState(false);

  // Validate phone uniqueness on blur
  const handlePhoneBlur = async () => {
    if (!phoneNumber || phoneNumber.length < 8) return;

    const validation = normalizePhoneNumber(phoneNumber, countryCode);
    if (!validation.isValid) {
      setPhoneError(validation.error || "Please enter a valid mobile number.");
      setPhoneConflict(null);
      return;
    }

    setPhoneError(null);
    setIsCheckingPhone(true);

    try {
      const res = await fetch("/api/auth/validate-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber,
          countryCode,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.available) {
        setPhoneConflict({
          exists: true,
          message:
            data.error ||
            `This phone number (${data.formattedPhone || phoneNumber}) is already linked to another account.`,
          maskedEmail: data.maskedEmail,
        });
      } else {
        setPhoneConflict(null);
      }
    } catch {
      // Non-blocking on blur network failure
    } finally {
      setIsCheckingPhone(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Client-Side Field Validations
    if (!fullName.trim() || fullName.trim().length < 2) {
      showToast("Please enter your full name.");
      return;
    }

    if (!phoneNumber || phoneNumber.length < 8) {
      showToast("Please enter a valid mobile number.");
      return;
    }

    const phoneValidation = normalizePhoneNumber(phoneNumber, countryCode);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.error || "Invalid mobile number.");
      showToast(phoneValidation.error || "Invalid mobile number.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      showToast("Please enter a valid email address.");
      return;
    }

    if (!password || password.length < 6) {
      showToast("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      showToast("Passwords do not match. Please verify.");
      return;
    }

    if (!agreedToTerms) {
      showToast("Please accept the Terms & Conditions and Privacy Policy.");
      return;
    }

    setIsLoading(true);
    setPhoneConflict(null);
    setPhoneError(null);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = fullName.trim();

      // 2. Server-Side Pre-Registration Guard
      // Enforces phone uniqueness, email format, and security constraints securely on server
      const checkRes = await fetch("/api/auth/register-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: cleanName,
          email: cleanEmail,
          phoneNumber,
          countryCode,
          password,
        }),
      });

      const checkData = await checkRes.json();

      if (!checkRes.ok || !checkData.success) {
        if (checkData.code === "PHONE_ALREADY_EXISTS") {
          setPhoneConflict({
            exists: true,
            message: checkData.error,
            maskedEmail: checkData.maskedEmail,
          });
        }
        showToast(checkData.error || "Registration validation failed.");
        setIsLoading(false);
        return;
      }

      const normalizedPhone = checkData.normalizedPhone || phoneValidation.normalized;

      // 3. Register Account with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            full_name: cleanName,
            phone_number: normalizedPhone,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/account`,
        },
      });

      if (error) {
        showToast(error.message);
        setIsLoading(false);
        return;
      }

      // 4. Upsert into public.profiles
      if (data.user) {
        try {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            full_name: cleanName,
            email: cleanEmail,
            phone_number: normalizedPhone,
            status: "Active",
            membership_tier: "Standard",
            reward_points: 100,
            updated_at: new Date().toISOString(),
          });
        } catch (profileErr) {
          console.warn("Profile table upsert note:", profileErr);
        }
      }

      // 5. Handle Email Verification Requirement if enabled in Supabase
      // If user session is null, Supabase requires email verification
      if (data.user && !data.session) {
        setIsEmailVerificationSent(true);
        showToast("Account created! Please check your email to verify.");
        setIsLoading(false);
        return;
      }

      // Auto-authenticated session
      showToast(`Welcome to Avsaraa, ${cleanName.split(" ")[0]}!`);
      setTimeout(() => {
        router.push("/account");
        router.refresh();
      }, 600);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create account";
      showToast(msg);
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/auth/callback?next=/account`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        showToast(error.message);
        setIsGoogleLoading(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google signup failed";
      showToast(msg);
      setIsGoogleLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3600);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        width: "100%",
        backgroundColor: "#FAF7F2",
        position: "relative",
        padding: "16px 24px 36px 24px",
        overflow: "hidden",
      }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#261B13",
            color: "#FAF6F0",
            padding: "10px 22px",
            borderRadius: "10px",
            fontSize: "13px",
            zIndex: 1000,
            textAlign: "center",
            boxShadow: "0 8px 24px rgba(38, 27, 19, 0.35)",
            animation: "fadeIn 0.25s ease",
            maxWidth: "90vw",
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Top Left Botanical Watercolor Art */}
      <div
        style={{
          position: "absolute",
          top: "-25px",
          left: "-25px",
          width: "200px",
          height: "200px",
          pointerEvents: "none",
          zIndex: 0,
          opacity: 0.9,
        }}
      >
        <Image
          src="/images/botanical_flowers.jpg"
          alt=""
          fill
          sizes="200px"
          style={{
            objectFit: "contain",
            transform: "rotate(12deg)",
            mixBlendMode: "multiply",
          }}
          priority
        />
      </div>

      {/* Top Header: Simple Bare Back Arrow */}
      <div
        style={{
          position: "relative",
          zIndex: 20,
          marginBottom: "6px",
        }}
      >
        <button
          onClick={
            onBack ||
            (() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                window.history.back();
              } else {
                router.push("/");
              }
            })
          }
          aria-label="Back"
          style={{
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            color: "#261B13",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          <BackArrowIcon size={22} color="#261B13" />
        </button>
      </div>

      {/* Brand Logo - Top Right Aligned */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          position: "relative",
          zIndex: 10,
          marginTop: "-10px",
          marginBottom: "16px",
          paddingRight: "4px",
        }}
      >
        <AvsaraaLogo size="md" width={150} />
      </div>

      {isEmailVerificationSent ? (
        /* Email Verification Notice Screen */
        <div
          style={{
            position: "relative",
            zIndex: 10,
            textAlign: "center",
            padding: "20px 0",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              backgroundColor: "#EFE6DC",
              color: "#5C473A",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
            }}
          >
            <MailIcon size={28} color="#5C473A" />
          </div>

          <h1
            style={{
              fontFamily: "var(--font-serif), 'Cormorant Garamond', Georgia, serif",
              fontSize: "28px",
              fontWeight: 600,
              color: "#261B13",
              marginBottom: "10px",
            }}
          >
            Verify Your Email
          </h1>

          <p
            style={{
              fontSize: "14px",
              color: "#6E5B4E",
              lineHeight: 1.55,
              marginBottom: "24px",
            }}
          >
            We have sent an activation link to <strong>{email}</strong>. Please
            click the link in that email to confirm your account and begin shopping.
          </p>

          <Link
            href="/login"
            className="avsaraa-btn-primary"
            style={{
              height: "50px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
              width: "100%",
            }}
          >
            Proceed to Sign In →
          </Link>
        </div>
      ) : (
        /* Registration Form */
        <>
          {/* Headings */}
          <div style={{ position: "relative", zIndex: 10, marginBottom: "16px" }}>
            <h1
              style={{
                fontFamily: "var(--font-serif), 'Cormorant Garamond', Georgia, serif",
                fontSize: "30px",
                fontWeight: 600,
                color: "#261B13",
                lineHeight: 1.15,
                marginBottom: "4px",
              }}
            >
              Create Account
            </h1>
            <p
              style={{
                fontSize: "13.5px",
                color: "#7E6E62",
                lineHeight: 1.4,
              }}
            >
              Join Avsaraa and be a part of our style community.
            </p>
          </div>

          {/* Google OAuth Quick Registration */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={isGoogleLoading || isLoading}
            className="avsaraa-btn-outline"
            style={{
              height: "48px",
              marginBottom: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              position: "relative",
              zIndex: 10,
              width: "100%",
            }}
          >
            {isGoogleLoading ? (
              <SpinnerIcon size={18} color="#261B13" />
            ) : (
              <>
                <GoogleIcon size={18} />
                <span style={{ fontWeight: 500, fontSize: "13.5px" }}>
                  Sign up with Google
                </span>
              </>
            )}
          </button>

          {/* OR Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              margin: "4px 0 14px 0",
              gap: "12px",
              position: "relative",
              zIndex: 10,
            }}
          >
            <div style={{ flex: 1, height: "1px", backgroundColor: "#E6DBD0" }} />
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "#9C8A7B",
                letterSpacing: "0.08em",
              }}
            >
              OR REGISTER WITH EMAIL
            </span>
            <div style={{ flex: 1, height: "1px", backgroundColor: "#E6DBD0" }} />
          </div>

          {/* Main Form */}
          <form onSubmit={handleSubmit} style={{ position: "relative", zIndex: 10 }}>
            {/* Field 1: Full Name */}
            <div
              className="avsaraa-input-group"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "6px 14px",
                marginBottom: "10px",
                height: "52px",
              }}
            >
              <span style={{ color: "#786556", display: "flex", alignItems: "center" }}>
                <UserIcon size={18} />
              </span>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  justifyContent: "center",
                }}
              >
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  placeholder="Full Name *"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{
                    fontSize: "13.5px",
                    color: "#261B13",
                    width: "100%",
                  }}
                  required
                />
              </div>
            </div>

            {/* Field 2: Mobile Number (Validated & Unique) */}
            <div style={{ marginBottom: "10px" }}>
              <div
                className="avsaraa-input-group"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "0 14px",
                  height: "52px",
                  borderColor: phoneConflict ? "#DC2626" : undefined,
                }}
              >
                <span style={{ color: "#786556", display: "flex", alignItems: "center" }}>
                  <PhoneIcon size={18} />
                </span>

                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#261B13",
                    paddingLeft: "2px",
                  }}
                >
                  {countryCode}
                </span>

                <div
                  style={{
                    width: "1px",
                    height: "20px",
                    backgroundColor: "#E2D7CB",
                    margin: "0 2px",
                  }}
                />

                <input
                  type="tel"
                  name="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="Mobile Number * (10 Digits)"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10));
                    setPhoneError(null);
                    setPhoneConflict(null);
                  }}
                  onBlur={handlePhoneBlur}
                  style={{
                    flex: 1,
                    fontSize: "13.5px",
                    color: "#261B13",
                  }}
                  required
                />

                {isCheckingPhone && (
                  <span style={{ color: "#866951" }}>
                    <SpinnerIcon size={16} color="#866951" />
                  </span>
                )}
              </div>

              {/* Phone Format Error */}
              {phoneError && (
                <div
                  style={{
                    color: "#B91C1C",
                    fontSize: "11.5px",
                    marginTop: "4px",
                    paddingLeft: "4px",
                  }}
                >
                  {phoneError}
                </div>
              )}

              {/* Phone Uniqueness Conflict Warning with Actionable Recovery Options */}
              {phoneConflict && (
                <div
                  style={{
                    backgroundColor: "#FEF2F2",
                    border: "1px solid #FCA5A5",
                    borderRadius: "10px",
                    padding: "10px 12px",
                    marginTop: "6px",
                    fontSize: "12px",
                    color: "#991B1B",
                    lineHeight: 1.45,
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: "4px" }}>
                    ⚠️ Phone Number Already in Use
                  </div>
                  <p style={{ margin: "0 0 8px 0" }}>
                    {phoneConflict.message ||
                      "This phone number is already linked to another account."}
                    {phoneConflict.maskedEmail && (
                      <span> Linked to email: {phoneConflict.maskedEmail}</span>
                    )}
                  </p>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <Link
                      href="/login"
                      style={{
                        fontWeight: 600,
                        color: "#991B1B",
                        textDecoration: "underline",
                        textUnderlineOffset: "2px",
                      }}
                    >
                      Sign in to that account →
                    </Link>
                    <Link
                      href="/forgot-password"
                      style={{
                        fontWeight: 600,
                        color: "#991B1B",
                        textDecoration: "underline",
                        textUnderlineOffset: "2px",
                      }}
                    >
                      Recover Account →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Field 3: Email Address */}
            <div
              className="avsaraa-input-group"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "6px 14px",
                marginBottom: "10px",
                height: "52px",
              }}
            >
              <span style={{ color: "#786556", display: "flex", alignItems: "center" }}>
                <MailIcon size={18} />
              </span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="Email Address *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  fontSize: "13.5px",
                  color: "#261B13",
                  width: "100%",
                }}
                required
              />
            </div>

            {/* Field 4: Password */}
            <div
              className="avsaraa-input-group"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "6px 14px",
                marginBottom: "10px",
                height: "52px",
              }}
            >
              <span style={{ color: "#786556" }}>🔒</span>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="new-password"
                placeholder="Password * (Min 6 Characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                style={{
                  fontSize: "13.5px",
                  color: "#261B13",
                  flex: 1,
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#866951",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {/* Field 5: Confirm Password */}
            <div
              className="avsaraa-input-group"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "6px 14px",
                marginBottom: "14px",
                height: "52px",
              }}
            >
              <span style={{ color: "#786556" }}>🔒</span>
              <input
                type={showPassword ? "text" : "password"}
                name="confirm-password"
                autoComplete="new-password"
                placeholder="Confirm Password *"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                style={{
                  fontSize: "13.5px",
                  color: "#261B13",
                  flex: 1,
                }}
                required
              />
            </div>

            {/* Checkbox: Terms & Conditions and Privacy Policy */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                marginBottom: "16px",
              }}
            >
              <input
                type="checkbox"
                id="register-terms"
                className="avsaraa-checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
              />
              <label
                htmlFor="register-terms"
                style={{
                  fontSize: "12px",
                  lineHeight: 1.4,
                  color: "#6E5B4E",
                  cursor: "pointer",
                }}
              >
                I agree to the{" "}
                <span
                  style={{
                    fontWeight: 600,
                    color: "#261B13",
                    textDecoration: "underline",
                    textUnderlineOffset: "2px",
                  }}
                >
                  Terms & Conditions
                </span>{" "}
                and{" "}
                <span
                  style={{
                    fontWeight: 600,
                    color: "#261B13",
                    textDecoration: "underline",
                    textUnderlineOffset: "2px",
                  }}
                >
                  Privacy Policy
                </span>
                .
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isGoogleLoading || Boolean(phoneConflict)}
              className="avsaraa-btn-primary"
              style={{ height: "52px", width: "100%", marginBottom: "14px" }}
            >
              {isLoading ? (
                <SpinnerIcon size={18} color="#FFFFFF" />
              ) : (
                "Create Account →"
              )}
            </button>
          </form>

          {/* Footer: Already have an account? Login */}
          <div
            style={{
              textAlign: "center",
              marginTop: "8px",
              fontSize: "13.5px",
              color: "#6D5A4D",
              position: "relative",
              zIndex: 10,
            }}
          >
            <span>Already have an account? </span>
            {onNavigateToLogin ? (
              <button
                type="button"
                onClick={onNavigateToLogin}
                style={{
                  fontWeight: 600,
                  color: "#261B13",
                  textDecoration: "underline",
                  textUnderlineOffset: "3px",
                }}
              >
                Login
              </button>
            ) : (
              <Link
                href="/login"
                style={{
                  fontWeight: 600,
                  color: "#261B13",
                  textDecoration: "underline",
                  textUnderlineOffset: "3px",
                }}
              >
                Login
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}
