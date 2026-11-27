"use client";

import React, { useState, useMemo, useRef, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatINR, resolveProductImage } from "@/lib/productUtils";
import { EyeIcon, CloseIcon } from "./Icons";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";

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

function useRecentlyViewedItems() {
  const rawItems = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const items = useMemo<RecentlyViewedItem[]>(() => {
    if (!rawItems) return [];
    try {
      const parsed = JSON.parse(rawItems);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [rawItems]);

  const clearHistory = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new Event("avsaraa:recently-viewed-updated"));
    } catch {
      // LocalStorage access failsafe
    }
  };

  return { items, clearHistory };
}

/**
 * Inline horizontal shelf for recently viewed pieces on mobile & desktop pages
 * without colliding with fixed bottom navigation bars.
 */
export function RecentlyViewedShelf({ excludeProductId }: { excludeProductId?: string }) {
  const { items, clearHistory } = useRecentlyViewedItems();

  const displayItems = useMemo(() => {
    const filtered = excludeProductId ? items.filter((item) => item.id !== excludeProductId) : items;
    return filtered.slice(0, 6);
  }, [items, excludeProductId]);

  if (displayItems.length === 0) return null;

  return (
    <section
      aria-label="Recently Viewed Pieces"
      style={{
        backgroundColor: "#FAF7F2",
        padding: "48px 20px",
        borderTop: "1px solid #E6DACF",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <EyeIcon size={18} color="#866951" />
            <h2
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "clamp(22px, 3vw, 28px)",
                fontWeight: 500,
                color: "#261B13",
                margin: 0,
              }}
            >
              Recently Viewed
            </h2>
          </div>

          <button
            type="button"
            onClick={clearHistory}
            style={{
              fontSize: "12px",
              color: "#6A584B",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
              cursor: "pointer",
            }}
          >
            Clear History
          </button>
        </div>

        <div className="recently-viewed-shelf-track">
          {displayItems.map((item) => (
            <Link
              key={item.id}
              href={`/products/${item.id}`}
              className="luxury-hover-card"
              style={{
                scrollSnapAlign: "start",
                backgroundColor: "#FFFFFF",
                borderRadius: "14px",
                border: "1px solid #E6DACF",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                textDecoration: "none",
              }}
            >
              <div style={{ position: "relative", width: "100%", aspectRatio: "3 / 4", backgroundColor: "#F2EBE3" }}>
                <Image
                  src={resolveProductImage(item.image_url)}
                  alt={item.name}
                  fill
                  sizes="240px"
                  style={{ objectFit: "cover", objectPosition: "center 20%" }}
                />
              </div>
              <div style={{ padding: "12px" }}>
                <span style={{ fontSize: "10px", fontWeight: 600, color: "#866951", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {item.category}
                </span>
                <div
                  style={{
                    fontFamily: "var(--font-serif), Georgia, serif",
                    fontSize: "14.5px",
                    fontWeight: 600,
                    color: "#261B13",
                    marginTop: "2px",
                    marginBottom: "4px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.name}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                  <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#261B13" }}>
                    {formatINR(item.price)}
                  </span>
                  {item.mrp && item.mrp > item.price && (
                    <span style={{ fontSize: "11px", color: "#6A584B", textDecoration: "line-through" }}>
                      {formatINR(item.mrp)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Desktop-only floating quick-access pill so mobile bottom navigation and sticky
 * purchase bars remain completely unobstructed.
 */
export default function RecentlyViewedBar() {
  const pathname = usePathname();
  const { items, clearHistory } = useRecentlyViewedItems();
  const [isOpen, setIsOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useAccessibleDialog(isOpen, () => setIsOpen(false), drawerRef);

  const isExcluded =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/order-success") ||
    pathname.startsWith("/contact") ||
    pathname.startsWith("/b2b");

  if (isExcluded || items.length === 0) {
    return null;
  }

  const displayItems = items.slice(0, 6);

  return (
    <aside
      className="desktop-only recently-viewed-floating-bar"
      aria-label="Recently Viewed Drapes"
      style={{
        position: "fixed",
        left: "18px",
        bottom: "18px",
        zIndex: 140,
        fontFamily: "var(--font-sans), system-ui, sans-serif",
      }}
    >
      {!isOpen ? (
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
            border: "1px solid rgba(197, 160, 89, 0.55)",
            borderRadius: "30px",
            padding: "8px 16px 8px 10px",
            boxShadow: "0 8px 24px rgba(38, 27, 19, 0.25)",
            cursor: "pointer",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
          }}
        >
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
                  src={resolveProductImage(item.image_url)}
                  alt={item.name}
                  fill
                  sizes="26px"
                  style={{ objectFit: "cover" }}
                />
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <EyeIcon size={14} color="#ECC880" />
            <span style={{ fontSize: "12px", fontWeight: 600, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
              Recently Viewed ({displayItems.length})
            </span>
          </div>
        </button>
      ) : (
        <div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Recently Viewed Drapes"
          style={{
            width: "360px",
            maxWidth: "calc(100vw - 36px)",
            backgroundColor: "#FAF7F2",
            borderRadius: "16px",
            border: "1px solid #E6DACF",
            boxShadow: "0 12px 36px rgba(38, 27, 19, 0.25)",
            overflow: "hidden",
            animation: "fadeInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
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
              <EyeIcon size={15} color="#ECC880" />
              <span
                style={{
                  fontFamily: "var(--font-serif), Georgia, serif",
                  fontSize: "15px",
                  fontWeight: 600,
                  letterSpacing: "0.03em",
                }}
              >
                Recently Viewed ({displayItems.length})
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                type="button"
                onClick={() => {
                  clearHistory();
                  setIsOpen(false);
                }}
                style={{
                  color: "#D8CABE",
                  fontSize: "11px",
                  textDecoration: "underline",
                  padding: "2px 4px",
                }}
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close recently viewed drawer"
                style={{
                  color: "#FAF7F2",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <CloseIcon size={15} color="#FAF7F2" />
              </button>
            </div>
          </div>

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
                }}
              >
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
                    src={resolveProductImage(item.image_url)}
                    alt={item.name}
                    fill
                    sizes="48px"
                    style={{ objectFit: "cover" }}
                  />
                </Link>

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
                      <span style={{ fontSize: "11px", color: "#6A584B", textDecoration: "line-through" }}>
                        {formatINR(item.mrp)}
                      </span>
                    )}
                  </div>
                </div>

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
                  View
                </Link>
              </div>
            ))}
          </div>

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
              Explore Full Catalog →
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
}
