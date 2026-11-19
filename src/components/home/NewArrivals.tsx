"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { useProductsCatalog } from "@/lib/useProductsCatalog";
import { RevealSection } from "@/components/RevealSection";
import ProductCard from "./ProductCard";

export default function NewArrivals() {
  const { products, loading } = useProductsCatalog({ sort: "newest", limit: 8 });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = direction === "left" ? -340 : 340;
    scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  return (
    <section
      id="new-arrivals"
      style={{
        backgroundColor: "#FAF7F2",
        padding: "85px 20px 95px 20px",
        position: "relative",
        borderBottom: "1px solid #E6DACF",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        {/* Section Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "20px",
            marginBottom: "36px",
          }}
        >
          <RevealSection>
            <div>
              <span
                className="luxury-badge"
                style={{
                  marginBottom: "12px",
                  backgroundColor: "rgba(196, 171, 148, 0.15)",
                  color: "#6E5B4E",
                  border: "1px solid rgba(197, 160, 89, 0.4)",
                }}
              >
                ✦ NEW ARRIVALS ✦
              </span>
              <h2
                style={{
                  fontFamily: "var(--font-serif), Georgia, serif",
                  fontSize: "clamp(30px, 4.5vw, 48px)",
                  fontWeight: 500,
                  color: "#261B13",
                  lineHeight: 1.15,
                  marginBottom: "8px",
                }}
              >
                New Arrivals
              </h2>
              <p style={{ fontSize: "14.5px", color: "#6E5B4E", margin: 0, lineHeight: 1.6 }}>
                Freshly finished on Surat and Varanasi handlooms for the 2026 festive season.
              </p>
            </div>
          </RevealSection>

          {/* Carousel Arrow Buttons & View All Link */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link
              href="/products?sort=newest"
              style={{
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#261B13",
                textDecoration: "underline",
                textUnderlineOffset: "4px",
                transition: "color 0.2s ease",
              }}
            >
              View All Arrivals →
            </Link>

            <div style={{ display: "flex", gap: "8px" }} className="desktop-only">
              <button
                type="button"
                onClick={() => handleScroll("left")}
                aria-label="Scroll products left"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  border: "1px solid rgba(197, 160, 89, 0.4)",
                  backgroundColor: "#FFFFFF",
                  color: "#261B13",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(38,27,19,0.06)",
                  transition: "all 0.2s ease",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => handleScroll("right")}
                aria-label="Scroll products right"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  border: "1px solid rgba(197, 160, 89, 0.4)",
                  backgroundColor: "#FFFFFF",
                  color: "#261B13",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(38,27,19,0.06)",
                  transition: "all 0.2s ease",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Swipeable Carousel on Mobile / Multi-column on Desktop */}
        {loading ? (
          <div
            className="product-carousel-track"
            style={{
              display: "grid",
              gridAutoFlow: "column",
              gridAutoColumns: "clamp(250px, 74vw, 300px)",
              gap: "20px",
              overflowX: "auto",
              paddingBottom: "16px",
              scrollbarWidth: "none",
            }}
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  minWidth: "260px",
                  maxWidth: "320px",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "1px solid #E8DED3",
                  height: "440px",
                }}
              >
                <div
                  style={{
                    height: "340px",
                    background: "linear-gradient(90deg, #F0E6DC 0%, #E6DACF 50%, #F0E6DC 100%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 2s infinite ease-in-out",
                  }}
                />
                <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ width: "70%", height: "14px", backgroundColor: "#E6DACF", borderRadius: "4px" }} />
                  <div style={{ width: "40%", height: "16px", backgroundColor: "#E6DACF", borderRadius: "4px" }} />
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div
            ref={scrollContainerRef}
            className="product-carousel-track"
            style={{
              display: "grid",
              gridAutoFlow: "column",
              gridAutoColumns: "clamp(250px, 74vw, 300px)",
              gap: "20px",
              overflowX: "auto",
              scrollSnapType: "x mandatory",
              paddingBottom: "16px",
              scrollbarWidth: "none",
            }}
          >
            {products.map((product) => (
              <div
                key={product.id}
                style={{
                  scrollSnapAlign: "start",
                  minWidth: "250px",
                  maxWidth: "320px",
                }}
              >
                <ProductCard product={product} badge="NEW ARRIVAL" />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
