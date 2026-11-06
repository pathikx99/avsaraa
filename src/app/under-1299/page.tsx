"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/home/ProductCard";
import ShoppingBenefits from "@/components/home/ShoppingBenefits";
import { supabase } from "@/lib/supabaseClient";
import { Product } from "@/types/product";
import { normalizeProducts } from "@/lib/productUtils";

const CURATED_1299_FALLBACKS: Product[] = [
  {
    id: "edit-1299-1",
    name: "Indigo Floral Handblock Printed Suit Set",
    category: "Dresses",
    price: 1299,
    image_url: "/images/product_suit_under1299.jpg",
    description: "Breathable pure cotton slub kurta with matching palazzo and handblock floral motifs.",
    color_variants: [
      { name: "Indigo Blue", hex: "#2C4364" },
      { name: "Slate Teal", hex: "#426B69" },
    ],
    sales_count: 85,
    occasion_tags: ["Everyday Essentials", "Festive Edit"],
  },
  {
    id: "edit-1299-2",
    name: "Sage Minimalist Linen Everyday Kurta",
    category: "Dresses",
    price: 1250,
    image_url: "/images/product_kurta_under1299.jpg",
    description: "Lightweight summer linen with dual-tone contrast hem and wooden coconut shell buttons.",
    color_variants: [
      { name: "Sage Green", hex: "#8A9A86" },
      { name: "Natural Ivory", hex: "#EAE3D2" },
    ],
    sales_count: 64,
    occasion_tags: ["Everyday Essentials"],
  },
  {
    id: "edit-1299-3",
    name: "Mustard Gold Slub Daily Kurti",
    category: "Dresses",
    price: 999,
    image_url: "/images/product_kurti_under1299.jpg",
    description: "Soft washed cotton slub with subtle zari neckline detail, ideal for college or workwear.",
    color_variants: [
      { name: "Mustard Gold", hex: "#D49B35" },
      { name: "Dusty Terracotta", hex: "#B85D43" },
    ],
    sales_count: 92,
    occasion_tags: ["Everyday Essentials"],
  },
  {
    id: "edit-1299-4",
    name: "Handwoven Chanderi Zari Stole",
    category: "Sarees",
    price: 899,
    image_url: "/images/product_dupatta_under1299.jpg",
    description: "Gossamer sheer Chanderi weave with hand-twisted tassels and delicate woven zari borders.",
    color_variants: [
      { name: "Pristine Gold", hex: "#D6AF5F" },
      { name: "Blush Pink", hex: "#D99B9B" },
    ],
    sales_count: 73,
    occasion_tags: ["Everyday Essentials", "Festive Edit"],
  },
];

type SubFilter = "ALL" | "KURTAS" | "SETS" | "STOLES";

