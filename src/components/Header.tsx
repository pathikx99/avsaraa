"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AvsaraaLogo from "./AvsaraaLogo";
import NavigationDrawer from "./NavigationDrawer";
import { supabase } from "@/lib/supabaseClient";
import { UserIcon, ShoppingBagIcon } from "./Icons";
import { useCart } from "@/context/CartContext";
import { useScrolled } from "./RevealSection";
import type { User } from "@supabase/supabase-js";

const ANNOUNCEMENTS = [
  "✦ Free Delivery Across India on Orders Above ₹2,999",
  "✦ Handcrafted in Surat — Nationwide Online Delivery",
  "✦ 100% Pure Handloom Silk — Authenticity Guaranteed",
  "✦ Personal Styling & Custom Blouse Consultations Available",
  "✦ Festive 2026 Collection Now Available",
];

export default function Header() {
  const router = useRouter();
  const { totalItems, openCart } = useCart();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const scrolled = useScrolled(50);

  useEffect(() => {
    // Check initial user
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    // Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Fallback
    }
    await supabase.auth.signOut();
    setUser(null);
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {/* 1. Premium Marquee Announcement Bar */}
      <div className="announcement-bar">
        <div className="announcement-marquee">
          {/* Duplicate items for seamless loop */}
          {[...ANNOUNCEMENTS, ...ANNOUNCEMENTS].map((text, i) => (
            <span key={i} className="announcement-item">
              <span className="announcement-dot" />
              {text}
            </span>
          ))}
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <header
        className={scrolled ? "header-scrolled" : ""}
        style={{
          position: "sticky",
          top: 0,
          zIndex: 80,
          backgroundColor: scrolled
            ? "rgba(247, 242, 238, 0.97)"
            : "rgba(247, 242, 238, 0.94)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          borderBottom: "1px solid #E8DED3",
          padding: "14px 28px",
          transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          {/* Mobile Only: Hamburger Menu Button */}
          <div className="mobile-only" style={{ alignItems: "center", width: "40px" }}>
            <button
              onClick={() => setIsDrawerOpen(true)}
              aria-label="Open menu"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "5px",
                padding: "8px 4px",
                color: "#261B13",
                cursor: "pointer",
              }}
            >
              <span style={{ display: "block", width: "22px", height: "1.8px", backgroundColor: "#261B13", borderRadius: "1px", transition: "all 0.2s ease" }} />
              <span style={{ display: "block", width: "16px", height: "1.8px", backgroundColor: "#261B13", borderRadius: "1px", transition: "all 0.2s ease" }} />
              <span style={{ display: "block", width: "22px", height: "1.8px", backgroundColor: "#261B13", borderRadius: "1px", transition: "all 0.2s ease" }} />
            </button>
          </div>

          {/* Brand Logo */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <Link href="/" style={{ display: "inline-flex" }}>
              <AvsaraaLogo size="sm" width={118} />
            </Link>
          </div>

          {/* Desktop Only: Simple Navigation Menu */}
          <nav
            className="desktop-only"
            style={{
              alignItems: "center",
              gap: "36px",
            }}
          >
            <Link href="/" className="luxury-nav-link">
              Home
            </Link>
            <Link href="/collection" className="luxury-nav-link">
              Collection
            </Link>
            <Link href="/about" className="luxury-nav-link">
              About
            </Link>
            <Link href="/contact" className="luxury-nav-link">
              Contact
            </Link>
            {user && (
              <Link href="/account" className="luxury-nav-link">
                My Account
              </Link>
            )}
          </nav>

          {/* Right Action Area */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "14px",
              color: "#261B13",
            }}
          >
            {/* Desktop Auth Controls */}
            <div className="desktop-only" style={{ gap: "10px", alignItems: "center" }}>
              {user ? (
                <>
                  <Link
                    href="/account"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "7px",
                      fontSize: "12px",
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "#261B13",
                      padding: "6px 14px",
                      borderRadius: "20px",
                      border: "1px solid #CFBEAD",
                      backgroundColor: "#FAF7F2",
                      transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  >
                    <UserIcon size={14} color="#866951" />
                    <span>My Account</span>
                  </Link>

                  <button
                    onClick={handleSignOut}
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "#866951",
                      padding: "6px 14px",
                      borderRadius: "20px",
                      border: "1px solid transparent",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "#543E2E",
                      padding: "6px 14px",
                      borderRadius: "20px",
                      border: "1px solid #CFBEAD",
                      backgroundColor: "#FFFFFF",
                      transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "#FAF7F2",
                      backgroundColor: "#261B13",
                      padding: "6px 16px",
                      borderRadius: "20px",
                      border: "1px solid #261B13",
                      transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>

            {/* Profile Icon on Mobile */}
            <Link
              href={user ? "/account" : "/login"}
              aria-label={user ? "My Account" : "Sign In"}
              className="mobile-only"
              style={{
                padding: "6px",
                color: "#261B13",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <UserIcon size={19} color="#261B13" />
            </Link>

            {/* Shopping Bag Button (Gated to login for adding/checkout) */}
            <button
              type="button"
              onClick={openCart}
              aria-label={`Shopping Bag with ${totalItems} items`}
              style={{
                position: "relative",
                padding: "6px",
                color: "#261B13",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: "none",
                border: "none",
                cursor: "pointer",
                transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <ShoppingBagIcon size={19} color="#261B13" />
              <span
                style={{
                  position: "absolute",
                  top: "0px",
                  right: "0px",
                  minWidth: "17px",
                  height: "17px",
                  padding: "0 4px",
                  backgroundColor: totalItems > 0 ? "#866951" : "#CFBEAD",
                  color: "#FAF7F2",
                  borderRadius: "10px",
                  fontSize: "9px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  transform: totalItems > 0 ? "scale(1)" : "scale(0.85)",
                }}
              >
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. Mobile Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        user={user}
        onLogout={handleSignOut}
      />
    </>
  );
}
