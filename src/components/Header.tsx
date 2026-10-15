"use client";

import React, { useState } from "react";
import Link from "next/link";
import AvsaraaLogo from "./AvsaraaLogo";
import NavigationDrawer from "./NavigationDrawer";

export default function Header() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      {/* 1. Announcement Bar (from Docs/WhatsApp Image 2026-10-12 at 10.52.42 PM.jpeg) */}
      <div
        style={{
          backgroundColor: "#E6DACF",
          color: "#261B13",
          textAlign: "center",
          padding: "8px 16px",
          fontSize: "12px",
          fontWeight: 500,
          letterSpacing: "0.04em",
          borderBottom: "1px solid rgba(196, 171, 148, 0.4)",
        }}
      >
        <span>Free Shipping on All Orders</span>
        <span style={{ margin: "0 10px", opacity: 0.5 }}>|</span>
        <span>Easy Returns</span>
        <span style={{ margin: "0 10px", opacity: 0.5 }}>|</span>
        <span>Premium Quality</span>
      </div>

      {/* 2. Main Navigation Bar */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 80,
          backgroundColor: "#F7F2EE",
          borderBottom: "1px solid #E8DED3",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backdropFilter: "blur(10px)",
        }}
      >
        {/* Left: Hamburger Icon */}
        <div style={{ display: "flex", alignItems: "center", width: "120px" }}>
          <button
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Open menu"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "5px",
              padding: "6px",
              color: "#261B13",
            }}
          >
            <span style={{ display: "block", width: "22px", height: "1.8px", backgroundColor: "#261B13", borderRadius: "1px" }} />
            <span style={{ display: "block", width: "22px", height: "1.8px", backgroundColor: "#261B13", borderRadius: "1px" }} />
            <span style={{ display: "block", width: "22px", height: "1.8px", backgroundColor: "#261B13", borderRadius: "1px" }} />
          </button>
        </div>

        {/* Center: Brand Logo */}
        <div style={{ display: "flex", justifyContent: "center", flex: 1 }}>
          <Link href="/" style={{ display: "inline-flex" }}>
            <AvsaraaLogo size="sm" width={115} />
          </Link>
        </div>

        {/* Right: Search, Wishlist, Bag, Account */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "16px",
            width: "120px",
            color: "#261B13",
          }}
        >
          {/* Search Icon */}
          <button aria-label="Search" style={{ color: "#261B13", display: "flex", alignItems: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          {/* Wishlist Icon */}
          <Link href="/account" aria-label="Wishlist" style={{ color: "#261B13", display: "flex", alignItems: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </Link>

          {/* Account Icon */}
          <Link
            href="/account"
            aria-label="My Account"
            style={{ color: "#261B13", display: "flex", alignItems: "center" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Link>

          {/* Bag Icon with Counter */}
          <Link
            href="/login"
            aria-label="Shopping Bag"
            style={{
              position: "relative",
              color: "#261B13",
              display: "flex",
              alignItems: "center",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span
              style={{
                position: "absolute",
                top: "-6px",
                right: "-8px",
                backgroundColor: "#866951",
                color: "#FFFFFF",
                fontSize: "10px",
                fontWeight: 600,
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              0
            </span>
          </Link>
        </div>
      </header>

      {/* Slide-out Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
}
