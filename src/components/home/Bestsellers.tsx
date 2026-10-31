"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Product } from "@/types/product";
import { normalizeProducts } from "@/lib/productUtils";
import { RevealSection } from "@/components/RevealSection";
import ProductCard from "./ProductCard";

export default function Bestsellers() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    // Fetch products ordered by sales_count or created_at
    supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(14)
      .then(
        ({ data, error }) => {
          if (!isMounted) return;
          if (error || !data) {
            setProducts([]);
          } else {
            const normalized = normalizeProducts(data);
            // Sort by sales_count descending
            normalized.sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0));
            setProducts(normalized.slice(0, 8));
          }
          setLoading(false);
        },
        () => {
          if (isMounted) {
            setProducts([]);
            setLoading(false);
          }
        }
      );

    return () => {
      isMounted = false;
    };
  }, []);

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = direction === "left" ? -340 : 340;
    scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  return (
    <section
      id="bestsellers"
      style={{
        backgroundColor: "#FAF7F2",
        padding: "85px 24px 95px 24px",
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
            marginBottom: "40px",
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
                  border: "1px solid rgba(196, 171, 148, 0.35)",
                }}
              >
                ✦ PATRON FAVOURITES ✦
              </span>
              <h2
                style={{
                  fontFamily: "var(--font-serif), Georgia, serif",
                  fontSize: "clamp(32px, 4.5vw, 48px)",
                  fontWeight: 500,
                  color: "#261B13",
                  lineHeight: 1.15,
                  marginBottom: "8px",
                }}
              >
                Our Bestsellers
              </h2>
              <p style={{ fontSize: "15px", color: "#6E5B4E", margin: 0, lineHeight: 1.6 }}>
                The most cherished weaves and silhouettes loved by our patrons across India.
              </p>
            </div>
          </RevealSection>

          {/* Carousel Arrow Controls & View All Link */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link
              href="/products?sort=bestsellers"
              style={{
                fontSize: "12.5px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#261B13",
                textDecoration: "underline",
                textUnderlineOffset: "4px",
              }}
            >
              View All Bestsellers →
            </Link>

            <div style={{ display: "flex", gap: "8px" }} className="desktop-only">
              <button
                type="button"
                onClick={() => handleScroll("left")}
                aria-label="Scroll bestsellers left"
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  border: "1px solid #CFBEAD",
                  backgroundColor: "#FFFFFF",
                  color: "#261B13",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => handleScroll("right")}
                aria-label="Scroll bestsellers right"
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  border: "1px solid #CFBEAD",
                  backgroundColor: "#FFFFFF",
                  color: "#261B13",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Swipeable Carousel Track */}
        {loading ? (
          <div
            className="product-carousel-track"
            style={{
              display: "grid",
              gridAutoFlow: "column",
              gridAutoColumns: "minmax(270px, 1fr)",
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
                  minWidth: "270px",
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
              gridAutoColumns: "minmax(270px, 1fr)",
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
                  minWidth: "270px",
                  maxWidth: "320px",
                }}
              >
                <ProductCard product={product} badge="BESTSELLER" />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
