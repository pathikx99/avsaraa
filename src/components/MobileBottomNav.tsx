"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { ShoppingBagIcon, HeartIcon, UserIcon } from "./Icons";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { totalItems, openCart } = useCart();
  const { totalWishlist } = useWishlist();
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
  const isProducts = pathname.startsWith("/products") || pathname.startsWith("/collection");
  const isWishlist = pathname.startsWith("/wishlist");
  const isProfile = pathname.startsWith("/account");
  const isAuth = pathname === "/login" || pathname === "/register";

  return (
    <nav
      className="mobile-only mobile-bottom-bar"
      aria-label="Mobile Navigation"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 90,
        backgroundColor: "rgba(250, 247, 242, 0.96)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(197, 160, 89, 0.35)",
        boxShadow: "0 -4px 20px rgba(38, 27, 19, 0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        padding: "8px 10px calc(8px + env(safe-area-inset-bottom, 0px)) 10px",
      }}
    >
      {/* 1. Home */}
      <Link
        href="/"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
          color: isHome ? "#261B13" : "#8E7D70",
          textDecoration: "none",
          flex: 1,
          padding: "4px 0",
          position: "relative",
          transition: "all 0.2s ease",
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill={isHome ? "#261B13" : "none"}
          stroke={isHome ? "#261B13" : "currentColor"}
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" fill="none" />
        </svg>
        <span
          style={{
            fontSize: "10px",
            fontWeight: isHome ? 700 : 500,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Home
        </span>
        {isHome && (
          <span
            style={{
              position: "absolute",
              bottom: "-2px",
              width: "4px",
              height: "4px",
              borderRadius: "50%",
              backgroundColor: "#C5A059",
            }}
          />
        )}
      </Link>

      {/* 2. Products */}
      <Link
        href="/products"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
          color: isProducts ? "#261B13" : "#8E7D70",
          textDecoration: "none",
          flex: 1,
          padding: "4px 0",
          position: "relative",
          transition: "all 0.2s ease",
        }}
      >
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
          <rect width="7" height="7" x="3" y="3" rx="1" />
          <rect width="7" height="7" x="14" y="3" rx="1" />
          <rect width="7" height="7" x="14" y="14" rx="1" />
          <rect width="7" height="7" x="3" y="14" rx="1" />
        </svg>
        <span
          style={{
            fontSize: "10px",
            fontWeight: isProducts ? 700 : 500,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Products
        </span>
        {isProducts && (
          <span
            style={{
              position: "absolute",
              bottom: "-2px",
              width: "4px",
              height: "4px",
              borderRadius: "50%",
              backgroundColor: "#C5A059",
            }}
          />
        )}
      </Link>

      {/* 3. Wishlist */}
      <Link
        href="/wishlist"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
          color: isWishlist ? "#B83A4B" : "#8E7D70",
          textDecoration: "none",
          flex: 1,
          padding: "4px 0",
          position: "relative",
          transition: "all 0.2s ease",
        }}
      >
        <div style={{ position: "relative" }}>
          <HeartIcon
            size={20}
            color={isWishlist ? "#B83A4B" : "currentColor"}
          />
          {mounted && totalWishlist > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-4px",
                right: "-8px",
                minWidth: "16px",
                height: "16px",
                padding: "0 3px",
                backgroundColor: "#B83A4B",
                color: "#FFFFFF",
                borderRadius: "10px",
                fontSize: "9px",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
              }}
            >
              {totalWishlist}
            </span>
          )}
        </div>
        <span
          style={{
            fontSize: "10px",
            fontWeight: isWishlist ? 700 : 500,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Saved
        </span>
        {isWishlist && (
          <span
            style={{
              position: "absolute",
              bottom: "-2px",
              width: "4px",
              height: "4px",
              borderRadius: "50%",
              backgroundColor: "#B83A4B",
            }}
          />
        )}
      </Link>

      {/* 4. Shopping Bag Drawer Trigger */}
      <button
        type="button"
        onClick={openCart}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
          color: mounted && totalItems > 0 ? "#261B13" : "#8E7D70",
          background: "none",
          border: "none",
          cursor: "pointer",
          flex: 1,
          padding: "4px 0",
          position: "relative",
          transition: "all 0.2s ease",
        }}
      >
        <div style={{ position: "relative" }}>
          <ShoppingBagIcon
            size={20}
            color={mounted && totalItems > 0 ? "#261B13" : "currentColor"}
          />
          {mounted && totalItems > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-4px",
                right: "-8px",
                minWidth: "16px",
                height: "16px",
                padding: "0 3px",
                backgroundColor: "#C5A059",
                color: "#1A120C",
                borderRadius: "10px",
                fontSize: "9px",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                lineHeight: 1,
                boxShadow: "0 2px 6px rgba(197, 160, 89, 0.4)",
              }}
            >
              {totalItems > 99 ? "99+" : totalItems}
            </span>
          )}
        </div>
        <span
          style={{
            fontSize: "10px",
            fontWeight: mounted && totalItems > 0 ? 700 : 500,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Bag
        </span>
      </button>

      {/* 5. Profile / Account */}
      {mounted && user ? (
        <Link
          href="/account"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            color: isProfile ? "#261B13" : "#8E7D70",
            textDecoration: "none",
            flex: 1,
            padding: "4px 0",
            position: "relative",
            transition: "all 0.2s ease",
          }}
        >
          <div style={{ position: "relative" }}>
            <UserIcon size={20} color={isProfile ? "#261B13" : "currentColor"} />
            <span
              style={{
                position: "absolute",
                top: "-2px",
                right: "-3px",
                width: "6px",
                height: "6px",
                backgroundColor: "#2E7D32",
                borderRadius: "50%",
                boxShadow: "0 0 4px rgba(46, 125, 50, 0.4)",
              }}
            />
          </div>
          <span
            style={{
              fontSize: "10px",
              fontWeight: isProfile ? 700 : 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Profile
          </span>
          {isProfile && (
            <span
              style={{
                position: "absolute",
                bottom: "-2px",
                width: "4px",
                height: "4px",
                borderRadius: "50%",
                backgroundColor: "#C5A059",
              }}
            />
          )}
        </Link>
      ) : (
        <Link
          href={pathname && pathname !== "/" && pathname !== "/login" ? `/login?redirect=${encodeURIComponent(pathname)}` : "/login"}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
            color: isAuth ? "#261B13" : "#8E7D70",
            textDecoration: "none",
            flex: 1,
            padding: "4px 0",
            position: "relative",
            transition: "all 0.2s ease",
          }}
        >
          <div style={{ position: "relative" }}>
            <UserIcon size={20} color={isAuth ? "#261B13" : "currentColor"} />
            <span
              style={{
                position: "absolute",
                top: "-3px",
                right: "-5px",
                width: "7px",
                height: "7px",
                backgroundColor: "#C5A059",
                borderRadius: "50%",
                boxShadow: "0 1px 3px rgba(197, 160, 89, 0.5)",
              }}
            />
          </div>
          <span
            style={{
              fontSize: "10px",
              fontWeight: isAuth ? 700 : 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Sign In
          </span>
          {isAuth && (
            <span
              style={{
                position: "absolute",
                bottom: "-2px",
                width: "4px",
                height: "4px",
                borderRadius: "50%",
                backgroundColor: "#C5A059",
              }}
            />
          )}
        </Link>
      )}
    </nav>
  );
}
