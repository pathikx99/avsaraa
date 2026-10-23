"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { ShoppingBagIcon, HeartIcon, WhatsAppIcon } from "./Icons";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { totalItems, openCart } = useCart();
  const { totalWishlist } = useWishlist();

  const isHome = pathname === "/";
  const isCollection = pathname.startsWith("/collection");
  const isWishlist = pathname.startsWith("/wishlist");

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
        padding: "8px 12px calc(8px + env(safe-area-inset-bottom, 0px)) 12px",
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
      </Link>

      {/* 2. Collection */}
      <Link
        href="/collection"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
          color: isCollection ? "#261B13" : "#8E7D70",
          textDecoration: "none",
          flex: 1,
          padding: "4px 0",
          transition: "all 0.2s ease",
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke={isCollection ? "#261B13" : "currentColor"}
          strokeWidth={isCollection ? "2.2" : "1.7"}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
        </svg>
        <span
          style={{
            fontSize: "10px",
            fontWeight: isCollection ? 700 : 500,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Atelier
        </span>
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
          {totalWishlist > 0 && (
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
          color: totalItems > 0 ? "#261B13" : "#8E7D70",
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
            color={totalItems > 0 ? "#261B13" : "currentColor"}
          />
          {totalItems > 0 && (
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
            fontWeight: totalItems > 0 ? 700 : 500,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Bag
        </span>
      </button>

      {/* 5. Studio Concierge / WhatsApp Direct */}
      <a
        href="https://wa.me/919876543210?text=Hello%20Avsaraa%20Atelier,%20I%20am%20interested%20in%20a%20handcrafted%20drape"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
          color: "#25D366",
          textDecoration: "none",
          flex: 1,
          padding: "4px 0",
          transition: "all 0.2s ease",
        }}
      >
        <WhatsAppIcon size={20} color="#25D366" />
        <span
          style={{
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "#1B6B40",
          }}
        >
          Concierge
        </span>
      </a>
    </nav>
  );
}
