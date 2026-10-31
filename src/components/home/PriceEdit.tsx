"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Product } from "@/types/product";
import { normalizeProducts } from "@/lib/productUtils";
import { RevealSection } from "@/components/RevealSection";
import ProductCard from "./ProductCard";

export default function PriceEdit() {
  const [budgetProducts, setBudgetProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    supabase
      .from("products")
      .select("*")
      .lte("price", 1299)
      .order("price", { ascending: false })
      .limit(4)
      .then(
        ({ data, error }) => {
          if (!isMounted) return;
          if (error || !data) {
            setBudgetProducts([]);
          } else {
            setBudgetProducts(normalizeProducts(data));
          }
          setLoading(false);
        },
        () => {
          if (isMounted) {
            setBudgetProducts([]);
            setLoading(false);
          }
        }
      );

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section
      id="price-edit"
      style={{
        backgroundColor: "#F3ECE2",
        padding: "85px 24px 95px 24px",
        position: "relative",
        borderBottom: "1px solid #E2D7CC",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        {/* Editorial Banner Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "36px",
            alignItems: "flex-end",
            marginBottom: "48px",
          }}
        >
          <RevealSection>
            <div>
              <span
                className="luxury-badge"
                style={{
                  marginBottom: "14px",
                  backgroundColor: "rgba(30, 94, 58, 0.1)",
                  color: "#1E5E3A",
                  border: "1px solid rgba(30, 94, 58, 0.3)",
                }}
              >
                ✦ CURATED VALUE EDIT ✦
              </span>
              <h2
                style={{
                  fontFamily: "var(--font-serif), Georgia, serif",
                  fontSize: "clamp(34px, 4.5vw, 52px)",
                  fontWeight: 500,
                  color: "#261B13",
                  lineHeight: 1.15,
                  marginBottom: "14px",
                }}
              >
                The ₹1,299 Edit
              </h2>
              <div
                style={{
                  width: "60px",
                  height: "2px",
                  backgroundColor: "#C4AB94",
                  marginBottom: "16px",
                }}
              />
              <p
                style={{
                  fontSize: "15.5px",
                  color: "#5C4A3E",
                  lineHeight: 1.7,
                  maxWidth: "540px",
                }}
              >
                Everyday elegance meets artisan finishing. Explore breathable cotton slub kurtas, handwoven Chanderi stoles, and versatile sets crafted for daily wear and festive occasions — all priced <strong style={{ color: "#261B13" }}>UP TO ₹1,299</strong>.
              </p>
            </div>
          </RevealSection>

          <RevealSection delay={100}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "flex-end",
                gap: "16px",
              }}
              className="price-edit-cta-box"
            >
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  padding: "16px 20px",
                  borderRadius: "12px",
                  border: "1px solid #E2D7CC",
                  boxShadow: "0 4px 16px rgba(38,27,19,0.04)",
                  width: "100%",
                  maxWidth: "420px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "18px" }}>✦</span>
                  <span style={{ fontSize: "12.5px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#261B13" }}>
                    Guaranteed Quality Standard
                  </span>
                </div>
                <p style={{ fontSize: "13px", color: "#6E5B4E", margin: 0, lineHeight: 1.5 }}>
                  100% skin-friendly fabrics, colorfast natural dyes, and tailored comfort guaranteed on every single piece.
                </p>
              </div>

              <Link
                href="/products?maxPrice=1299"
                className="luxury-button btn-shine"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  backgroundColor: "#261B13",
                  color: "#FAF7F2",
                  padding: "15px 34px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  boxShadow: "0 6px 20px rgba(38,27,19,0.18)",
                }}
              >
                <span>SHOP THE EDIT (UP TO ₹1,299)</span>
                <span>→</span>
              </Link>
            </div>
          </RevealSection>
        </div>

        {/* Product Cards Row */}
        {loading ? (
          <div className="price-edit-products-grid">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "1px solid #E8DED3",
                  height: "440px",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    height: "320px",
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
        ) : budgetProducts.length > 0 ? (
          <RevealSection>
            <div className="price-edit-products-grid">
              {budgetProducts.map((product) => (
                <ProductCard key={product.id} product={product} badge="UP TO ₹1,299" aspectRatio="portrait" />
              ))}
            </div>
          </RevealSection>
        ) : null}
      </div>
    </section>
  );
}
