"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AvsaraaLogo from "./AvsaraaLogo";
import { supabase } from "@/lib/supabaseClient";
import { isSuperAdminEmail, isSuperAdminUser } from "@/lib/adminConstants";
import {
  BackArrowIcon,
  MailIcon,
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
  const redirectTo = searchParams?.get("redirectTo") || "/account";
  const urlError = searchParams?.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(
    urlError ? decodeURIComponent(urlError) : null
  );

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast("Please enter your email and password.");
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if Super Admin is attempting to sign in
    if (isSuperAdminEmail(cleanEmail)) {
      showToast("Super Admin account detected. Redirecting to Admin Portal...");
      // Allow sign-in then route directly to /admin
    }

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
        style={{
          position: "relative",
          flex: 1,
          backgroundColor: "#FCFAF7",
          borderTopLeftRadius: "34px",
          borderTopRightRadius: "34px",
          padding: "28px 24px 36px 24px",
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
              Sign in with your email or Google account.
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
              OR WITH EMAIL
            </span>
            <div style={{ flex: 1, height: "1px", backgroundColor: "#E6DBD0" }} />
          </div>

          {/* Email & Password Form */}
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
                "Sign In with Email →"
              )}
            </button>
          </form>
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
