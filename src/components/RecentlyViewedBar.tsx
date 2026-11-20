"use client";

import React, { useState, useMemo, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatINR } from "@/lib/productUtils";

export interface RecentlyViewedItem {
  id: string;
  name: string;
  price: number;
  mrp?: number;
  image_url: string;
  category: string;
  fabric?: string;
  viewed_at: number;
}

const STORAGE_KEY = "avsaraa_recently_viewed";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("avsaraa:recently-viewed-updated", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("avsaraa:recently-viewed-updated", callback);
  };
}

function getSnapshot(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function getServerSnapshot(): string {
  return "";
}

export default function RecentlyViewedBar() {
  const pathname = usePathname();
  const rawItems = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [isOpen, setIsOpen] = useState(false);

  const items = useMemo<RecentlyViewedItem[]>(() => {
    if (!rawItems) return [];
    try {
      const parsed = JSON.parse(rawItems);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [rawItems]);

  const clearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      localStorage.removeItem(STORAGE_KEY);
      setIsOpen(false);
      window.dispatchEvent(new Event("avsaraa:recently-viewed-updated"));
    } catch {
      // LocalStorage access failsafe
    }
  };

  // Hide on admin and checkout conversion funnels
  const isExcluded =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/order-success");

  if (isExcluded || items.length === 0) {
    return null;
  }

  // Avoid showing current PDP drape as the only drape in the bar
  const displayItems = items.slice(0, 6);

  return (
    <aside
      className="recently-viewed-floating-bar"
      aria-label="Recently Viewed Drapes"
      style={{
        position: "fixed",
        right: "18px",
        bottom: "calc(18px + env(safe-area-inset-bottom, 0px))",
        zIndex: 140,
        fontFamily: "var(--font-sans), system-ui, sans-serif",
      }}
    >
      {!isOpen ? (
        /* Collapsed Floating Pill */
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-expanded={false}
          aria-label={`Open recently viewed drapes (${displayItems.length} items)`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            backgroundColor: "#261B13",
            color: "#FAF7F2",
            border: "1px solid #866951",
            borderRadius: "30px",
            padding: "8px 16px 8px 10px",
            boxShadow: "0 8px 24px rgba(38, 27, 19, 0.25)",
            cursor: "pointer",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {/* Micro image avatars preview */}
          <div style={{ display: "flex", alignItems: "center", marginRight: "2px" }}>
            {displayItems.slice(0, 3).map((item, idx) => (
              <div
                key={item.id}
                style={{
                  position: "relative",
                  width: "26px",
                  height: "26px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "2px solid #261B13",
                  marginLeft: idx === 0 ? "0" : "-10px",
                  backgroundColor: "#FAF7F2",
                  flexShrink: 0,
                }}
              >
                <Image
                  src={item.image_url}
                  alt={item.name}
                  fill
                  sizes="26px"
                  style={{ objectFit: "cover" }}
                />
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "14px" }}>👁️</span>
            <span style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
              Recently Viewed ({displayItems.length})
            </span>
          </div>
        </button>
      ) : (
        /* Expanded Floating Card / Drawer */
        <div
          style={{
            width: "360px",
            maxWidth: "calc(100vw - 36px)",
            backgroundColor: "#FAF7F2",
            borderRadius: "16px",
            border: "1px solid #E6DACF",
            boxShadow: "0 12px 36px rgba(38, 27, 19, 0.25)",
            overflow: "hidden",
            animation: "slideUpFade 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "#261B13",
              color: "#FAF7F2",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "14px" }}>👁️</span>
              <span
                style={{
                  fontFamily: "var(--font-serif), Georgia, serif",
                  fontSize: "15px",
                  fontWeight: 600,
                  letterSpacing: "0.03em",
                }}
              >
                Recently Viewed Drapes ({displayItems.length})
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                type="button"
                onClick={clearHistory}
                style={{
                  background: "none",
                  border: "none",
                  color: "#D8CABE",
                  fontSize: "10.5px",
                  textDecoration: "underline",
                  cursor: "pointer",
                  padding: "2px 4px",
                }}
                title="Clear browsing history"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close recently viewed drawer"
                style={{
                  background: "none",
                  border: "none",
                  color: "#FAF7F2",
                  fontSize: "16px",
                  cursor: "pointer",
                  lineHeight: 1,
                  padding: "2px 6px",
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* List of items */}
          <div
            className="no-scrollbar"
            style={{
              maxHeight: "360px",
              overflowY: "auto",
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {displayItems.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "10px",
                  border: "1px solid #E8DED3",
                  padding: "8px 10px",
                  transition: "background-color 0.15s ease",
                }}
              >
                {/* Thumbnail */}
                <Link
                  href={`/products/${item.id}`}
                  onClick={() => setIsOpen(false)}
                  style={{
                    position: "relative",
                    width: "48px",
                    height: "64px",
                    borderRadius: "6px",
                    overflow: "hidden",
                    flexShrink: 0,
                    backgroundColor: "#FAF7F2",
                    display: "block",
                  }}
                >
                  <Image
                    src={item.image_url}
                    alt={item.name}
                    fill
                    sizes="48px"
                    style={{ objectFit: "cover" }}
                  />
                </Link>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: "10px", color: "#866951", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                    {item.category}
                  </span>
                  <Link
                    href={`/products/${item.id}`}
                    onClick={() => setIsOpen(false)}
                    style={{
                      display: "block",
                      fontSize: "12.5px",
                      fontWeight: 600,
                      color: "#261B13",
                      textDecoration: "none",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      marginTop: "1px",
                      marginBottom: "3px",
                    }}
                  >
                    {item.name}
                  </Link>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                    <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#261B13" }}>
                      {formatINR(item.price)}
                    </span>
                    {item.mrp && item.mrp > item.price && (
                      <span style={{ fontSize: "11px", color: "#8E7D70", textDecoration: "line-through" }}>
                        {formatINR(item.mrp)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Link */}
                <Link
                  href={`/products/${item.id}`}
                  onClick={() => setIsOpen(false)}
                  style={{
                    padding: "6px 10px",
                    backgroundColor: "#FAF7F2",
                    border: "1px solid #D8CABE",
                    borderRadius: "6px",
                    color: "#261B13",
                    fontSize: "11px",
                    fontWeight: 600,
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  View Drape
                </Link>
              </div>
            ))}
          </div>

          {/* Footer bar */}
          <div
            style={{
              padding: "8px 14px",
              backgroundColor: "#F4EDE4",
              borderTop: "1px solid #E6DACF",
              textAlign: "center",
            }}
          >
            <Link
              href="/products"
              onClick={() => setIsOpen(false)}
              style={{
                fontSize: "11.5px",
                color: "#866951",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Explore Full Atelier Catalog →
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
}
