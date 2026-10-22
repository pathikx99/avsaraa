"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import LoginForm from "@/components/LoginForm";
import AvsaraaLogo from "@/components/AvsaraaLogo";

export default function LoginPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#F7F2EE",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Top Desktop Navigation (visible on tablet/desktop) */}
      <header
        className="login-desktop-nav"
        style={{
          width: "100%",
          padding: "16px 36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #E6DACF",
          backgroundColor: "#FAF7F2",
        }}
      >
        <Link href="/" style={{ display: "inline-flex" }}>
          <AvsaraaLogo size="sm" width={140} />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <span style={{ fontSize: "13.5px", color: "#6E5B4E" }}>
            Don&apos;t have an account?
          </span>
          <Link
            href="/register"
            style={{
              fontSize: "13.5px",
              fontWeight: 600,
              color: "#261B13",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
            }}
          >
            Create an Account →
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        className="login-main-container"
      >
        {/* On Mobile: Fills 100% of viewport without frames or borders */}
        {/* On Desktop: Renders inside a luxury 2-column editorial card */}
        <div
          className="login-responsive-card"
          style={{
            width: "100%",
            maxWidth: "1020px",
            backgroundColor: "#FAF7F2",
            display: "flex",
            flexDirection: "row",
            overflow: "hidden",
          }}
        >
          {/* Left Editorial Banner (Desktop Only) */}
          <div
            className="login-desktop-banner"
            style={{
              flex: 1.1,
              position: "relative",
              minHeight: "680px",
              overflow: "hidden",
              backgroundColor: "#261B13",
            }}
          >
            <Image
              src="/images/saree_model_hero.jpg"
              alt="Avsaraa Sarees"
              fill
              sizes="(min-width: 900px) 50vw, 100vw"
              style={{
                objectFit: "cover",
                objectPosition: "center 15%",
                opacity: 0.88,
              }}
              priority
            />
            {/* Gradient Overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(to top, rgba(38, 27, 19, 0.92) 0%, rgba(38, 27, 19, 0.3) 50%, rgba(38, 27, 19, 0.4) 100%)",
              }}
            />

            {/* Content on Desktop Banner */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                padding: "48px 40px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                zIndex: 10,
                color: "#FFFFFF",
              }}
            >
              <div>
                <AvsaraaLogo size="md" width={160} />
              </div>

              <div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "#C4AB94",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  WELCOME TO AVSARAA
                </span>
                <p
                  style={{
                    fontFamily: "var(--font-serif), Georgia, serif",
                    fontSize: "36px",
                    fontStyle: "italic",
                    lineHeight: 1.25,
                    marginBottom: "14px",
                    textShadow: "0 2px 10px rgba(0,0,0,0.3)",
                  }}
                >
                  &ldquo;Thoughtfully paired. Beautifully yours.&rdquo;
                </p>
                <p
                  style={{
                    fontSize: "14px",
                    lineHeight: 1.6,
                    color: "rgba(255, 255, 255, 0.85)",
                    maxWidth: "400px",
                  }}
                >
                  Sign in to view your account, manage saved addresses, and shop handmade sarees with ease.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column / Mobile Screen: Exact Mobile View from Reference */}
          <div
            className="login-form-container"
            style={{
              width: "100%",
              maxWidth: "440px",
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#FAF7F2",
            }}
          >
            <Suspense fallback={<div style={{ padding: "40px", textAlign: "center", color: "#866951" }}>Loading...</div>}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>

      <style jsx global>{`
        /* Mobile View (Phone): Full bleed, native feel, no desktop nav */
        @media (max-width: 899px) {
          .login-desktop-nav {
            display: none !important;
          }
          .login-desktop-banner {
            display: none !important;
          }
          .login-main-container {
            padding: 0 !important;
            align-items: flex-start !important;
          }
          .login-responsive-card {
            max-width: 100% !important;
            min-height: 100vh !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .login-form-container {
            max-width: 100% !important;
            min-height: 100vh !important;
          }
        }

        /* Desktop & Tablet: Luxury editorial card styling */
        @media (min-width: 900px) {
          .login-desktop-nav {
            display: flex !important;
          }
          .login-main-container {
            padding: 40px 24px !important;
          }
          .login-responsive-card {
            border-radius: 28px !important;
            box-shadow: 0 20px 50px -15px rgba(38, 27, 19, 0.12) !important;
            border: 1px solid #E6DACF !important;
          }
          .login-form-container {
            border-left: 1px solid #E6DACF !important;
          }
        }
      `}</style>
    </main>
  );
}
