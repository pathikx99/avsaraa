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

        {/* Primary Categories */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {[
            { label: "SAREES", href: "/#sarees" },
            { label: "DRESSES", href: "/#dresses" },
            { label: "NEW ARRIVALS", href: "/#new-arrivals" },
            { label: "OCCASION WEAR", href: "/#occasion-wear" },
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
                fontSize: "14px",
                fontWeight: 600,
                letterSpacing: "0.1em",
                color: "#261B13",
                textTransform: "uppercase",
              }}
            >
              <span>{item.label}</span>
              <span style={{ color: "#AC9885", fontSize: "16px" }}>›</span>
            </Link>
          ))}
        </nav>

        {/* User Account / Bag links */}
        <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "4px" }}>
          <Link
            href="/login"
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 0",
              fontSize: "14px",
              color: "#4A3525",
              fontWeight: 500,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>My Account</span>
            </div>
            <span style={{ color: "#AC9885", fontSize: "16px" }}>›</span>
          </Link>

          <Link
            href="/login"
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 0",
              fontSize: "14px",
              color: "#4A3525",
              fontWeight: 500,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span>Wishlist</span>
            </div>
            <span style={{ color: "#AC9885", fontSize: "16px" }}>›</span>
          </Link>

          <Link
            href="/login"
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 0",
              fontSize: "14px",
              color: "#4A3525",
              fontWeight: 500,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span>My Bag (0)</span>
            </div>
            <span style={{ color: "#AC9885", fontSize: "16px" }}>›</span>
          </Link>
        </div>

        {/* Secondary Links: About Us, Contact */}
        <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #EFE6DC" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <Link href="/login" onClick={onClose} style={{ fontSize: "13.5px", color: "#6E5B4E", display: "flex", justifyContent: "space-between" }}>
              <span>About Us</span>
              <span style={{ color: "#AC9885" }}>›</span>
            </Link>
            <Link href="/login" onClick={onClose} style={{ fontSize: "13.5px", color: "#6E5B4E", display: "flex", justifyContent: "space-between" }}>
              <span>Contact Us</span>
              <span style={{ color: "#AC9885" }}>›</span>
            </Link>
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
              style={{ objectFit: "contain" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
