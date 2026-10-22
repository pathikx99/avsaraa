"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AvsaraaLogo from "./AvsaraaLogo";
import { supabase } from "@/lib/supabaseClient";
import { BackArrowIcon, PhoneIcon, MailIcon, ChevronDownIcon, FlourishDivider, SpinnerIcon } from "./Icons";

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
  const [authMode, setAuthMode] = useState<"phone" | "email">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState(["", "", "", ""]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const countries = [
    { code: "+91", country: "India", flag: "🇮🇳" },
    { code: "+1", country: "USA", flag: "🇺🇸" },
    { code: "+44", country: "UK", flag: "🇬🇧" },
    { code: "+971", country: "UAE", flag: "🇦🇪" },
    { code: "+65", country: "Singapore", flag: "🇸🇬" },
  ];

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 8) {
      showToast("Please enter a valid mobile number");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: `${countryCode}${phoneNumber}`,
      });
      if (error) {
        showToast(error.message);
      } else {
        setOtpSent(true);
        showToast(`OTP sent to ${countryCode} ${phoneNumber}`);
      }
    } catch {
      showToast("Could not send SMS. Please use Email Sign In.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = otpCode.join("");
    if (enteredOtp.length < 4) {
      showToast("Please enter the 4-digit OTP");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: `${countryCode}${phoneNumber}`,
        token: enteredOtp,
        type: "sms",
      });
      if (error) {
        showToast(error.message);
        setIsLoading(false);
        return;
      }
      showToast("Welcome back to Avsaraa!");
      setTimeout(() => {
        router.push("/account");
        router.refresh();
      }, 500);
    } catch {
      showToast("Invalid verification code");
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast("Please enter your email and password");
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === "admin@avsaraa.com") {
      showToast("Super Admin must sign in on the /admin route only.");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (error) {
        showToast(error.message);
        setIsLoading(false);
        return;
      }

      if (
        data.user?.email?.toLowerCase().trim() === "admin@avsaraa.com" ||
        data.user?.app_metadata?.role === "super_admin" ||
        data.user?.app_metadata?.role === "admin"
      ) {
        await supabase.auth.signOut();
        showToast("Super Admin must sign in on the /admin route only.");
        setIsLoading(false);
        return;
      }

      showToast("Welcome back to Avsaraa!");
      setTimeout(() => {
        router.push("/account");
        router.refresh();
      }, 500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign in";
      showToast(msg);
      setIsLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handleOtpChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otpCode];
    newOtp[index] = val.slice(-1);
    setOtpCode(newOtp);

    if (val && index < 3) {
      const nextInput = document.getElementById(`login-otp-${index + 1}`);
      nextInput?.focus();
    }
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
            padding: "10px 20px",
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

      {/* Top Header: Simple Bare Back Arrow */}
      <div
        style={{
          position: "absolute",
          top: "16px",
          left: "16px",
          zIndex: 40,
        }}
      >
        <button
          onClick={onBack || (() => { if (typeof window !== "undefined" && window.history.length > 1) { window.history.back(); } else { router.push("/"); } })}
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
        style={{
          position: "relative",
          height: "320px",
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
            top: "115px",
            width: "130px",
            textAlign: "center",
            zIndex: 10,
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-serif), 'Cormorant Garamond', Georgia, serif",
              fontSize: "20px",
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
        style={{
          position: "relative",
          flex: 1,
          backgroundColor: "#FCFAF7",
          borderTopLeftRadius: "34px",
          borderTopRightRadius: "34px",
          padding: "28px 24px 40px 24px",
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
            width: "150px",
            height: "150px",
            pointerEvents: "none",
            opacity: 0.65,
            zIndex: 0,
          }}
        >
          <Image
            src="/images/botanical_flowers.jpg"
            alt=""
            fill
            sizes="150px"
            style={{ objectFit: "contain", transform: "rotate(-25deg)", mixBlendMode: "multiply" }}
          />
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Header Texts */}
          <div style={{ marginBottom: "20px" }}>
            <h1
              style={{
                fontFamily: "var(--font-serif), 'Cormorant Garamond', Georgia, serif",
                fontSize: "32px",
                fontWeight: 600,
                color: "#261B13",
                lineHeight: 1.1,
                marginBottom: "6px",
              }}
            >
              Login
            </h1>
            <p
              style={{
                fontSize: "14px",
                color: "#7E6E62",
                lineHeight: 1.45,
                fontWeight: 400,
              }}
            >
              Welcome back!
              <br />
              Sign in to your account with Avsaraa.
            </p>
          </div>

          {/* FORM: OTP Flow or Mobile Input */}
          {otpSent ? (
            <form onSubmit={handleVerifyOtp} className="fade-in">
              <div style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ fontSize: "13px", color: "#6C594C" }}>
                    Enter OTP sent to <strong>{countryCode} {phoneNumber}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    style={{ fontSize: "12.5px", color: "#866951", textDecoration: "underline" }}
                  >
                    Edit
                  </button>
                </div>

                {/* 4-digit OTP Inputs */}
                <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                  {otpCode.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`login-otp-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      style={{
                        width: "52px",
                        height: "54px",
                        textAlign: "center",
                        fontSize: "22px",
                        fontWeight: 600,
                        color: "#261B13",
                        background: "#FFFFFF",
                        border: "1.5px solid #E8DED3",
                        borderRadius: "12px",
                      }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="avsaraa-btn-primary"
                style={{ height: "52px", marginTop: "12px" }}
              >
                {isLoading ? <SpinnerIcon size={18} color="#FFFFFF" /> : "Verify & Sign In →"}
              </button>

              <div style={{ textAlign: "center", marginTop: "14px" }}>
                <button
                  type="button"
                  onClick={() => showToast("A fresh OTP has been sent")}
                  style={{ fontSize: "12.5px", color: "#866951", textDecoration: "underline" }}
                >
                  Resend OTP in 30s
                </button>
              </div>
            </form>
          ) : authMode === "phone" ? (
            /* Phone Number Input Flow */
            <form onSubmit={handleSendOtp} className="fade-in">
              <div
                className="avsaraa-input-group"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "0 14px",
                  marginBottom: "14px",
                  height: "52px",
                }}
              >
                {/* Phone Receiver Icon */}
                <span style={{ color: "#786556", display: "flex", alignItems: "center" }}>
                  <PhoneIcon size={18} />
                </span>

                {/* Country Code Selector */}
                <div style={{ position: "relative" }}>
                  <button
                    type="button"
                    onClick={() => setShowCountryPicker(!showCountryPicker)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#261B13",
                      padding: "4px 2px",
                    }}
                  >
                    <span>{countryCode}</span>
                    <ChevronDownIcon size={12} color="#786556" />
                  </button>

                  {/* Dropdown Menu */}
                  {showCountryPicker && (
                    <div
                      style={{
                        position: "absolute",
                        top: "38px",
                        left: "-10px",
                        width: "160px",
                        background: "#FFFFFF",
                        borderRadius: "12px",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
                        border: "1px solid #E8DFD5",
                        zIndex: 90,
                        overflow: "hidden",
                      }}
                    >
                      {countries.map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => {
                            setCountryCode(c.code);
                            setShowCountryPicker(false);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            width: "100%",
                            padding: "8px 12px",
                            fontSize: "12.5px",
                            textAlign: "left",
                            color: "#261B13",
                            borderBottom: "1px solid #F5EFE9",
                          }}
                        >
                          <span>{c.flag}</span>
                          <span>{c.code}</span>
                          <span style={{ color: "#8E7D70", fontSize: "11px", marginLeft: "auto" }}>
                            {c.country}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Vertical separator */}
                <div
                  style={{
                    width: "1px",
                    height: "22px",
                    backgroundColor: "#E2D7CB",
                    margin: "0 2px",
                  }}
                />

                {/* Phone Input */}
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="Enter your mobile number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  style={{
                    flex: 1,
                    fontSize: "14px",
                    color: "#261B13",
                  }}
                  required
                />
              </div>

              {/* Action Button: Send OTP */}
              <button
                type="submit"
                disabled={isLoading}
                className="avsaraa-btn-primary"
                style={{ height: "52px" }}
              >
                {isLoading ? (
                  <SpinnerIcon size={18} color="#FFFFFF" />
                ) : (
                  <>
                    <span>Send OTP</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Email Sign In */
            <form onSubmit={handleEmailLogin} className="fade-in">
              <div
                className="avsaraa-input-group"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "12px",
                  height: "52px",
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

              <div
                className="avsaraa-input-group"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "14px",
                  height: "52px",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#786556" strokeWidth="1.6">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ flex: 1, fontSize: "14px", color: "#261B13" }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="avsaraa-btn-primary"
                style={{ height: "52px" }}
              >
                {isLoading ? <SpinnerIcon size={18} color="#FFFFFF" /> : "Sign In with Email →"}
              </button>
            </form>
          )}

          {/* OR Divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              margin: "18px 0 14px 0",
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
              OR
            </span>
            <div style={{ flex: 1, height: "1px", backgroundColor: "#E6DBD0" }} />
          </div>

          {/* Secondary Button: Continue with Email */}
          <button
            type="button"
            onClick={() => {
              setOtpSent(false);
              setAuthMode(authMode === "phone" ? "email" : "phone");
            }}
            className="avsaraa-btn-outline"
            style={{ height: "52px" }}
          >
            {authMode === "phone" ? (
              <>
                <MailIcon size={17} color="#5C473A" />
                <span>Continue with Email</span>
              </>
            ) : (
              <>
                <PhoneIcon size={17} color="#5C473A" />
                <span>Continue with Phone Number</span>
              </>
            )}
          </button>
        </div>

        {/* Footer: Create an Account */}
        <div
          style={{
            textAlign: "center",
            marginTop: "24px",
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
