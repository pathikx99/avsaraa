"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import AvsaraaLogo from "./AvsaraaLogo";
import {
  BackArrowIcon,
  UserIcon,
  PhoneIcon,
  MailIcon,
  GoogleIcon,
  AppleIcon,
  SpinnerIcon,
} from "./Icons";

interface RegisterFormProps {
  onNavigateToLogin?: () => void;
  onBack?: () => void;
  isStandalone?: boolean;
}

export default function RegisterForm({
  onNavigateToLogin,
  onBack,
}: RegisterFormProps) {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      showToast("Please enter your full name");
      return;
    }
    if (!phoneNumber || phoneNumber.length < 8) {
      showToast("Please enter a valid mobile number");
      return;
    }
    if (!agreedToTerms) {
      showToast("Please agree to the Terms & Conditions and Privacy Policy");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      showToast(`Welcome to the Avsaraa family, ${fullName.split(" ")[0]}!`);
    }, 800);
  };

  const handleSocialSignIn = (provider: "Google" | "Apple") => {
    showToast(`Connecting to ${provider}...`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
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
          onClick={onBack || (() => window.history.back())}
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

      {/* Brand Logo - Top Right Aligned matching reference screenshot */}
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

      {/* Headings */}
      <div style={{ position: "relative", zIndex: 10, marginBottom: "20px" }}>
        <h1
          style={{
            fontFamily: "var(--font-serif), 'Cormorant Garamond', Georgia, serif",
            fontSize: "32px",
            fontWeight: 600,
            color: "#261B13",
            lineHeight: 1.15,
            marginBottom: "6px",
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

      {/* Main Form Fields */}
      <form onSubmit={handleSubmit} style={{ position: "relative", zIndex: 10 }}>
        {/* Field 1: Full Name */}
        <div
          className="avsaraa-input-group"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "6px 16px",
            marginBottom: "12px",
            height: "56px",
          }}
        >
          <span style={{ color: "#786556", display: "flex", alignItems: "center" }}>
            <UserIcon size={19} />
          </span>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
            <span
              style={{
                fontSize: "11px",
                color: "#8C796B",
                fontWeight: 500,
                lineHeight: 1.1,
                marginBottom: "2px",
              }}
            >
              Full Name
            </span>
            <input
              type="text"
              name="name"
              autoComplete="name"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{
                fontSize: "14px",
                color: "#261B13",
                width: "100%",
              }}
              required
            />
          </div>
        </div>

        {/* Field 2: Mobile Number */}
        <div
          className="avsaraa-input-group"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "0 14px",
            marginBottom: "12px",
            height: "54px",
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
            +91
          </span>

          {/* Separator */}
          <div
            style={{
              width: "1px",
              height: "22px",
              backgroundColor: "#E2D7CB",
              margin: "0 2px",
            }}
          />

          <input
            type="tel"
            name="tel"
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

        {/* Field 3: Email Address (Optional) */}
        <div
          className="avsaraa-input-group"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "6px 16px",
            marginBottom: "16px",
            height: "56px",
          }}
        >
          <span style={{ color: "#786556", display: "flex", alignItems: "center" }}>
            <MailIcon size={19} />
          </span>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
            <span
              style={{
                fontSize: "11px",
                color: "#8C796B",
                fontWeight: 500,
                lineHeight: 1.1,
                marginBottom: "2px",
              }}
            >
              Email Address (Optional)
            </span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                fontSize: "14px",
                color: "#261B13",
                width: "100%",
              }}
            />
          </div>
        </div>

        {/* Checkbox: Terms & Conditions and Privacy Policy */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "10px",
            marginBottom: "18px",
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
              fontSize: "12.5px",
              lineHeight: 1.45,
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

        {/* Action Button: Create Account */}
        <button
          type="submit"
          disabled={isLoading}
          className="avsaraa-btn-primary"
          style={{ height: "52px", marginBottom: "16px" }}
        >
          {isLoading ? (
            <SpinnerIcon size={18} color="#FFFFFF" />
          ) : (
            <>
              <span>Create Account</span>
              <span>→</span>
            </>
          )}
        </button>
      </form>

      {/* OR Divider */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          margin: "0 0 14px 0",
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
          OR
        </span>
        <div style={{ flex: 1, height: "1px", backgroundColor: "#E6DBD0" }} />
      </div>

      {/* Social Buttons */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Continue with Google */}
        <button
          type="button"
          onClick={() => handleSocialSignIn("Google")}
          className="avsaraa-btn-outline"
          style={{ height: "50px" }}
        >
          <GoogleIcon size={18} />
          <span>Continue with Google</span>
        </button>

        {/* Continue with Apple */}
        <button
          type="button"
          onClick={() => handleSocialSignIn("Apple")}
          className="avsaraa-btn-outline"
          style={{ height: "50px" }}
        >
          <AppleIcon size={18} color="#000000" />
          <span>Continue with Apple</span>
        </button>
      </div>

      {/* Footer: Already have an account? Login */}
      <div
        style={{
          textAlign: "center",
          marginTop: "20px",
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
    </div>
  );
}
