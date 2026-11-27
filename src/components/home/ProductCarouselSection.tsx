"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { Product } from "@/types/product";
import { useProductsCatalog } from "@/lib/useProductsCatalog";
import { RevealSection } from "@/components/RevealSection";
import ProductCard from "./ProductCard";

interface ProductCarouselSectionProps {
  id: string;
  kicker: string;
  title: string;
  subtitle: string;
  viewAllHref: string;
  viewAllLabel: string;
  badgeText: string;
  sortMode: "newest" | "bestselling";
  initialProducts?: Product[];
}

export default function ProductCarouselSection({
  id,
  kicker,
  title,
  subtitle,
  viewAllHref,
  viewAllLabel,
  badgeText,
  sortMode,
  initialProducts,
}: ProductCarouselSectionProps) {
  const hasInitial = Boolean(initialProducts && initialProducts.length > 0);
  const { products: fetchedProducts, loading } = useProductsCatalog({
    sort: sortMode,
    limit: 8,
  });

  const products = hasInitial && loading ? initialProducts! : fetchedProducts.length > 0 ? fetchedProducts : (initialProducts || []);
  const showSkeleton = !hasInitial && loading;

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = direction === "left" ? -340 : 340;
    scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  const handleTrackScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) {
      setScrollProgress(0);
      return;
    }
    setScrollProgress(Math.min(100, Math.round((el.scrollLeft / maxScroll) * 100)));
  };

  return (
    <section
      id={id}
      className="home-carousel-section"
      style={{
        backgroundColor: "#FAF7F2",
        padding: "76px 20px 84px 20px",
        position: "relative",
        borderBottom: "1px solid #E6DACF",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        {/* Section Header */}
        <div
          className="carousel-section-header"
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "28px",
          }}
        >
          <RevealSection>
            <div>
              <span
                className="luxury-badge"
                style={{
                  marginBottom: "12px",
                  backgroundColor: "rgba(196, 171, 148, 0.15)",
                  color: "#5A4535",
                  border: "1px solid rgba(197, 160, 89, 0.4)",
                }}
              >
                {kicker}
              </span>
              <h2
                style={{
                  fontFamily: "var(--font-serif), Georgia, serif",
                  fontSize: "clamp(30px, 4.5vw, 46px)",
                  fontWeight: 500,
                  color: "#261B13",
                  lineHeight: 1.15,
                  marginBottom: "8px",
                }}
              >
                {title}
              </h2>
              <p style={{ fontSize: "14.5px", color: "#6A584B", margin: 0, lineHeight: 1.6 }}>
                {subtitle}
              </p>
            </div>
          </RevealSection>

          {/* Carousel Controls & View All Link */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link
              href={viewAllHref}
              style={{
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#261B13",
                textDecoration: "underline",
                textUnderlineOffset: "4px",
              }}
            >
              {viewAllLabel}
            </Link>

            <div style={{ display: "flex", gap: "8px" }} className="desktop-only">
              <button
                type="button"
                onClick={() => handleScroll("left")}
                aria-label={`Scroll ${title} left`}
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  border: "1px solid rgba(197, 160, 89, 0.4)",
                  backgroundColor: "#FFFFFF",
                  color: "#261B13",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(38,27,19,0.06)",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => handleScroll("right")}
                aria-label={`Scroll ${title} right`}
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  border: "1px solid rgba(197, 160, 89, 0.4)",
                  backgroundColor: "#FFFFFF",
                  color: "#261B13",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(38,27,19,0.06)",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Track */}
        {showSkeleton ? (
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
          <>
            <div
              ref={scrollContainerRef}
              onScroll={handleTrackScroll}
              className="product-carousel-track"
              style={{
                display: "grid",
                gridAutoFlow: "column",
                gridAutoColumns: "clamp(240px, 72vw, 295px)",
                gap: "18px",
                overflowX: "auto",
                scrollSnapType: "x mandatory",
                paddingBottom: "14px",
                scrollbarWidth: "none",
              }}
            >
              {products.map((product) => (
                <div
                  key={product.id}
                  style={{
                    scrollSnapAlign: "start",
                    minWidth: "240px",
                    maxWidth: "310px",
                  }}
                >
                  <ProductCard product={product} badge={badgeText} />
                </div>
              ))}
            </div>

            {/* Subtle Carousel Progress Bar */}
            <div
              aria-hidden="true"
              style={{
                width: "120px",
                height: "3px",
                backgroundColor: "#E6DACF",
                borderRadius: "2px",
                margin: "8px auto 0 auto",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.max(25, scrollProgress)}%`,
                  background: "linear-gradient(90deg, #C5A059, #261B13)",
                  borderRadius: "2px",
                  transition: "width 0.2s ease",
                }}
              />
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
