"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import AvsaraaLogo from "./AvsaraaLogo";
import NavigationDrawer from "./NavigationDrawer";
import { supabase } from "@/lib/supabaseClient";
import {
  UserIcon,
  ShoppingBagIcon,
  HeartIcon,
  SearchIcon,
  CloseIcon,
  BackArrowIcon,
} from "./Icons";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useScrolled } from "./RevealSection";
import { fetchCatalog } from "@/lib/useProductsCatalog";
import { formatINR, resolveProductImage } from "@/lib/productUtils";
import type { Product } from "@/types/product";
import type { User } from "@supabase/supabase-js";

const ANNOUNCEMENTS = [
  "FREE PAN-INDIA SHIPPING ON ORDERS ₹799+",
  "100% PURE HANDLOOM SILK & WEAVES",
  "COMPLIMENTARY FALL & PICO PRE-STITCHED",
  "HANDCRAFTED IN INDIA • INSURED PAN-INDIA DELIVERY",
];

const QUICK_SEARCH_TERMS = [
  "Banarasi Silk",
  "Organza",
  "Chanderi",
  "Sarees",
  "Dresses",
  "Everyday",
];

interface HeaderProps {
  showBackOnMobile?: boolean;
}

function HeaderInner({ showBackOnMobile = false }: HeaderProps) {
  const router = useRouter();
  const rawPathname = usePathname() || "/";
  const pathname = rawPathname === "/index" ? "/" : rawPathname;
  const searchParams = useSearchParams();
  const currentCategory = searchParams ? searchParams.get("category") : null;

  const { totalItems, openCart } = useCart();
  const { totalWishlist } = useWishlist();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchOpenPath, setSearchOpenPath] = useState<string | null>(null);
  const isSearchOpen = searchOpenPath === pathname;
  const setIsSearchOpen = (open: boolean) => setSearchOpenPath(open ? pathname : null);
  const [searchQuery, setSearchQuery] = useState("");
  const [catalogCache, setCatalogCache] = useState<Product[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const scrolled = useScrolled(35);

  const isHomeActive = pathname === "/" && !currentCategory;
  const isUnder1299Active =
    pathname === "/under-1299" ||
    searchParams.get("maxPrice") === "1299" ||
    currentCategory?.toLowerCase().includes("1299") ||
    currentCategory?.toLowerCase().includes("under");
  const isProductsActive =
    (pathname.startsWith("/products") || pathname.startsWith("/collection")) &&
    pathname === "/products" &&
    (!currentCategory || currentCategory === "ALL") &&
    !isUnder1299Active;
  const isSareesActive =
    (pathname.startsWith("/products") || pathname.startsWith("/collection")) &&
    currentCategory?.toLowerCase().includes("saree") &&
    !isUnder1299Active;
  const isDressesActive =
    (pathname.startsWith("/products") || pathname.startsWith("/collection")) &&
    currentCategory?.toLowerCase().includes("dress") &&
    !isUnder1299Active;
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
    if (!isSearchOpen) return;

    if (catalogCache.length === 0) {
      fetchCatalog()
        .then((prods) => setCatalogCache(prods || []))
        .catch(() => {});
    }

    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpenPath(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen, catalogCache.length]);

  const instantMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || catalogCache.length === 0) return [];
    return catalogCache
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.fabric?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      )
      .slice(0, 4);
  }, [searchQuery, catalogCache]);

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
          type="button"
          onClick={handlePrevAnnouncement}
          aria-label="Previous announcement"
          className="announcement-chevron-btn"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="announcement-text-slider" aria-live="polite">
          <span style={{ color: "#ECC880", marginRight: "6px", fontSize: "9px" }} aria-hidden="true">✦</span>
          <span>{ANNOUNCEMENTS[announcementIdx]}</span>
          <span style={{ color: "#ECC880", marginLeft: "6px", fontSize: "9px" }} aria-hidden="true">✦</span>
        </div>

        <button
          type="button"
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
          {/* Left: Mobile Back/Hamburger & Desktop Navigation Links */}
          <div className="header-col-left" style={{ gap: "4px" }}>
            {showBackOnMobile && (
              <button
                type="button"
                onClick={() => router.back()}
                aria-label="Go back"
                className="mobile-only header-icon-btn"
              >
                <BackArrowIcon size={19} color="#261B13" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              aria-label="Open navigation menu"
              className="mobile-only header-hamburger-btn"
            >
              <span className="hamburger-bar" />
              <span className="hamburger-bar" />
              <span className="hamburger-bar" />
            </button>

            {/* Desktop Only: Nav Links */}
            <nav className="desktop-only desktop-nav-links" aria-label="Primary Navigation">
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
              <Link href="/products?maxPrice=1299" className={`luxury-nav-link ${isUnder1299Active ? "active" : ""}`}>
                Under ₹1,299
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
              <AvsaraaLogo variant="wordmark" size={scrolled ? "sm" : "md"} className="header-brand-logo" priority />
            </Link>
          </div>

          {/* Right: Search, Wishlist, Cart Bag, Account */}
          <div className="header-col-right">
            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              aria-label={isSearchOpen ? "Close search" : "Search collection"}
              aria-expanded={isSearchOpen}
              className="header-icon-btn"
            >
              <SearchIcon size={20} color="#261B13" />
            </button>

            <Link
              href="/wishlist"
              aria-label={`Saved pieces: ${totalWishlist}`}
              className="header-icon-btn"
              style={{ color: totalWishlist > 0 ? "#8A181A" : "#261B13" }}
            >
              <HeartIcon size={20} color={totalWishlist > 0 ? "#8A181A" : "#261B13"} />
              {totalWishlist > 0 && (
                <span className="header-wishlist-badge">
                  {totalWishlist}
                </span>
              )}
            </Link>

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
                <Link href="/login" className="header-signin-btn">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* 4. Luxury Quick Search Slide-Down Bar with Instant Results */}
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
                id="header-search-input"
                name="search"
                aria-label="Search collection"
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
                  aria-label="Clear search query"
                  style={{ color: "#6A584B", padding: "4px" }}
                >
                  <CloseIcon size={14} color="#6A584B" />
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
                  color: "#6A584B",
                  padding: "4px",
                  cursor: "pointer",
                }}
              >
                <CloseIcon size={15} color="#6A584B" />
              </button>
            </form>

            {/* Instant Search Match Preview */}
            {instantMatches.length > 0 && (
              <div
                style={{
                  maxWidth: "720px",
                  margin: "12px auto 0 auto",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "10px",
                }}
              >
                {instantMatches.map((prod) => (
                  <Link
                    key={prod.id}
                    href={`/products/${prod.id}`}
                    onClick={() => setIsSearchOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "8px",
                      borderRadius: "12px",
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E6DACF",
                      textDecoration: "none",
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        width: "44px",
                        height: "54px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        flexShrink: 0,
                        backgroundColor: "#F2EBE3",
                      }}
                    >
                      <Image
                        src={resolveProductImage(prod.image_url)}
                        alt={prod.name}
                        fill
                        sizes="44px"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: "12.5px",
                          fontWeight: 600,
                          color: "#261B13",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {prod.name}
                      </div>
                      <div style={{ fontSize: "11px", color: "#6A584B" }}>
                        {prod.category} · <strong style={{ color: "#261B13" }}>{formatINR(prod.price)}</strong>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

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
              <span style={{ fontSize: "11px", color: "#6A584B", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Trending:
              </span>
              {QUICK_SEARCH_TERMS.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => handleQuickTagClick(term)}
                  style={{
                    fontSize: "11px",
                    color: "#543E2E",
                    backgroundColor: "#FAF7F2",
                    border: "1px solid #E6DACF",
                    borderRadius: "14px",
                    padding: "4px 10px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
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

export default function Header({ showBackOnMobile = false }: HeaderProps) {
  return (
    <Suspense fallback={<div style={{ height: "80px", backgroundColor: "#FAF7F2" }} />}>
      <HeaderInner showBackOnMobile={showBackOnMobile} />
    </Suspense>
  );
}
