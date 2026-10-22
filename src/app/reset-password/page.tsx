"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import AvsaraaLogo from "@/components/AvsaraaLogo";
import { supabase } from "@/lib/supabaseClient";
import { CheckIcon, SpinnerIcon } from "@/components/Icons";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // 1. Verify if user is in an active recovery session
    const verifyRecoverySession = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          setHasValidSession(true);
        } else {
          // Listen for recovery event if token is being parsed from URL hash
          const {
            data: { subscription },
          } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "PASSWORD_RECOVERY" || (session && session.user)) {
              setHasValidSession(true);
            }
          });

          // Timeout check: If still no session after 2.5 seconds
          setTimeout(async () => {
            const { data: retryData } = await supabase.auth.getUser();
            if (retryData?.user) {
              setHasValidSession(true);
            } else {
              setHasValidSession(false);
            }
            setIsVerifying(false);
          }, 2000);

          return () => {
            subscription.unsubscribe();
          };
        }
      } catch (err) {
        console.error("Session check error:", err);
        setHasValidSession(false);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyRecoverySession();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!newPassword || newPassword.length < 6) {
      showToast("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match. Please re-enter.");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setErrorMessage(error.message);
        showToast(error.message);
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      showToast("Password updated successfully!");

      // Sign out from recovery session and redirect to login after a brief moment
      setTimeout(async () => {
        await supabase.auth.signOut();
      }, 1000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to reset password";
      setErrorMessage(message);
      showToast(message);
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
        {/* Brand Logo */}
        <div style={{ marginBottom: "24px", textAlign: "center" }}>
          <AvsaraaLogo size="md" width={150} />
        </div>

        {isVerifying ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <SpinnerIcon size={30} color="#866951" />
            <p style={{ marginTop: "16px", fontSize: "14px", color: "#7E6E62" }}>
              Verifying security recovery link...
            </p>
          </div>
        ) : isSuccess ? (
          /* Success Screen */
          <div style={{ textAlign: "center", padding: "12px 0" }}>
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
              <CheckIcon size={28} color="#5C473A" />
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
              Password Reset Complete
            </h1>

            <p
              style={{
                fontSize: "14px",
                color: "#6E5B4E",
                lineHeight: 1.55,
                marginBottom: "28px",
              }}
            >
              Your password has been successfully updated. You can now use your
              new password to log in to your Avsaraa account.
            </p>

            <button
              type="button"
              onClick={() => {
                router.push("/login");
                router.refresh();
              }}
              className="avsaraa-btn-primary"
              style={{
                height: "50px",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              Proceed to Sign In →
            </button>
          </div>
        ) : hasValidSession ? (
          /* Password Reset Form */
          <div>
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
                Set New Password
              </h1>
              <p
                style={{
                  fontSize: "13.5px",
                  color: "#7E6E62",
                  lineHeight: 1.5,
                }}
              >
                Create a strong password for your Avsaraa account.
              </p>
            </div>

            {errorMessage && (
              <div
                style={{
                  backgroundColor: "#FDF2F2",
                  border: "1px solid #F8D7DA",
                  color: "#991B1B",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  fontSize: "13px",
                  marginBottom: "18px",
                  lineHeight: 1.45,
                }}
              >
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleResetPassword}>
              {/* Field 1: New Password */}
              <div style={{ marginBottom: "16px" }}>
                <label
                  htmlFor="new-password"
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    color: "#5C473A",
                    marginBottom: "6px",
                  }}
                >
                  New Password * (Min 6 Characters)
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
                  <span style={{ color: "#786556" }}>🔒</span>
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={6}
                    style={{ flex: 1, fontSize: "14px", color: "#261B13" }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#786556",
                      fontSize: "12px",
                      cursor: "pointer",
                      padding: "4px",
                    }}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* Field 2: Confirm Password */}
              <div style={{ marginBottom: "22px" }}>
                <label
                  htmlFor="confirm-password"
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    color: "#5C473A",
                    marginBottom: "6px",
                  }}
                >
                  Confirm New Password *
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
                  <span style={{ color: "#786556" }}>🔒</span>
                  <input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={6}
                    style={{ flex: 1, fontSize: "14px", color: "#261B13" }}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="avsaraa-btn-primary"
                style={{ height: "52px", width: "100%", marginBottom: "14px" }}
              >
                {isLoading ? (
                  <SpinnerIcon size={18} color="#FFFFFF" />
                ) : (
                  "Update Password & Save →"
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Invalid / Expired Link State */
          <div style={{ textAlign: "center", padding: "14px 0" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                backgroundColor: "#FDF2F2",
                color: "#991B1B",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
                fontSize: "24px",
              }}
            >
              ⚠️
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
              Link Expired or Invalid
            </h2>

            <p
              style={{
                fontSize: "13.5px",
                color: "#6E5B4E",
                lineHeight: 1.55,
                marginBottom: "24px",
              }}
            >
              This password recovery link is expired, invalid, or has already
              been used. For your security, password reset links are single-use
              and expire quickly.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Link
                href="/forgot-password"
                className="avsaraa-btn-primary"
                style={{
                  height: "48px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                }}
              >
                Request a New Reset Link →
              </Link>

              <Link
                href="/login"
                className="avsaraa-btn-outline"
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