export default function Under1299Page() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<SubFilter>("ALL");
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "newest">("featured");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let isMounted = true;

    supabase
      .from("products")
      .select("*")
      .lte("price", 1299)
      .order("price", { ascending: false })
      .then(
        ({ data, error }) => {
          if (!isMounted) return;
          if (error || !data || data.length === 0) {
            setProducts(CURATED_1299_FALLBACKS);
          } else {
            const normalized = normalizeProducts(data);
            // If less than 4 items, supplement with curated fallbacks
            if (normalized.length < 4) {
              const ids = new Set(normalized.map((p) => p.id));
              const missing = CURATED_1299_FALLBACKS.filter((f) => !ids.has(f.id));
              setProducts([...normalized, ...missing]);
            } else {
              setProducts(normalized);
            }
          }
          setLoading(false);
        },
        () => {
          if (isMounted) {
            setProducts(CURATED_1299_FALLBACKS);
            setLoading(false);
          }
        }
      );

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Subcategory Filter
    if (activeFilter === "KURTAS") {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes("kurta") ||
          p.name.toLowerCase().includes("kurti") ||
          p.product_type === "top"
      );
    } else if (activeFilter === "SETS") {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes("set") ||
          p.name.toLowerCase().includes("suit") ||
          p.product_type === "set"
      );
    } else if (activeFilter === "STOLES") {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes("stole") ||
          p.name.toLowerCase().includes("dupatta") ||
          p.category === "Sarees"
      );
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "newest") {
      result.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
    } else {
      // featured: by sales_count or default
      result.sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0));
    }

    return result;
  }, [products, activeFilter, searchQuery, sortBy]);

  return (
    <div className="page-enter" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#FAF7F2" }}>
      <Header />

      <main style={{ flex: 1 }}>
        {/* Dedicated Atelier Hero Header for The ₹1,299 Edit */}
        <section
          style={{
            backgroundColor: "#261B13",
            color: "#FAF7F2",
            padding: "54px 24px 48px 24px",
            textAlign: "center",
            position: "relative",
            borderBottom: "1px solid #3E2D22",
            overflow: "hidden",
          }}
        >
          {/* Subtle Ambient Gold Glow */}
          <div
            style={{
              position: "absolute",
              top: "-40%",
              left: "50%",
              transform: "translateX(-50%)",
              width: "600px",
              height: "400px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(197, 160, 89, 0.15) 0%, rgba(38, 27, 19, 0) 70%)",
              pointerEvents: "none",
            }}
          />

          <div style={{ maxWidth: "800px", margin: "0 auto", position: "relative", zIndex: 2 }}>
            {/* Breadcrumb */}
            <nav
              aria-label="Breadcrumb"
              style={{
                fontSize: "12px",
                color: "#C4AB94",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              <Link href="/" style={{ color: "#C4AB94", textDecoration: "none" }}>
                Home
              </Link>
              <span>/</span>
              <span style={{ color: "#FAF7F2", fontWeight: 600 }}>The ₹1,299 Edit</span>
            </nav>

            <span
              className="luxury-badge"
              style={{
                marginBottom: "14px",
                backgroundColor: "rgba(197, 160, 89, 0.18)",
                color: "#DFBA73",
                border: "1px solid rgba(197, 160, 89, 0.4)",
              }}
            >
              ✦ ATELIER VALUE EDIT · ALL PIECES UP TO ₹1,299 ✦
            </span>

            <h1
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "clamp(34px, 5.5vw, 54px)",
                fontWeight: 500,
                lineHeight: 1.15,
                marginBottom: "8px",
                color: "#FAF7F2",
                letterSpacing: "-0.015em",
              }}
            >
              The ₹1,299 Edit
            </h1>

            <p
              className="font-script"
              style={{
                fontSize: "clamp(26px, 3.8vw, 36px)",
                color: "#DFBA73",
                margin: "0 0 16px 0",
                lineHeight: 1.1,
              }}
            >
              Everyday Luxury &amp; Handcrafted Weaves
            </p>

            <p
              style={{
                fontSize: "15px",
                color: "#D6C7B8",
                maxWidth: "620px",
                margin: "0 auto 24px auto",
                lineHeight: 1.65,
              }}
            >
              Breathable cotton slub kurtas, handwoven Chanderi stoles, and versatile coordinates — thoughtfully crafted for daily comfort and celebration, every single piece priced under ₹1,299.
            </p>

            {/* Quality Standard Highlights */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                fontSize: "11px",
                color: "#E2D7CC",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              <span>✦ 100% Breathable Cotton</span>
              <span style={{ color: "rgba(197, 160, 89, 0.5)" }}>•</span>
              <span>Colorfast Natural Dyes</span>
              <span style={{ color: "rgba(197, 160, 89, 0.5)" }}>•</span>
              <span>Tailored Everyday Fit</span>
              <span style={{ color: "rgba(197, 160, 89, 0.5)" }}>•</span>
              <span>Free Delivery in India</span>
            </div>
          </div>
        </section>

        {/* Catalog Control Bar & Filter Tabs */}
        <section style={{ maxWidth: "1240px", margin: "0 auto", padding: "36px 20px 80px 20px" }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              marginBottom: "28px",
              paddingBottom: "18px",
              borderBottom: "1px solid #E6DACF",
            }}
          >
            {/* Filter Pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {(
                [
                  { id: "ALL", label: "All Under ₹1,299" },
                  { id: "KURTAS", label: "Kurtas & Kurtis" },
                  { id: "SETS", label: "Suit Sets & Coordinates" },
                  { id: "STOLES", label: "Stoles & Dupattas" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    border: activeFilter === tab.id ? "1px solid #261B13" : "1px solid #D8C7B8",
                    backgroundColor: activeFilter === tab.id ? "#261B13" : "#FFFFFF",
                    color: activeFilter === tab.id ? "#FAF7F2" : "#543E2E",
                    boxShadow: activeFilter === tab.id ? "0 2px 8px rgba(38,27,19,0.18)" : "none",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sort & Search Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              {/* Search input */}
              <input
                type="text"
                placeholder="Search ₹1,299 pieces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  height: "38px",
                  padding: "0 14px",
                  borderRadius: "20px",
                  border: "1px solid #CFBEAD",
                  backgroundColor: "#FFFFFF",
                  fontSize: "12.5px",
                  color: "#261B13",
                  outline: "none",
                  width: "180px",
                }}
              />

              {/* Sort selector */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort products"
                style={{
                  height: "38px",
                  padding: "0 14px",
                  borderRadius: "20px",
                  border: "1px solid #CFBEAD",
                  backgroundColor: "#FFFFFF",
                  fontSize: "12.5px",
                  color: "#261B13",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="featured">Featured Pieces</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="newest">Newest Additions</option>
              </select>
            </div>
          </div>

          {/* Results Summary Counter */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
            <span style={{ fontSize: "13px", color: "#6E5B4E", fontWeight: 500 }}>
              Showing {filteredProducts.length} handcrafted {filteredProducts.length === 1 ? "piece" : "pieces"}
            </span>

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#8A181A",
                  fontSize: "12px",
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontWeight: 600,
                }}
              >
                Clear Search
              </button>
            )}
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="responsive-product-grid">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "16px",
                    overflow: "hidden",
                    border: "1px solid #E8DED3",
                    height: "400px",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      height: "280px",
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
          ) : filteredProducts.length > 0 ? (
            <div className="responsive-product-grid">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} badge="UP TO ₹1,299" aspectRatio="portrait" />
              ))}
            </div>
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                border: "1px solid #E6DACF",
              }}
            >
              <h3 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "20px", color: "#261B13", marginBottom: "8px" }}>
                No Pieces Found
              </h3>
              <p style={{ fontSize: "14px", color: "#6E5B4E", marginBottom: "20px" }}>
                No pieces matching your active filter. Try viewing all under ₹1,299 pieces.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveFilter("ALL");
                  setSearchQuery("");
                }}
                className="luxury-button"
                style={{
                  display: "inline-block",
                  backgroundColor: "#261B13",
                  color: "#FAF7F2",
                  padding: "10px 22px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                View All Under ₹1,299
              </button>
            </div>
          )}
        </section>

        {/* Shopping Benefits */}
        <ShoppingBenefits />
      </main>

      <Footer />
    </div>
  );
}

