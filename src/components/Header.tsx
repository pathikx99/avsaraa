"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import AvsaraaLogo from "./AvsaraaLogo";
import NavigationDrawer from "./NavigationDrawer";
import { supabase } from "@/lib/supabaseClient";
import { UserIcon, ShoppingBagIcon, HeartIcon, SearchIcon, CloseIcon } from "./Icons";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useScrolled } from "./RevealSection";
import type { User } from "@supabase/supabase-js";

const ANNOUNCEMENTS = [
  "FREE SHIPPING ON ALL ORDERS ABOVE ₹999",
  "100% PURE HANDLOOM SILK & WEAVES",
  "COMPLIMENTARY BLOUSE TAILORING",
  "SURAT ATELIER • PAN-INDIA SHIPPING",
];

const QUICK_SEARCH_TERMS = [
  "Banarasi Silk",
  "Tissue Organza",
  "Heritage Anarkali",
  "Pure Chanderi",
  "Bridal Drape",
  "Zari Weaves",
];

function HeaderInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams ? searchParams.get("category") : null;

  const { totalItems, openCart } = useCart();
  const { totalWishlist } = useWishlist();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const scrolled = useScrolled(35);

  const isHomeActive = pathname === "/" && !currentCategory;
  const isProductsActive = (pathname.startsWith("/products") || pathname.startsWith("/collection")) && (!currentCategory || currentCategory === "ALL");
  const isSareesActive = (pathname.startsWith("/products") || pathname.startsWith("/collection")) && currentCategory?.toLowerCase().includes("saree");
  const isDressesActive = (pathname.startsWith("/products") || pathname.startsWith("/collection")) && currentCategory?.toLowerCase().includes("dress");
  const isStoryActive = pathname === "/about";

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
    router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    setIsSearchOpen(false);
  };

  const handleQuickTagClick = (term: string) => {
    setSearchQuery(term);
    router.push(`/products?search=${encodeURIComponent(term)}`);
    setIsSearchOpen(false);
  };

  const [announcementIdx, setAnnouncementIdx] = useState(0);

  const handlePrevAnnouncement = () => {
    setAnnouncementIdx((prev) => (prev === 0 ? ANNOUNCEMENTS.length - 1 : prev - 1));
  };

  const handleNextAnnouncement = () => {
    setAnnouncementIdx((prev) => (prev === ANNOUNCEMENTS.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setAnnouncementIdx((prev) => (prev === ANNOUNCEMENTS.length - 1 ? 0 : prev + 1));
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {/* 1. Dark Espresso Announcement Bar with Chevrons */}
      <div className="announcement-bar-espresso">
        <button
          onClick={handlePrevAnnouncement}
          aria-label="Previous announcement"
          className="announcement-chevron-btn"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="announcement-text-slider">
          {ANNOUNCEMENTS[announcementIdx]}
        </div>

        <button
          onClick={handleNextAnnouncement}
          aria-label="Next announcement"
          className="announcement-chevron-btn"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* 2. Main Navigation Bar */}
      <header className={`avsaraa-main-header ${scrolled ? "header-scrolled" : ""}`}>
        <div className="header-inner-grid">
          {/* Left: Hamburger Menu (Mobile) & Desktop Navigation Links */}
          <div className="header-col-left">
            <button
              onClick={() => setIsDrawerOpen(true)}
              aria-label="Open navigation menu"
              className="mobile-only header-hamburger-btn"
            >
              <span className="hamburger-bar" />
              <span className="hamburger-bar" />
              <span className="hamburger-bar" />
            </button>

            {/* Desktop Only: Nav Links */}
            <nav className="desktop-only desktop-nav-links">
              <Link href="/" className={`luxury-nav-link ${isHomeActive ? "active" : ""}`}>
                Home
              </Link>
              <Link href="/products" className={`luxury-nav-link ${isProductsActive ? "active" : ""}`}>
                Products
              </Link>
              <Link href="/products?category=Sarees" className={`luxury-nav-link ${isSareesActive ? "active" : ""}`}>
                Sarees
              </Link>
              <Link href="/products?category=Dresses" className={`luxury-nav-link ${isDressesActive ? "active" : ""}`}>
                Dresses
              </Link>
              <Link href="/products/styles" className="luxury-nav-link">
                Styles
              </Link>
              <Link href="/about" className={`luxury-nav-link ${isStoryActive ? "active" : ""}`}>
                Our Story
              </Link>
            </nav>
          </div>

          {/* Center: Brand Logo Wordmark */}
          <div className="header-col-center">
            <Link
              href="/"
              className="logo-hover-glow header-logo-link"
              aria-label="Avsaraa Home"
            >
              <AvsaraaLogo variant="wordmark" size={scrolled ? "sm" : "md"} className="header-brand-logo" />
            </Link>
          </div>

          {/* Right: Search, Wishlist, Cart Bag, Account */}
          <div className="header-col-right">
            {/* Search Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              aria-label="Search collection"
              className="header-icon-btn"
            >
              <SearchIcon size={20} color="#261B13" />
            </button>

            {/* Wishlist Icon */}
            <Link
              href="/wishlist"
              aria-label={`Saved pieces: ${totalWishlist}`}
              className="header-icon-btn"
              style={{ color: totalWishlist > 0 ? "#B83A4B" : "#261B13" }}
            >
              <HeartIcon size={20} color={totalWishlist > 0 ? "#B83A4B" : "#261B13"} />
              {totalWishlist > 0 && (
                <span className="header-wishlist-badge">
                  {totalWishlist}
                </span>
              )}
            </Link>

            {/* Shopping Bag Button with dark circular badge showing count */}
            <button
              type="button"
              onClick={openCart}
              aria-label={`Shopping Bag with ${totalItems} items`}
              className="header-icon-btn"
            >
              <ShoppingBagIcon size={20} color="#261B13" />
              <span className="header-cart-badge">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            </button>

            {/* Desktop Only: User Account / Sign In */}
            <div className="desktop-only" style={{ marginLeft: "4px" }}>
              {user ? (
                <Link
                  href="/account"
                  aria-label="My Account"
                  className="header-icon-btn"
                >
                  <UserIcon size={19} color="#261B13" />
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="header-signin-btn"
                >
                  Sign In
                </Link>
              )}
            </div>
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

export default function Header() {
  return (
    <Suspense fallback={<div style={{ height: "80px", backgroundColor: "#FAF7F2" }} />}>
      <HeaderInner />
    </Suspense>
  );
}

