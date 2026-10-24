"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import AvsaraaLogo from "./AvsaraaLogo";
import { UserIcon, ShoppingBagIcon, HeartIcon } from "./Icons";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import type { User } from "@supabase/supabase-js";

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  onLogout?: () => void;
}

export default function NavigationDrawer({
  isOpen,
  onClose,
  user,
  onLogout,
}: NavigationDrawerProps) {
  const { totalItems, openCart } = useCart();
  const { totalWishlist } = useWishlist();
  if (!isOpen) return null;


  const categories = [
    { label: "HOME", subtitle: "Bespoke Sanctuary & Highlights", href: "/" },
    { label: "ALL PIECES", subtitle: "Full Atelier Catalog", href: "/collection" },
    { label: "SAREES", subtitle: "Banarasi & Organza Weaves", href: "/collection?category=Sarees" },
    { label: "DRESSES", subtitle: "Anarkalis & Chanderi Sets", href: "/collection?category=Dresses" },
    { label: "NEW ARRIVALS", subtitle: "Festive 2026 Edition", href: "/collection?category=New%20Arrivals" },
    { label: "OCCASION WEAR", subtitle: "Bridal Zari & Heavy Drapes", href: "/collection?category=Occasion%20Wear" },
  ];

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
          backgroundColor: "rgba(26, 18, 12, 0.55)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          animation: "fadeIn 0.25s ease both",
        }}
      />

      {/* Drawer Panel */}
      <div
        style={{
          position: "relative",
          width: "350px",
          maxWidth: "86vw",
          height: "100%",
          backgroundColor: "#FAF7F2",
          borderRight: "1px solid rgba(197, 160, 89, 0.35)",
          display: "flex",
          flexDirection: "column",
          padding: "24px 22px 32px 22px",
          boxShadow: "14px 0 40px rgba(26, 18, 12, 0.25)",
          animation: "slideInLeft 0.35s cubic-bezier(0.16, 1, 0.3, 1) both",
          overflowY: "auto",
        }}
      >
        {/* Botanical watercolor art in bottom right */}
        <div
          style={{
            position: "absolute",
            right: "-20px",
            bottom: "-10px",
            width: "220px",
            height: "220px",
            pointerEvents: "none",
            opacity: 0.5,
            zIndex: 0,
          }}
        >
          <Image
            src="/images/botanical_flowers.jpg"
            alt=""
            fill
            sizes="220px"
            style={{ objectFit: "contain", transform: "rotate(-15deg)", mixBlendMode: "multiply" }}
          />
        </div>

        {/* Top Header: Logo + Close Button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: "18px",
            borderBottom: "1px solid #EAE0D5",
            marginBottom: "20px",
            position: "relative",
            zIndex: 1,
          }}
        >
          <AvsaraaLogo size="md" width={135} />
          <button
            onClick={onClose}
            aria-label="Close menu"
            style={{
              padding: "8px",
              color: "#261B13",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              background: "#F2EBE3",
              borderRadius: "50%",
              border: "1px solid #E2D7CC",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Gilded Small Badge */}
        <div style={{ marginBottom: "16px", position: "relative", zIndex: 1 }}>
          <span
            className="luxury-badge"
            style={{
              fontSize: "9.5px",
              padding: "3px 10px",
              backgroundColor: "rgba(197, 160, 89, 0.12)",
              color: "#866951",
              border: "1px solid rgba(197, 160, 89, 0.35)",
            }}
          >
            ✦ ATELIER COLLECTIONS ✦
          </span>
        </div>

        {/* 1. PRODUCT CATEGORIES */}
        <nav style={{ display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
          {categories.map((cat) => (
            <Link
              key={cat.label}
              href={cat.href}
              onClick={onClose}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 8px",
                borderBottom: "1px solid #EFE6DC",
                borderRadius: "8px",
                transition: "background-color 0.2s ease",
              }}
            >
              <div>
                <span
                  style={{
                    display: "block",
                    fontSize: "13.5px",
                    fontFamily: "var(--font-serif), Georgia, serif",
                    letterSpacing: "0.12em",
                    color: "#261B13",
                    fontWeight: 600,
                  }}
                >
                  {cat.label}
                </span>
                <span style={{ fontSize: "11px", color: "#8E7D70" }}>
                  {cat.subtitle}
                </span>
              </div>
              <span style={{ color: "#C5A059", fontSize: "16px", fontWeight: 700 }}>›</span>
            </Link>
          ))}
        </nav>

        {/* 2. USER ACTIONS: My Account, Wishlist, Bag */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "16px",
            paddingTop: "8px",
            borderTop: "1px solid #EAE0D5",
            position: "relative",
            zIndex: 1,
          }}
        >
          {user && (
            <Link
              href="/account"
              onClick={onClose}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 8px",
                fontSize: "13.5px",
                color: "#261B13",
                fontWeight: 500,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <UserIcon size={17} color="#866951" />
                <span>My Account</span>
              </div>
              <span style={{ color: "#AC9885", fontSize: "14px" }}>›</span>
            </Link>
          )}

          <Link
            href="/wishlist"
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 8px",
              fontSize: "13.5px",
              color: "#261B13",
              fontWeight: 500,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <HeartIcon size={17} color={totalWishlist > 0 ? "#B83A4B" : "#866951"} />
              <span>Saved Heirlooms</span>
            </div>
            {totalWishlist > 0 ? (
              <span
                style={{
                  backgroundColor: "#B83A4B",
                  color: "#FAF7F2",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "10px",
                }}
              >
                {totalWishlist}
              </span>
            ) : (
              <span style={{ color: "#AC9885", fontSize: "14px" }}>›</span>
            )}
          </Link>


          <button
            type="button"
            onClick={() => {
              onClose();
              openCart();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 8px",
              fontSize: "13.5px",
              color: "#261B13",
              fontWeight: 500,
              background: "none",
              cursor: "pointer",
              width: "100%",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <ShoppingBagIcon size={17} color="#866951" />
              <span>Shopping Bag ({totalItems})</span>
            </div>
            <span
              style={{
                backgroundColor: totalItems > 0 ? "#C5A059" : "#E2D7CC",
                color: totalItems > 0 ? "#1A120C" : "#543E2E",
                fontSize: "11px",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "10px",
              }}
            >
              {totalItems}
            </span>
          </button>
        </div>

        {/* 3. ATELIER & CONTACT PAGES */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "16px",
            paddingTop: "14px",
            borderTop: "1px solid #EAE0D5",
            position: "relative",
            zIndex: 1,
          }}
        >
          <Link
            href="/about"
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px 12px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E2D7CC",
              borderRadius: "12px",
              textAlign: "center",
              fontSize: "12.5px",
              fontWeight: 600,
              color: "#261B13",
              textDecoration: "none",
            }}
          >
            Our Story
          </Link>
          <Link
            href="/contact"
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px 12px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E2D7CC",
              borderRadius: "12px",
              textAlign: "center",
              fontSize: "12.5px",
              fontWeight: 600,
              color: "#261B13",
              textDecoration: "none",
            }}
          >
            Contact
          </Link>
        </div>

        {/* 4. AUTH STATUS / BUTTONS */}
        <div style={{ marginTop: "24px", position: "relative", zIndex: 1 }}>
          {user ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div
                style={{
                  padding: "12px 14px",
                  backgroundColor: "#F2EBE3",
                  borderRadius: "12px",
                  border: "1px solid #E2D7CC",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <UserIcon size={16} color="#866951" />
                <div style={{ overflow: "hidden" }}>
                  <span style={{ display: "block", fontSize: "10px", color: "#866951", textTransform: "uppercase", fontWeight: 600 }}>
                    Signed in
                  </span>
                  <span style={{ display: "block", fontSize: "12.5px", color: "#261B13", fontWeight: 500, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                    {user.email}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  onClose();
                  onLogout?.();
                }}
                style={{
                  height: "38px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#866951",
                  border: "1px solid #CFBEAD",
                  backgroundColor: "#FAF7F2",
                  borderRadius: "12px",
                  cursor: "pointer",
                }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: "10px" }}>
              <Link
                href="/login"
                onClick={onClose}
                className="avsaraa-btn-primary"
                style={{
                  flex: 1,
                  height: "42px",
                  fontSize: "12px",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  borderRadius: "21px",
                }}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={onClose}
                className="avsaraa-btn-outline"
                style={{
                  flex: 1,
                  height: "42px",
                  fontSize: "12px",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "21px",
                }}
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* 5. ATELIER CONCIERGE CALLOUT */}
        <div style={{ marginTop: "auto", paddingTop: "24px", position: "relative", zIndex: 1 }}>
          <Link
            href="/contact"
            onClick={onClose}
            className="btn-shine"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "12px",
              borderRadius: "14px",
              backgroundColor: "#261B13",
              color: "#FAF7F2",
              fontSize: "12.5px",
              fontWeight: 600,
              letterSpacing: "0.04em",
              textDecoration: "none",
              border: "1px solid rgba(197, 160, 89, 0.4)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            }}
          >
            <span>Contact Studio Concierge</span>
            <span>→</span>
          </Link>
          <p style={{ marginTop: "10px", textAlign: "center", fontSize: "11px", color: "#8E7D70" }}>
            Surat Handloom Studio • Pan-India Free Delivery
          </p>
        </div>
      </div>
    </div>
  );
}
