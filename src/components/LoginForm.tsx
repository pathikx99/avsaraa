"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AvsaraaLogo from "./AvsaraaLogo";
import { supabase } from "@/lib/supabaseClient";
import { isSuperAdminUser } from "@/lib/adminConstants";
import {
  BackArrowIcon,
  MailIcon,
  WhatsAppIcon,
  GoogleIcon,
  SpinnerIcon,
  FlourishDivider,
} from "./Icons";

interface LoginFormProps {
  onNavigateToRegister?: () => void;
  onBack?: () => void;
  isStandalone?: boolean;
}

export default function LoginForm({
  onNavigateToRegister,
  onBack,
}: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get("redirectTo") || searchParams?.get("redirect") || "/account";
  const urlError = searchParams?.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [authMode, setAuthMode] = useState<"whatsapp" | "otp" | "password">("whatsapp");
  const [otpCode, setOtpCode] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpLoading, setIsOtpLoading] = useState(false);

  // WhatsApp OTP Login States
  const [phoneNumber, setPhoneNumber] = useState("");
  const [waOtpCode, setWaOtpCode] = useState("");
  const [isWaOtpSent, setIsWaOtpSent] = useState(false);
  const [isWaOtpLoading, setIsWaOtpLoading] = useState(false);
  const [waCountdown, setWaCountdown] = useState(0);

  const [toastMessage, setToastMessage] = useState<string | null>(
    urlError ? decodeURIComponent(urlError) : null
  );

  // WhatsApp resend countdown timer
  useEffect(() => {
    if (waCountdown <= 0) return;
    const timer = setInterval(() => {
      setWaCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [waCountdown]);

  const handleSendWhatsAppOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPhone = phoneNumber.trim().replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      showToast("Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsWaOtpLoading(true);
    try {
      const e164 = cleanPhone.startsWith("91") && cleanPhone.length === 12
        ? `+${cleanPhone}`
        : `+91${cleanPhone.slice(-10)}`;

      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact: e164,
          channel: "whatsapp",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || "Failed to dispatch WhatsApp verification code.");
        return;
      }

      setIsWaOtpSent(true);
      setWaCountdown(60);
      showToast(`Verification code sent to your WhatsApp (+91 ${cleanPhone.slice(-10)})`);
      if (data.debugOtp) {
        setWaOtpCode(data.debugOtp);
      }
    } catch {
      showToast("Could not connect to WhatsApp verification service. Please retry.");
    } finally {
      setIsWaOtpLoading(false);
    }
  };

  const handleVerifyWhatsAppOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waOtpCode || waOtpCode.trim().length !== 6) {
      showToast("Please enter the 6-digit WhatsApp verification code.");
      return;
    }

    const cleanPhone = phoneNumber.trim().replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("91") && cleanPhone.length === 12
      ? `+${cleanPhone}`
      : `+91${cleanPhone.slice(-10)}`;

    setIsWaOtpLoading(true);
    try {
      const res = await fetch("/api/auth/whatsapp/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: formattedPhone,
          otp: waOtpCode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || "Invalid WhatsApp verification code.");
        setIsWaOtpLoading(false);
        return;
      }

      showToast(`Welcome! ${data.message || "Logged in successfully."}`);

      // Refresh Supabase client session in browser
      await supabase.auth.getSession();

      const isSuperAdmin = data.user?.email && isSuperAdminUser(data.user);
      const targetDestination = isSuperAdmin ? "/admin" : redirectTo;

      setTimeout(() => {
        router.push(targetDestination);
        router.refresh();
      }, 500);
    } catch {
      showToast("Authentication failed. Please try again.");
      setIsWaOtpLoading(false);
    }
  };

  const handleSendEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      showToast("Please enter a valid email address.");
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    setIsOtpLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        showToast(error.message);
        setIsOtpLoading(false);
        return;
      }

      setIsOtpSent(true);
      showToast(`6-digit code sent to ${cleanEmail}. Check your inbox!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send verification code";
      showToast(msg);
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      showToast("Please enter the 6-digit verification code.");
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    setIsOtpLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: otpCode.trim(),
        type: "email",
      });

      if (error) {
        showToast(error.message || "Invalid or expired verification code.");
        setIsOtpLoading(false);
        return;
      }

      showToast("Email verified! Welcome to Avsaraa.");

      if (data.user) {
        try {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            email: cleanEmail,
            full_name: data.user.user_metadata?.full_name || cleanEmail.split("@")[0],
            status: "Active",
            membership_tier: "Standard",
            reward_points: 100,
            updated_at: new Date().toISOString(),
          });
        } catch {
          // Ignore background profile sync error
        }
      }

      const isSuperAdmin = isSuperAdminUser(data.user);
      const targetDestination = isSuperAdmin ? "/admin" : redirectTo;

      setTimeout(() => {
        router.push(targetDestination);
        router.refresh();
      }, 500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      showToast(msg);
      setIsOtpLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast("Please enter your email and password.");
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          showToast("Incorrect email or password. Please try again.");
        } else if (error.message.includes("Email not confirmed")) {
          showToast("Please verify your email address before signing in. Check your inbox.");
        } else {
          showToast(error.message);
        }
        setIsLoading(false);
        return;
      }

      showToast("Welcome back to Avsaraa!");

      const isSuperAdmin = isSuperAdminUser(data.user);

      if (isSuperAdmin) {
        try {
          await fetch("/api/admin/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: cleanEmail, password }),
          });
        } catch {
          // Ignore background admin cookie sync error
        }
      }

      const targetDestination = isSuperAdmin ? "/admin" : redirectTo;

      setTimeout(() => {
        router.push(targetDestination);
        router.refresh();
      }, 500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign in";
      showToast(msg);
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
        redirectTo
      )}`;

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
      const msg = err instanceof Error ? err.message : "Google sign-in failed";
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

      {/* Top Header: Bare Back Arrow */}
      <div
        style={{
          position: "absolute",
          top: "16px",
          left: "16px",
          zIndex: 40,
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

      {/* Top Hero Section: Model Photo + Official Logo + Quote */}
      <div
        className="login-mobile-hero"
        style={{
          position: "relative",
          height: "280px",
          overflow: "hidden",
        }}
      >
        {/* Model Photo: Cropped to show hair bun, earring & saree drape */}
        <div
          style={{
            position: "absolute",
            left: "-30px",
            top: "0",
            width: "72%",
            height: "100%",
            overflow: "hidden",
          }}
        >
          <Image
            src="/images/saree_model_hero.jpg"
            alt="Avsaraa Luxury Saree"
            fill
            sizes="(max-width: 600px) 70vw, 350px"
            style={{
              objectFit: "cover",
              objectPosition: "32% 14%",
              transform: "scale(1.4)",
              transformOrigin: "32% 16%",
            }}
            priority
          />
          {/* Subtle gradient feather to fade seamlessly into background */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to right, transparent 50%, #FAF7F2 96%), linear-gradient(to bottom, transparent 65%, #FAF7F2 100%)",
            }}
          />
        </div>

        {/* Brand Logo - Top Right Aligned */}
        <div
          style={{
            position: "absolute",
            right: "16px",
            top: "16px",
            zIndex: 10,
          }}
        >
          <AvsaraaLogo size="sm" width={125} />
        </div>

        {/* Editorial Quote beside model */}
        <div
          style={{
            position: "absolute",
            right: "18px",
            top: "95px",
            width: "135px",
            textAlign: "center",
            zIndex: 10,
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-serif), 'Cormorant Garamond', Georgia, serif",
              fontSize: "19px",
              fontStyle: "italic",
              fontWeight: 500,
              color: "#544337",
              lineHeight: 1.25,
            }}
          >
            Your <br />
            Style <br />
            Story <br />
            Continues <br />
            Here.
          </p>

          {/* Delicate Flourish Ornament Divider */}
          <FlourishDivider color="#C4AB94" />
        </div>
      </div>

      {/* Curved Ivory Bottom Card Sheet */}
      <div
        className="login-card-sheet"
        style={{
          position: "relative",
          flex: 1,
          backgroundColor: "#FCFAF7",
          borderTopLeftRadius: "34px",
          borderTopRightRadius: "34px",
          padding: "28px 24px 100px 24px",
          marginTop: "-26px",
          zIndex: 20,
          boxShadow: "0 -8px 25px rgba(38, 27, 19, 0.05)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {/* Botanical watercolor sprig in bottom right */}
        <div
          style={{
            position: "absolute",
            right: "-20px",
            bottom: "-20px",
            width: "140px",
            height: "140px",
            pointerEvents: "none",
            opacity: 0.6,
            zIndex: 0,
          }}
        >
          <Image
            src="/images/botanical_flowers.jpg"
            alt=""
            fill
            sizes="140px"
            style={{
              objectFit: "contain",
              transform: "rotate(-25deg)",
              mixBlendMode: "multiply",
            }}
          />
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Header Texts */}
          <div style={{ marginBottom: "20px" }}>
            <h1
              style={{
                fontFamily: "var(--font-serif), 'Cormorant Garamond', Georgia, serif",
                fontSize: "30px",
                fontWeight: 600,
                color: "#261B13",
                lineHeight: 1.1,
                marginBottom: "6px",
              }}
            >
              Sign In
            </h1>
            <p
              style={{
                fontSize: "13.5px",
                color: "#7E6E62",
                lineHeight: 1.45,
                fontWeight: 400,
              }}
            >
              Welcome back to Avsaraa.
              <br />
              Sign in with WhatsApp, email, or your Google account.
            </p>
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isLoading}
            className="avsaraa-btn-outline"
            style={{
              height: "50px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              width: "100%",
            }}
          >
            {isGoogleLoading ? (
              <SpinnerIcon size={18} color="#261B13" />
            ) : (
              <>
                <GoogleIcon size={18} />
                <span style={{ fontWeight: 500, fontSize: "14px" }}>
                  Continue with Google
                </span>
              </>
            )}
          </button>

          {/* OR Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              margin: "12px 0 16px 0",
              gap: "12px",
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
              OR SIGN IN WITH
            </span>
            <div style={{ flex: 1, height: "1px", backgroundColor: "#E6DBD0" }} />
          </div>

          {/* Auth Method Selector (WhatsApp OTP vs Email Code vs Password) */}
          <div
            style={{
              display: "flex",
              backgroundColor: "#EFE6DC",
              borderRadius: "10px",
              padding: "3px",
              marginBottom: "16px",
              gap: "2px",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setAuthMode("whatsapp");
                setIsWaOtpSent(false);
              }}
              style={{
                flex: 1,
                padding: "8px 6px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                backgroundColor: authMode === "whatsapp" ? "#FFFFFF" : "transparent",
                color: authMode === "whatsapp" ? "#1B5E20" : "#7E6E62",
                boxShadow: authMode === "whatsapp" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
              }}
            >
              <WhatsAppIcon size={14} color={authMode === "whatsapp" ? "#25D366" : "#7E6E62"} />
              <span>WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("otp");
                setIsOtpSent(false);
              }}
              style={{
                flex: 1,
                padding: "8px 6px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                backgroundColor: authMode === "otp" ? "#FFFFFF" : "transparent",
                color: authMode === "otp" ? "#261B13" : "#7E6E62",
                boxShadow: authMode === "otp" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              ✉️ Email
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("password");
                setIsOtpSent(false);
              }}
              style={{
                flex: 1,
                padding: "8px 6px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                backgroundColor: authMode === "password" ? "#FFFFFF" : "transparent",
                color: authMode === "password" ? "#261B13" : "#7E6E62",
                boxShadow: authMode === "password" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              🔑 Password
            </button>
          </div>

          {/* MODE 0: WhatsApp OTP Form */}
          {authMode === "whatsapp" && (
            <div className="fade-in">
              {!isWaOtpSent ? (
                <form onSubmit={handleSendWhatsAppOtp}>
                  {/* Phone Field */}
                  <div style={{ marginBottom: "14px" }}>
                    <div
                      className="avsaraa-input-group"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        height: "52px",
                        padding: "0 14px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          paddingRight: "8px",
                          borderRight: "1px solid #D9CFC4",
                          color: "#786556",
                          fontSize: "14px",
                          fontWeight: 600,
                        }}
                      >
                        <WhatsAppIcon size={16} color="#25D366" />
                        <span>+91</span>
                      </div>
                      <input
                        type="tel"
                        autoComplete="tel-national"
                        placeholder="Enter 10-digit mobile number"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                        style={{
                          flex: 1,
                          fontSize: "14px",
                          color: "#261B13",
                          border: "none",
                          outline: "none",
                          background: "transparent",
                          boxShadow: "none",
                        }}
                        required
                        disabled={isWaOtpLoading}
                        autoFocus
                      />
                    </div>
                    <span style={{ display: "block", fontSize: "11.5px", color: "#8E7D70", marginTop: "6px", paddingLeft: "4px" }}>
                      We will send a 6-digit verification code to your WhatsApp.
                    </span>
                  </div>

                  {/* Send Code Button */}
                  <button
                    type="submit"
                    disabled={isWaOtpLoading || phoneNumber.replace(/\D/g, "").length < 10}
                    className="avsaraa-btn-primary"
                    style={{
                      height: "52px",
                      width: "100%",
                      backgroundColor: phoneNumber.replace(/\D/g, "").length >= 10 ? "#25D366" : undefined,
                      borderColor: phoneNumber.replace(/\D/g, "").length >= 10 ? "#20BA5A" : undefined,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    {isWaOtpLoading ? (
                      <SpinnerIcon size={18} color="#FFFFFF" />
                    ) : (
                      <>
                        <WhatsAppIcon size={18} color="#FFFFFF" />
                        <span>Send WhatsApp Code →</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyWhatsAppOtp}>
                  {/* Notice & Edit Phone */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      backgroundColor: "#E8F5E9",
                      borderRadius: "8px",
                      marginBottom: "14px",
                      fontSize: "12.5px",
                      border: "1px solid rgba(37, 211, 102, 0.25)",
                    }}
                  >
                    <span style={{ color: "#1B5E20", display: "flex", alignItems: "center", gap: "6px" }}>
                      <WhatsAppIcon size={14} color="#25D366" />
                      <span>Code sent to <strong>+91 {phoneNumber.slice(-10)}</strong></span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsWaOtpSent(false)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#2E7D32",
                        fontWeight: 600,
                        cursor: "pointer",
                        textDecoration: "underline",
                        fontSize: "12px",
                      }}
                    >
                      Change
                    </button>
                  </div>

                  {/* 6-Digit OTP Input */}
                  <div style={{ marginBottom: "16px" }}>
                    <div
                      className="avsaraa-input-group"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        height: "54px",
                        padding: "0 14px",
                        backgroundColor: "#FFFFFF",
                        border: "1.5px solid #25D366",
                      }}
                    >
                      <input
                        type="text"
                        maxLength={6}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="• • • • • •"
                        value={waOtpCode}
                        onChange={(e) => setWaOtpCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                        style={{
                          flex: 1,
                          fontSize: "22px",
                          fontWeight: 700,
                          letterSpacing: "8px",
                          textAlign: "center",
                          color: "#261B13",
                        }}
                        required
                        autoFocus
                        disabled={isWaOtpLoading}
                      />
                    </div>
                  </div>

                  {/* Verify & Sign In Button */}
                  <button
                    type="submit"
                    disabled={isWaOtpLoading || waOtpCode.trim().length !== 6}
                    className="avsaraa-btn-primary"
                    style={{
                      height: "52px",
                      width: "100%",
                      opacity: waOtpCode.trim().length !== 6 ? 0.7 : 1,
                      backgroundColor: "#25D366",
                      borderColor: "#20BA5A",
                    }}
                  >
                    {isWaOtpLoading ? (
                      <SpinnerIcon size={18} color="#FFFFFF" />
                    ) : (
                      "Verify WhatsApp Code & Sign In →"
                    )}
                  </button>

                  {/* Resend Link */}
                  <div style={{ textAlign: "center", marginTop: "14px" }}>
                    <button
                      type="button"
                      onClick={handleSendWhatsAppOtp}
                      disabled={isWaOtpLoading || waCountdown > 0}
                      style={{
                        background: "none",
                        border: "none",
                        color: waCountdown > 0 ? "#A3978C" : "#2E7D32",
                        fontSize: "12.5px",
                        cursor: waCountdown > 0 ? "default" : "pointer",
                        textDecoration: waCountdown > 0 ? "none" : "underline",
                        fontWeight: 500,
                      }}
                    >
                      {waCountdown > 0
                        ? `Resend WhatsApp code in ${waCountdown}s`
                        : "Didn't receive code? Resend via WhatsApp"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* MODE 1: Email Code (OTP) Form */}
          {authMode === "otp" && (
            <div className="fade-in">
              {!isOtpSent ? (
                <form onSubmit={handleSendEmailOtp}>
                  {/* Email Field */}
                  <div style={{ marginBottom: "14px" }}>
                    <div
                      className="avsaraa-input-group"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        height: "52px",
                        padding: "0 14px",
                      }}
                    >
                      <MailIcon size={18} color="#786556" />
                      <input
                        type="email"
                        autoComplete="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ flex: 1, fontSize: "14px", color: "#261B13" }}
                        required
                        disabled={isOtpLoading}
                      />
                    </div>
                    <span style={{ display: "block", fontSize: "11.5px", color: "#8E7D70", marginTop: "6px", paddingLeft: "4px" }}>
                      We will send a 6-digit verification code to verify your email.
                    </span>
                  </div>

                  {/* Send Code Button */}
                  <button
                    type="submit"
                    disabled={isOtpLoading || isGoogleLoading || !email}
                    className="avsaraa-btn-primary"
                    style={{ height: "52px", width: "100%" }}
                  >
                    {isOtpLoading ? (
                      <SpinnerIcon size={18} color="#FFFFFF" />
                    ) : (
                      "Send Verification Code →"
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyEmailOtp}>
                  {/* Notice & Edit Email */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      backgroundColor: "#F5EFE6",
                      borderRadius: "8px",
                      marginBottom: "14px",
                      fontSize: "12.5px",
                    }}
                  >
                    <span style={{ color: "#5A493D" }}>
                      Code sent to <strong>{email}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsOtpSent(false)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#846124",
                        fontWeight: 600,
                        cursor: "pointer",
                        textDecoration: "underline",
                        fontSize: "12px",
                      }}
                    >
                      Change
                    </button>
                  </div>

                  {/* 6-Digit OTP Input */}
                  <div style={{ marginBottom: "16px" }}>
                    <div
                      className="avsaraa-input-group"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        height: "54px",
                        padding: "0 14px",
                        backgroundColor: "#FFFFFF",
                        border: "1.5px solid #C5A265",
                      }}
                    >
                      <input
                        type="text"
                        maxLength={6}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="• • • • • •"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                        style={{
                          flex: 1,
                          fontSize: "22px",
                          fontWeight: 700,
                          letterSpacing: "8px",
                          textAlign: "center",
                          color: "#261B13",
                        }}
                        required
                        autoFocus
                        disabled={isOtpLoading}
                      />
                    </div>
                  </div>

                  {/* Verify & Sign In Button */}
                  <button
                    type="submit"
                    disabled={isOtpLoading || otpCode.trim().length !== 6}
                    className="avsaraa-btn-primary"
                    style={{
                      height: "52px",
                      width: "100%",
                      opacity: otpCode.trim().length !== 6 ? 0.7 : 1,
                    }}
                  >
                    {isOtpLoading ? (
                      <SpinnerIcon size={18} color="#FFFFFF" />
                    ) : (
                      "Verify Code & Sign In →"
                    )}
                  </button>

                  {/* Resend Link */}
                  <div style={{ textAlign: "center", marginTop: "14px" }}>
                    <button
                      type="button"
                      onClick={handleSendEmailOtp}
                      disabled={isOtpLoading}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#866951",
                        fontSize: "12.5px",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      Didn&apos;t receive code? Resend
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* MODE 2: Email & Password Form */}
          {authMode === "password" && (
            <form onSubmit={handleEmailLogin} className="fade-in">
              {/* Email Field */}
              <div style={{ marginBottom: "12px" }}>
                <div
                  className="avsaraa-input-group"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    height: "52px",
                    padding: "0 14px",
                  }}
                >
                  <MailIcon size={18} color="#786556" />
                  <input
                    type="email"
                    autoComplete="username"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ flex: 1, fontSize: "14px", color: "#261B13" }}
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div style={{ marginBottom: "8px" }}>
                <div
                  className="avsaraa-input-group"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    height: "52px",
                    padding: "0 14px",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#786556"
                    strokeWidth="1.6"
                  >
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ flex: 1, fontSize: "14px", color: "#261B13" }}
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
                      padding: "4px",
                    }}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginBottom: "18px",
                }}
              >
                <Link
                  href="/forgot-password"
                  style={{
                    fontSize: "12.5px",
                    color: "#866951",
                    textDecoration: "underline",
                    textUnderlineOffset: "3px",
                    fontWeight: 500,
                  }}
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="avsaraa-btn-primary"
                style={{ height: "52px", width: "100%" }}
              >
                {isLoading ? (
                  <SpinnerIcon size={18} color="#FFFFFF" />
                ) : (
                  "Sign In with Password →"
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer: Create an Account */}
        <div
          style={{
            textAlign: "center",
            marginTop: "22px",
            fontSize: "13.5px",
            color: "#6D5A4D",
            position: "relative",
            zIndex: 1,
          }}
        >
          <span>New to Avsaraa? </span>
          {onNavigateToRegister ? (
            <button
              type="button"
              onClick={onNavigateToRegister}
              style={{
                fontWeight: 600,
                color: "#261B13",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
              }}
            >
              Create an account
            </button>
          ) : (
            <Link
              href="/register"
              style={{
                fontWeight: 600,
                color: "#261B13",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
              }}
            >
              Create an account
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
