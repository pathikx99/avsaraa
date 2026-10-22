"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AvsaraaLogo from "./AvsaraaLogo";
import NavigationDrawer from "./NavigationDrawer";
import { supabase } from "@/lib/supabaseClient";
import { UserIcon, ShoppingBagIcon } from "./Icons";
import { useCart } from "@/context/CartContext";
import type { User } from "@supabase/supabase-js";

export default function Header() {
  const router = useRouter();
  const { totalItems, openCart } = useCart();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [activeAnnouncement, setActiveAnnouncement] = useState(0);

  const announcements = [
    "✦ Free Delivery Across India on Orders Above ₹2,999",
    "✦ Handcrafted in Surat • Nationwide Online Delivery",
    "✦ Chat with Us on WhatsApp for Sizing & Help",
  ];

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

    // Rotate announcements on mobile
    const interval = setInterval(() => {
      setActiveAnnouncement((prev) => (prev + 1) % announcements.length);
    }, 4000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [announcements.length]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
    router.refresh();
  };

  return (
    <>
      {/* 1. Top Announcement Bar */}
      <div
        style={{
          backgroundColor: "#E6DACF",
          color: "#261B13",
          textAlign: "center",
          padding: "8px 16px",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          borderBottom: "1px solid rgba(196, 171, 148, 0.45)",
          overflow: "hidden",
        }}
      >
        {/* Desktop: Full Announcement */}
        <div
          className="desktop-only"
          style={{
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            width: "100%",
          }}
        >
          <span>✦ Free Delivery in India Above ₹2,999</span>
          <span style={{ opacity: 0.35 }}>•</span>
          <span>Pure Handmade Silks</span>
          <span style={{ opacity: 0.35 }}>•</span>
          <span>WhatsApp Help Available</span>
        </div>

        {/* Mobile: Smooth Rotating Single Message */}
        <div
          className="mobile-only"
          style={{
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            height: "16px",
            transition: "opacity 0.3s ease",
          }}
        >
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {announcements[activeAnnouncement]}
          </span>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 80,
          backgroundColor: "rgba(247, 242, 238, 0.94)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid #E8DED3",
          padding: "14px 28px",
          transition: "all 0.25s ease",
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
              <span style={{ display: "block", width: "22px", height: "1.8px", backgroundColor: "#261B13", borderRadius: "1px" }} />
              <span style={{ display: "block", width: "16px", height: "1.8px", backgroundColor: "#261B13", borderRadius: "1px" }} />
              <span style={{ display: "block", width: "22px", height: "1.8px", backgroundColor: "#261B13", borderRadius: "1px" }} />
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
                      transition: "all 0.2s ease",
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
                      transition: "all 0.2s ease",
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
                      transition: "all 0.2s ease",
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
                transition: "transform 0.15s ease",
              }}
            >
              <ShoppingBagIcon size={19} color="#261B13" />
              <span
                style={{
                  position: "absolute",
                  top: "2px",
                  right: "2px",
                  minWidth: "15px",
                  height: "15px",
                  padding: "0 4px",
                  backgroundColor: totalItems > 0 ? "#866951" : "#CFBEAD",
                  color: "#FAF7F2",
                  borderRadius: "10px",
                  fontSize: "9px",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
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
