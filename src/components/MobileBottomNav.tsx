"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { ShoppingBagIcon, HeartIcon, UserIcon } from "./Icons";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

const emptySubscribe = () => () => {};

export default function MobileBottomNav() {
  const rawPathname = usePathname() || "/";
  const pathname = rawPathname === "/index" ? "/" : rawPathname;
  const { totalItems, openCart } = useCart();
  const { totalWishlist } = useWishlist();
  const [user, setUser] = useState<User | null>(null);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

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

  const isHome = pathname === "/";
  const isProducts = pathname.startsWith("/products") || pathname.startsWith("/collection") || pathname.startsWith("/shop");
  const isWishlist = pathname.startsWith("/wishlist");
  const isProfile = pathname.startsWith("/account");
  const isAuth = pathname === "/login" || pathname === "/register";

  // Hide mobile bottom navigation on dedicated checkout, order-success, admin, and PDPs
  // so conversion flows have complete focus without floating docks occluding buttons
  const isCheckout = pathname.startsWith("/checkout") || pathname.startsWith("/order-success");
  const isProductDetailPage = pathname.startsWith("/products/") && pathname !== "/products";
  if (isProductDetailPage || isCheckout || pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <nav
      className="mobile-only mobile-bottom-floating-dock"
      aria-label="Mobile Navigation"
      style={{
        position: "fixed",
        bottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
        left: "12px",
        right: "12px",
        margin: "0 auto",
        maxWidth: "min(440px, calc(100vw - 24px))",
        zIndex: 95,
        backgroundColor: "rgba(250, 247, 242, 0.92)",
        backdropFilter: "blur(28px) saturate(180%)",
        WebkitBackdropFilter: "blur(28px) saturate(180%)",
        border: "1px solid rgba(197, 160, 89, 0.45)",
        borderRadius: "32px",
        boxShadow: "0 16px 36px -4px rgba(38, 27, 19, 0.22), 0 0 0 1px rgba(255, 255, 255, 0.7) inset, 0 2px 10px rgba(197, 160, 89, 0.16)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        padding: "6px 8px",
        touchAction: "manipulation",
        transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease",
      }}
    >
      {/* 1. Home */}
      <Link
        href="/"
        className="mobile-dock-btn"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "3px",
          color: isHome ? "#261B13" : "#5A4535",
          textDecoration: "none",
          flex: 1,
          padding: "5px 2px",
          position: "relative",
          borderRadius: "20px",
          backgroundColor: isHome ? "rgba(197, 160, 89, 0.14)" : "transparent",
          transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill={isHome ? "#261B13" : "none"}
            stroke={isHome ? "#261B13" : "currentColor"}
            strokeWidth={isHome ? "2" : "1.7"}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" fill="none" />
          </svg>
        </div>
        <span
          style={{
            fontSize: "9.5px",
            fontWeight: isHome ? 700 : 500,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            lineHeight: 1.1,
          }}
        >
          Home
        </span>
        {isHome && (
          <span
            style={{
              position: "absolute",
              bottom: "1px",
              width: "3.5px",
              height: "3.5px",
              borderRadius: "50%",
              backgroundColor: "#C5A059",
              boxShadow: "0 0 5px rgba(197, 160, 89, 0.8)",
            }}
          />
        )}
      </Link>

      {/* 2. Products */}
      <Link
        href="/products"
        className="mobile-dock-btn"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "3px",
          color: isProducts ? "#261B13" : "#5A4535",
          textDecoration: "none",
          flex: 1,
          padding: "5px 2px",
          position: "relative",
          borderRadius: "20px",
          backgroundColor: isProducts ? "rgba(197, 160, 89, 0.14)" : "transparent",
          transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={isProducts ? "2.2" : "1.7"}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="7" height="7" x="3" y="3" rx="1.5" fill={isProducts ? "#261B13" : "none"} />
            <rect width="7" height="7" x="14" y="3" rx="1.5" fill={isProducts ? "#261B13" : "none"} />
            <rect width="7" height="7" x="14" y="14" rx="1.5" fill={isProducts ? "#261B13" : "none"} />
            <rect width="7" height="7" x="3" y="14" rx="1.5" fill={isProducts ? "#261B13" : "none"} />
          </svg>
        </div>
        <span
          style={{
            fontSize: "9.5px",
            fontWeight: isProducts ? 700 : 500,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            lineHeight: 1.1,
          }}
        >
          Catalog
        </span>
        {isProducts && (
          <span
            style={{
              position: "absolute",
              bottom: "1px",
              width: "3.5px",
              height: "3.5px",
              borderRadius: "50%",
              backgroundColor: "#C5A059",
              boxShadow: "0 0 5px rgba(197, 160, 89, 0.8)",
            }}
          />
        )}
      </Link>

      {/* 3. Wishlist */}
      <Link
        href="/wishlist"
        className="mobile-dock-btn"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "3px",
          color: isWishlist ? "#8A181A" : "#5A4535",
          textDecoration: "none",
          flex: 1,
          padding: "5px 2px",
          position: "relative",
          borderRadius: "20px",
          backgroundColor: isWishlist ? "rgba(138, 24, 26, 0.1)" : "transparent",
          transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <HeartIcon
            size={20}
            color={isWishlist ? "#8A181A" : "currentColor"}
            fill={isWishlist ? "#8A181A" : "none"}
          />
          {mounted && totalWishlist > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-4px",
                right: "-9px",
                minWidth: "16px",
                height: "16px",
                padding: "0 4px",
                backgroundColor: "#8A181A",
                color: "#FFFFFF",
                borderRadius: "10px",
                fontSize: "9px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
                border: "1.5px solid #FAF7F2",
                boxShadow: "0 2px 6px rgba(138, 24, 26, 0.4)",
              }}
            >
              {totalWishlist}
            </span>
          )}
        </div>
        <span
          style={{
            fontSize: "9.5px",
            fontWeight: isWishlist ? 700 : 500,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            lineHeight: 1.1,
          }}
        >
          Wishlist
        </span>
        {isWishlist && (
          <span
            style={{
              position: "absolute",
              bottom: "1px",
              width: "3.5px",
              height: "3.5px",
              borderRadius: "50%",
              backgroundColor: "#8A181A",
              boxShadow: "0 0 5px rgba(138, 24, 26, 0.8)",
            }}
          />
        )}
      </Link>

      {/* 4. Shopping Bag Drawer Trigger */}
      <button
        type="button"
        onClick={openCart}
        className="mobile-dock-btn"
        aria-label={`Shopping Bag (${mounted ? totalItems : 0} items)`}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "3px",
          color: mounted && totalItems > 0 ? "#261B13" : "#5A4535",
          background: "none",
          border: "none",
          cursor: "pointer",
          flex: 1,
          padding: "5px 2px",
          position: "relative",
          borderRadius: "20px",
          transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ShoppingBagIcon
            size={20}
            color={mounted && totalItems > 0 ? "#261B13" : "currentColor"}
          />
          {mounted && totalItems > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-4px",
                right: "-9px",
                minWidth: "16px",
                height: "16px",
                padding: "0 4px",
                background: "linear-gradient(135deg, #ECC880 0%, #C5A059 100%)",
                color: "#1A120C",
                borderRadius: "10px",
                fontSize: "9px",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
                border: "1.5px solid #FAF7F2",
                boxShadow: "0 2px 6px rgba(197, 160, 89, 0.5)",
              }}
            >
              {totalItems > 99 ? "99+" : totalItems}
            </span>
          )}
        </div>
        <span
          style={{
            fontSize: "9.5px",
            fontWeight: mounted && totalItems > 0 ? 700 : 500,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            lineHeight: 1.1,
          }}
        >
          Bag
        </span>
      </button>

      {/* 5. Profile / Account */}
      {mounted && user ? (
        <Link
          href="/account"
          className="mobile-dock-btn"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "3px",
            color: isProfile ? "#261B13" : "#5A4535",
            textDecoration: "none",
            flex: 1,
            padding: "5px 2px",
            position: "relative",
            borderRadius: "20px",
            backgroundColor: isProfile ? "rgba(197, 160, 89, 0.14)" : "transparent",
            transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <UserIcon size={20} color={isProfile ? "#261B13" : "currentColor"} />
            <span
              style={{
                position: "absolute",
                top: "-1px",
                right: "-2px",
                width: "6px",
                height: "6px",
                backgroundColor: "#2E7D32",
                borderRadius: "50%",
                border: "1px solid #FAF7F2",
                boxShadow: "0 0 4px rgba(46, 125, 50, 0.6)",
              }}
            />
          </div>
          <span
            style={{
              fontSize: "9.5px",
              fontWeight: isProfile ? 700 : 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              lineHeight: 1.1,
            }}
          >
            Profile
          </span>
          {isProfile && (
            <span
              style={{
                position: "absolute",
                bottom: "1px",
                width: "3.5px",
                height: "3.5px",
                borderRadius: "50%",
                backgroundColor: "#C5A059",
                boxShadow: "0 0 5px rgba(197, 160, 89, 0.8)",
              }}
            />
          )}
        </Link>
      ) : (
        <Link
          href={pathname && pathname !== "/" && pathname !== "/login" ? `/login?redirect=${encodeURIComponent(pathname)}` : "/login"}
          className="mobile-dock-btn"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "3px",
            color: isAuth ? "#261B13" : "#5A4535",
            textDecoration: "none",
            flex: 1,
            padding: "5px 2px",
            position: "relative",
            borderRadius: "20px",
            backgroundColor: isAuth ? "rgba(197, 160, 89, 0.14)" : "transparent",
            transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <UserIcon size={20} color={isAuth ? "#261B13" : "currentColor"} />
            <span
              style={{
                position: "absolute",
                top: "-2px",
                right: "-3px",
                width: "6px",
                height: "6px",
                backgroundColor: "#C5A059",
                borderRadius: "50%",
                border: "1px solid #FAF7F2",
                boxShadow: "0 1px 3px rgba(197, 160, 89, 0.6)",
              }}
            />
          </div>
          <span
            style={{
              fontSize: "9.5px",
              fontWeight: isAuth ? 700 : 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              lineHeight: 1.1,
            }}
          >
            Sign In
          </span>
          {isAuth && (
            <span
              style={{
                position: "absolute",
                bottom: "1px",
                width: "3.5px",
                height: "3.5px",
                borderRadius: "50%",
                backgroundColor: "#C5A059",
                boxShadow: "0 0 5px rgba(197, 160, 89, 0.8)",
              }}
            />
          )}
        </Link>
      )}
    </nav>
  );
}
