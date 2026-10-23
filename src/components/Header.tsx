"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import AvsaraaLogo from "./AvsaraaLogo";
import NavigationDrawer from "./NavigationDrawer";
import { supabase } from "@/lib/supabaseClient";
import { UserIcon, ShoppingBagIcon, HeartIcon, SearchIcon, CloseIcon } from "./Icons";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useScrolled } from "./RevealSection";
import type { User } from "@supabase/supabase-js";

const ANNOUNCEMENTS = [
  "Free Insured Delivery Across India on Orders Above ₹2,999",
  "Handcrafted in Surat — Nationwide Direct Atelier Shipping",
  "100% Pure Handloom Silk — Certificate of Authenticity Included",
  "Complimentary Fall, Pico & Blouse Tailoring Consultation",
  "Festive 2026 Collection Now Available for Preview",
];

const QUICK_SEARCH_TERMS = [
  "Banarasi Silk",
  "Tissue Organza",
  "Heritage Anarkali",
  "Pure Chanderi",
  "Bridal Drape",
  "Zari Weaves",
];

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { totalItems, openCart } = useCart();
  const { totalWishlist } = useWishlist();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const scrolled = useScrolled(35);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    if (isSearchOpen) {
      setIsSearchOpen(false);
    }
  }

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/collection?search=${encodeURIComponent(searchQuery.trim())}`);
    setIsSearchOpen(false);
  };

  const handleQuickTagClick = (term: string) => {
    setSearchQuery(term);
    router.push(`/collection?search=${encodeURIComponent(term)}`);
    setIsSearchOpen(false);
  };

  return (
    <>
      {/* 1. Regal Top Gold Trim */}
      <div
        style={{
          height: "2px",
          background: "linear-gradient(90deg, #9E7836 0%, #ECC880 25%, #D4AF37 50%, #ECC880 75%, #9E7836 100%)",
          width: "100%",
        }}
      />

      {/* 2. Premium Marquee Announcement Bar */}
      <div className="announcement-bar">
        <div className="announcement-marquee">
          {[...ANNOUNCEMENTS, ...ANNOUNCEMENTS].map((text, i) => (
            <span key={i} className="announcement-item">
              <span className="announcement-dot" />
              <span>✦</span>
              <span>{text}</span>
            </span>
          ))}
        </div>
      </div>

      {/* 3. Main Navigation Bar */}
      <header
        className={scrolled ? "header-scrolled" : ""}
        style={{
          position: "sticky",
          top: 0,
          zIndex: 85,
          backgroundColor: scrolled
            ? "rgba(247, 242, 238, 0.98)"
            : "rgba(247, 242, 238, 0.94)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(207, 190, 173, 0.5)",
          padding: scrolled ? "10px 24px" : "14px 28px",
          boxShadow: scrolled
            ? "0 8px 32px rgba(38, 27, 19, 0.08), 0 1px 0 rgba(197, 160, 89, 0.2)"
            : "none",
          transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div
          style={{
            maxWidth: "1320px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          {/* Mobile Only: Left Area with Hamburger Menu */}
          <div className="mobile-only" style={{ alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => setIsDrawerOpen(true)}
              aria-label="Open navigation menu"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "5px",
                padding: "8px 6px",
                color: "#261B13",
                cursor: "pointer",
                background: "transparent",
              }}
            >
              <span style={{ display: "block", width: "22px", height: "1.8px", backgroundColor: "#261B13", borderRadius: "2px", transition: "all 0.25s ease" }} />
              <span style={{ display: "block", width: "16px", height: "1.8px", backgroundColor: "#C5A059", borderRadius: "2px", transition: "all 0.25s ease" }} />
              <span style={{ display: "block", width: "22px", height: "1.8px", backgroundColor: "#261B13", borderRadius: "2px", transition: "all 0.25s ease" }} />
            </button>

            {/* Quick Search Button on Mobile */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              aria-label="Search collection"
              style={{
                padding: "8px",
                color: "#261B13",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
              }}
            >
              <SearchIcon size={18} color="#261B13" />
            </button>
          </div>

          {/* Brand Logo (Center on mobile, Left on desktop) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                transition: "transform 0.25s ease",
              }}
              className="logo-hover-glow"
            >
              <AvsaraaLogo size={scrolled ? "sm" : "md"} width={scrolled ? 116 : 138} />
            </Link>
          </div>

          {/* Desktop Only: Royal Navigation Menu */}
          <nav
            className="desktop-only"
            style={{
              alignItems: "center",
              gap: "38px",
            }}
          >
            <Link
              href="/"
              className={`luxury-nav-link ${pathname === "/" ? "active" : ""}`}
            >
              Home
            </Link>
            <Link
              href="/collection"
              className={`luxury-nav-link ${pathname.startsWith("/collection") ? "active" : ""}`}
            >
              Collection
            </Link>
            <Link
              href="/collection?category=Sarees"
              className="luxury-nav-link"
            >
              Sarees
            </Link>
            <Link
              href="/collection?category=Dresses"
              className="luxury-nav-link"
            >
              Dresses
            </Link>
            <Link
              href="/about"
              className={`luxury-nav-link ${pathname === "/about" ? "active" : ""}`}
            >
              Our Story
            </Link>
            <Link
              href="/contact"
              className={`luxury-nav-link ${pathname === "/contact" ? "active" : ""}`}
            >
              Studio
            </Link>
          </nav>

          {/* Right Action Icons Area */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "10px",
              color: "#261B13",
            }}
          >
            {/* Desktop Search Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="desktop-only"
              aria-label="Search handcrafted collection"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "7px 14px",
                borderRadius: "20px",
                backgroundColor: "rgba(255, 255, 255, 0.75)",
                border: "1px solid #E6DACF",
                color: "#6E5B4E",
                fontSize: "12px",
                cursor: "pointer",
                transition: "all 0.25s ease",
              }}
            >
              <SearchIcon size={14} color="#866951" />
              <span>Search Weaves...</span>
            </button>

            {/* Wishlist Link with Live Badge */}
            <Link
              href="/wishlist"
              aria-label={`Saved pieces: ${totalWishlist}`}
              style={{
                position: "relative",
                padding: "8px",
                color: totalWishlist > 0 ? "#B83A4B" : "#261B13",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                transition: "transform 0.2s ease, color 0.2s ease",
              }}
            >
              <HeartIcon
                size={19}
                color={totalWishlist > 0 ? "#B83A4B" : "#261B13"}
              />
              {totalWishlist > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "2px",
                    right: "2px",
                    minWidth: "16px",
                    height: "16px",
                    padding: "0 3px",
                    backgroundColor: "#B83A4B",
                    color: "#FAF7F2",
                    borderRadius: "10px",
                    fontSize: "9px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 6px rgba(184, 58, 75, 0.35)",
                    lineHeight: 1,
                  }}
                >
                  {totalWishlist}
                </span>
              )}
            </Link>

            {/* Desktop Auth Controls */}
            <div className="desktop-only" style={{ gap: "8px", alignItems: "center" }}>
              {user ? (
                <>
                  <Link
                    href="/account"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "7px",
                      fontSize: "11.5px",
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "#261B13",
                      padding: "7px 14px",
                      borderRadius: "20px",
                      border: "1px solid #CFBEAD",
                      backgroundColor: "#FAF7F2",
                      transition: "all 0.25s ease",
                    }}
                  >
                    <UserIcon size={13} color="#866951" />
                    <span>My Account</span>
                  </Link>

                  <button
                    onClick={handleSignOut}
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "#8E7D70",
                      padding: "6px 10px",
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
                      fontSize: "11.5px",
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "#543E2E",
                      padding: "7px 14px",
                      borderRadius: "20px",
                      border: "1px solid #CFBEAD",
                      backgroundColor: "#FFFFFF",
                      transition: "all 0.25s ease",
                    }}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="btn-shine"
                    style={{
                      fontSize: "11.5px",
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "#FAF7F2",
                      backgroundColor: "#261B13",
                      padding: "7px 16px",
                      borderRadius: "20px",
                      border: "1px solid #261B13",
                      boxShadow: "0 4px 14px rgba(38, 27, 19, 0.2)",
                      transition: "all 0.25s ease",
                    }}
                  >
                    Join
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
                padding: "8px",
                color: "#261B13",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <UserIcon size={19} color="#261B13" />
            </Link>

            {/* Shopping Bag Button */}
            <button
              type="button"
              onClick={openCart}
              aria-label={`Shopping Bag with ${totalItems} items`}
              style={{
                position: "relative",
                padding: "8px",
                color: "#261B13",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: "none",
                border: "none",
                cursor: "pointer",
                transition: "transform 0.2s ease",
              }}
            >
              <ShoppingBagIcon size={20} color="#261B13" />
              <span
                style={{
                  position: "absolute",
                  top: "2px",
                  right: "1px",
                  minWidth: "17px",
                  height: "17px",
                  padding: "0 4px",
                  backgroundColor: totalItems > 0 ? "#C5A059" : "#CFBEAD",
                  color: totalItems > 0 ? "#1A120C" : "#FFFFFF",
                  borderRadius: "10px",
                  fontSize: "9.5px",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                  transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  transform: totalItems > 0 ? "scale(1)" : "scale(0.85)",
                  lineHeight: 1,
                }}
              >
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            </button>
          </div>
        </div>

        {/* 4. Luxury Quick Search Slide-Down Bar */}
        {isSearchOpen && (
          <div
            style={{
              paddingTop: "16px",
              paddingBottom: "10px",
              borderTop: "1px solid #EAE0D5",
              marginTop: "12px",
              animation: "fadeIn 0.25s ease both",
            }}
          >
            <form
              onSubmit={handleSearchSubmit}
              style={{
                maxWidth: "720px",
                margin: "0 auto",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #C5A059",
                borderRadius: "28px",
                padding: "6px 18px",
                boxShadow: "0 10px 30px rgba(197, 160, 89, 0.15)",
              }}
            >
              <SearchIcon size={18} color="#C5A059" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Banarasi, Organza, Silk Sarees, Anarkalis..."
                style={{
                  flex: 1,
                  height: "38px",
                  fontSize: "14px",
                  color: "#261B13",
                  backgroundColor: "transparent",
                  border: "none",
                  outline: "none",
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  style={{ color: "#8E7D70", padding: "4px" }}
                >
                  <CloseIcon size={14} color="#8E7D70" />
                </button>
              )}
              <button
                type="submit"
                style={{
                  backgroundColor: "#261B13",
                  color: "#FAF7F2",
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "8px 18px",
                  borderRadius: "20px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                aria-label="Close search"
                style={{
                  color: "#8E7D70",
                  padding: "4px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </form>

            {/* Quick Trend Chips */}
            <div
              style={{
                maxWidth: "720px",
                margin: "10px auto 0 auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "11px", color: "#8E7D70", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Trending:
              </span>
              {QUICK_SEARCH_TERMS.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => handleQuickTagClick(term)}
                  style={{
                    fontSize: "11px",
                    color: "#6E523D",
                    backgroundColor: "#FAF7F2",
                    border: "1px solid #E6DACF",
                    borderRadius: "14px",
                    padding: "3px 10px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#C5A059";
                    e.currentTarget.style.color = "#261B13";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#E6DACF";
                    e.currentTarget.style.color = "#6E523D";
                  }}
                >
                  ✦ {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* 5. Mobile Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        user={user}
        onLogout={handleSignOut}
      />
    </>
  );
}
