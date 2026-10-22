"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AvsaraaLogo from "@/components/AvsaraaLogo";
import { supabase } from "@/lib/supabaseClient";
import { BackArrowIcon, MailIcon, SpinnerIcon, CheckIcon } from "@/components/Icons";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      showToast("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/auth/callback?next=/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectUrl,
      });

      if (error) {
        console.error("Password reset error:", error);
      }

      // Security requirement: Avoid revealing whether an email address is registered.
      // Always show success state to prevent account enumeration.
      setIsSubmitted(true);
      showToast("Password reset instructions sent.");
    } catch (err: unknown) {
      console.error("Unexpected error:", err);
      // Still show generic message to avoid leaking information
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3600);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#FAF7F2",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
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

      {/* Decorative Botanical Leaf in top-right */}
      <div
        style={{
          position: "fixed",
          top: "-20px",
          right: "-20px",
          width: "180px",
          height: "180px",
          pointerEvents: "none",
          opacity: 0.7,
          zIndex: 0,
        }}
      >
        <Image
          src="/images/botanical_flowers.jpg"
          alt=""
          fill
          sizes="180px"
          style={{
            objectFit: "contain",
            transform: "rotate(-15deg)",
            mixBlendMode: "multiply",
          }}
        />
      </div>

      {/* Card Container */}
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          backgroundColor: "#FCFAF7",
          borderRadius: "28px",
          padding: "36px 32px 40px 32px",
          boxShadow: "0 16px 45px -10px rgba(38, 27, 19, 0.12)",
          border: "1px solid #E8DFD5",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Back Link */}
        <div style={{ marginBottom: "20px" }}>
          <Link
            href="/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              color: "#6E5B4E",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            <BackArrowIcon size={18} color="#6E5B4E" />
            <span>Back to Sign In</span>
          </Link>
        </div>

        {/* Brand Logo */}
        <div style={{ marginBottom: "24px", textAlign: "center" }}>
          <AvsaraaLogo size="md" width={150} />
        </div>

        {!isSubmitted ? (
          <div>
            {/* Heading */}
            <div style={{ marginBottom: "24px", textAlign: "center" }}>
              <h1
                style={{
                  fontFamily: "var(--font-serif), 'Cormorant Garamond', Georgia, serif",
                  fontSize: "30px",
                  fontWeight: 600,
                  color: "#261B13",
                  lineHeight: 1.15,
                  marginBottom: "8px",
                }}
              >
                Forgot Password?
              </h1>
              <p
                style={{
                  fontSize: "13.5px",
                  color: "#7E6E62",
                  lineHeight: 1.5,
                }}
              >
                Enter your registered email address below. If an account exists,
                we will send you a secure link to reset your password.
              </p>
            </div>

            {/* Recovery Form */}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "20px" }}>
                <label
                  htmlFor="forgot-email"
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    color: "#5C473A",
                    marginBottom: "8px",
                  }}
                >
                  Email Address
                </label>
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
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      flex: 1,
                      fontSize: "14px",
                      color: "#261B13",
                    }}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="avsaraa-btn-primary"
                style={{ height: "52px", width: "100%", marginBottom: "16px" }}
              >
                {isLoading ? (
                  <SpinnerIcon size={18} color="#FFFFFF" />
                ) : (
                  "Send Password Reset Link →"
                )}
              </button>

              <div
                style={{
                  fontSize: "11.5px",
                  color: "#9C8A7B",
                  textAlign: "center",
                  lineHeight: 1.45,
                }}
              >
                🔒 In accordance with security standards, recovery links are single-use and expire automatically.
              </div>
            </form>
          </div>
        ) : (
          /* Confirmation State */
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                backgroundColor: "#EFE6DC",
                color: "#5C473A",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <CheckIcon size={26} color="#5C473A" />
            </div>

            <h2
              style={{
                fontFamily: "var(--font-serif), 'Cormorant Garamond', Georgia, serif",
                fontSize: "26px",
                fontWeight: 600,
                color: "#261B13",
                marginBottom: "10px",
              }}
            >
              Check Your Inbox
            </h2>

            <p
              style={{
                fontSize: "13.5px",
                color: "#6E5B4E",
                lineHeight: 1.55,
                marginBottom: "24px",
              }}
            >
              If an account with <strong>{email}</strong> exists in our system,
              we have sent instructions to reset your password.
              Please check your inbox and spam folder.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="avsaraa-btn-outline"
                style={{ height: "48px" }}
              >
                Try a Different Email
              </button>

              <Link
                href="/login"
                className="avsaraa-btn-primary"
                style={{
                  height: "48px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                }}
              >
                Return to Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
