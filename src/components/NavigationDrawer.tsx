"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import AvsaraaLogo from "./AvsaraaLogo";
import { UserIcon, WhatsAppIcon, ShoppingBagIcon, HeartIcon } from "./Icons";
import type { User } from "@supabase/supabase-js";

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  onLogout?: () => void;
}

export default function NavigationDrawer({
  isOpen,
  onClose,
  user,
  onLogout,
}: NavigationDrawerProps) {
  if (!isOpen) return null;

  const categories = [
    { label: "SAREES", href: "/#products-sarees" },
    { label: "DRESSES", href: "/#products-dresses" },
    { label: "NEW ARRIVALS", href: "/#products-new-arrivals" },
    { label: "OCCASION WEAR", href: "/#products-occasion-wear" },
  ];

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
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
      />

      {/* Drawer Panel */}
      <div
        style={{
          position: "relative",
          width: "330px",
          maxWidth: "85vw",
          height: "100%",
          backgroundColor: "#FAF7F2",
          borderRight: "1px solid #E6DACF",
          display: "flex",
          flexDirection: "column",
          padding: "24px 22px 32px 22px",
          boxShadow: "10px 0 35px rgba(38, 27, 19, 0.2)",
          animation: "slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          overflowY: "auto",
        }}
      >
        {/* Botanical watercolor art in bottom right matching reference image */}
        <div
          style={{
            position: "absolute",
            right: "-20px",
            bottom: "-10px",
            width: "210px",
            height: "210px",
            pointerEvents: "none",
            opacity: 0.65,
            zIndex: 0,
          }}
        >
          <Image
            src="/images/botanical_flowers.jpg"
            alt=""
            fill
            sizes="210px"
            style={{ objectFit: "contain", transform: "rotate(-15deg)", mixBlendMode: "multiply" }}
          />
        </div>

        {/* Top Header: Logo + Close Button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "28px",
            position: "relative",
            zIndex: 1,
          }}
        >
          <AvsaraaLogo size="md" width={138} />
          <button
            onClick={onClose}
            aria-label="Close menu"
            style={{
              padding: "6px",
              color: "#261B13",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              background: "none",
              border: "none",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* 1. PRODUCT CATEGORIES (Matching Reference Image) */}
        <nav style={{ display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
          {categories.map((cat) => (
            <Link
              key={cat.label}
              href={cat.href}
              onClick={onClose}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 0",
                borderBottom: "1px solid #EFE6DC",
                fontSize: "13.5px",
                fontFamily: "var(--font-serif), Georgia, serif",
                letterSpacing: "0.12em",
                color: "#261B13",
                fontWeight: 600,
              }}
            >
              <span>{cat.label}</span>
              <span style={{ color: "#866951", fontSize: "16px" }}>›</span>
            </Link>
          ))}
        </nav>

        {/* 2. USER ACTIONS: My Account (only when signed in), Wishlist, My Bag */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: "10px", position: "relative", zIndex: 1 }}>
          {user && (
            <Link
              href="/account"
              onClick={onClose}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "15px 0",
                borderBottom: "1px solid #EFE6DC",
                fontSize: "14px",
                color: "#3B2A1E",
                fontWeight: 500,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <UserIcon size={18} color="#866951" />
                <span>My Account</span>
              </div>
              <span style={{ color: "#866951", fontSize: "16px" }}>›</span>
            </Link>
          )}

          <Link
            href="/#wishlist"
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "15px 0",
              borderBottom: "1px solid #EFE6DC",
              fontSize: "14px",
              color: "#3B2A1E",
              fontWeight: 500,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <HeartIcon size={18} color="#866951" />
              <span>Wishlist</span>
            </div>
            <span style={{ color: "#866951", fontSize: "16px" }}>›</span>
          </Link>

          <Link
            href={user ? "/account" : "/login"}
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "15px 0",
              borderBottom: "1px solid #EFE6DC",
              fontSize: "14px",
              color: "#3B2A1E",
              fontWeight: 500,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <ShoppingBagIcon size={18} color="#866951" />
              <span>My Bag (0)</span>
            </div>
            <span style={{ color: "#866951", fontSize: "16px" }}>›</span>
          </Link>
        </div>

        {/* 3. MINIMAL INFO LINKS: About Us, Contact Us */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: "12px", position: "relative", zIndex: 1 }}>
          <Link
            href="/#about"
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 0",
              borderBottom: "1px solid #EFE6DC",
              fontSize: "13.5px",
              color: "#543E2E",
              fontWeight: 500,
            }}
          >
            <span>About Us</span>
            <span style={{ color: "#AC9885", fontSize: "16px" }}>›</span>
          </Link>

          <Link
            href="/#contact"
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 0",
              borderBottom: "1px solid #EFE6DC",
              fontSize: "13.5px",
              color: "#543E2E",
              fontWeight: 500,
            }}
          >
            <span>Contact Us</span>
            <span style={{ color: "#AC9885", fontSize: "16px" }}>›</span>
          </Link>
        </div>

        {/* Signature Quote from Image: "Thoughtfully chosen. Beautifully worn." */}
        <div style={{ marginTop: "24px", position: "relative", zIndex: 1 }}>
          <p
            style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontSize: "16px",
              fontStyle: "italic",
              color: "#6E5B4E",
              lineHeight: 1.35,
            }}
          >
            Thoughtfully chosen.<br />
            Beautifully worn.
          </p>
        </div>

        {/* Auth Actions in Drawer */}
        <div style={{ marginTop: "28px" }}>
          {user ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div
                style={{
                  padding: "14px 16px",
                  backgroundColor: "#F2EBE3",
                  borderRadius: "12px",
                  border: "1px solid #E6DACF",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <UserIcon size={18} color="#866951" />
                <div style={{ overflow: "hidden" }}>
                  <span style={{ display: "block", fontSize: "11px", color: "#866951", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.06em" }}>
                    Signed in as
                  </span>
                  <span style={{ display: "block", fontSize: "13px", color: "#261B13", fontWeight: 500, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                    {user.email}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onLogout?.();
                }}
                className="avsaraa-btn-outline"
                style={{
                  height: "44px",
                  fontSize: "13px",
                  fontWeight: 600,
                  borderColor: "#866951",
                  color: "#866951",
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "10px" }}>
              <Link
                href="/login"
                onClick={onClose}
                className="avsaraa-btn-primary"
                style={{
                  flex: 1,
                  height: "44px",
                  fontSize: "12.5px",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={onClose}
                className="avsaraa-btn-outline"
                style={{
                  flex: 1,
                  height: "44px",
                  fontSize: "12.5px",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  backgroundColor: "#FFFFFF",
                }}
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* WhatsApp Callout */}
        <div style={{ marginTop: "auto", paddingTop: "28px" }}>
          <a
            href="https://wa.me/912226401234?text=Hello%20Avsaraa%2C%20I%20have%20a%20question%20about%20your%20sarees."
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "12px",
              borderRadius: "10px",
              backgroundColor: "#261B13",
              color: "#FAF7F2",
              fontSize: "12.5px",
              fontWeight: 500,
            }}
          >
            <WhatsAppIcon size={16} color="#25D366" />
            <span>Chat on WhatsApp</span>
          </a>
          <p style={{ marginTop: "12px", textAlign: "center", fontSize: "11px", color: "#8E7D70" }}>
            Mumbai Studio • Mon-Sat 10:00 - 19:30
          </p>
        </div>
      </div>
    </div>
  );
}
