"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import AvsaraaLogo from "./AvsaraaLogo";

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NavigationDrawer({ isOpen, onClose }: NavigationDrawerProps) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(38, 27, 19, 0.45)",
          backdropFilter: "blur(3px)",
        }}
      />

      {/* Drawer Panel matching Docs/WhatsApp Image 2026-10-13 at 12.24.34 AM.jpeg */}
      <div
        style={{
          position: "relative",
          width: "320px",
          maxWidth: "85vw",
          height: "100%",
          backgroundColor: "#FAF7F2",
          display: "flex",
          flexDirection: "column",
          padding: "24px 20px 32px 24px",
          boxShadow: "10px 0 30px rgba(0,0,0,0.15)",
          animation: "slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          overflowY: "auto",
        }}
      >
        {/* Top Header: Logo + Close Button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "32px",
          }}
        >
          <AvsaraaLogo size="md" width={155} />
          <button
            onClick={onClose}
            aria-label="Close menu"
            style={{
              padding: "8px",
              color: "#261B13",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Primary Navigation */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {[
            { label: "HOME", href: "/", icon: "✦" },
            { label: "MY ACCOUNT", href: "/account", icon: "👤" },
            { label: "LOGIN", href: "/login", icon: "→" },
            { label: "REGISTER", href: "/register", icon: "✨" },
            { label: "ABOUT US", href: "/#about-us", icon: "📜" },
            { label: "CONTACT US", href: "/#contact-us", icon: "✉️" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 0",
                borderBottom: "1px solid #EFE6DC",
                fontSize: "13px",
                fontWeight: 600,
                letterSpacing: "0.12em",
                color: "#261B13",
                textTransform: "uppercase",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ color: "#AC9885", fontSize: "14px" }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              <span style={{ color: "#AC9885", fontSize: "16px" }}>›</span>
            </Link>
          ))}
        </nav>

        {/* Quick Access Section */}
        <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "6px" }}>
          <div
            style={{
              padding: "16px",
              backgroundColor: "#F2EBE3",
              borderRadius: "14px",
              border: "1px solid #E6DACF",
            }}
          >
            <span
              style={{
                fontSize: "10.5px",
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#866951",
                display: "block",
                marginBottom: "4px",
              }}
            >
              AVSARAA ATELIER
            </span>
            <p
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "16px",
                color: "#261B13",
                fontStyle: "italic",
                marginBottom: "10px",
              }}
            >
              Welcome to effortless grace.
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <Link
                href="/login"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  backgroundColor: "#261B13",
                  color: "#FAF7F2",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  textAlign: "center",
                  letterSpacing: "0.04em",
                }}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  backgroundColor: "#FFFFFF",
                  color: "#261B13",
                  border: "1px solid #CFBEAD",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 600,
                  textAlign: "center",
                  letterSpacing: "0.04em",
                }}
              >
                Join Free
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Tagline & Botanical Sprig */}
        <div style={{ marginTop: "auto", paddingTop: "32px", position: "relative" }}>
          <div style={{ width: "36px", height: "1px", backgroundColor: "#C4AB94", marginBottom: "12px" }} />
          <p
            style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontSize: "18px",
              fontStyle: "italic",
              color: "#543E2E",
              lineHeight: 1.3,
            }}
          >
            Thoughtfully chosen.
            <br />
            Beautifully worn.
          </p>

          <div
            style={{
              position: "absolute",
              right: "-20px",
              bottom: "-20px",
              width: "120px",
              height: "120px",
              pointerEvents: "none",
              opacity: 0.6,
            }}
          >
            <Image
              src="/images/botanical_flowers.jpg"
              alt=""
              fill
              sizes="120px"
              style={{ objectFit: "contain", mixBlendMode: "multiply" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
