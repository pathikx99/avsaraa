"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Product, ProductCategory } from "@/types/product";
import { ShoppingBagIcon, HeartIcon } from "./Icons";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import type { User } from "@supabase/supabase-js";


interface ProductsSectionProps {
  initialCategory?: ProductCategory | "ALL";
  showHeader?: boolean;
}

const DEFAULT_FALLBACK_IMAGE = "/images/banarasi_silk_saree.jpg";

export default function ProductsSection({
  initialCategory = "ALL",
  showHeader = true,
}: ProductsSectionProps) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [activeCategory, setActiveCategory] = useState<ProductCategory | "ALL">(initialCategory);
  const [products, setProducts] = useState<Product[]>([]);
  const [, setUser] = useState<User | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc">("featured");
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Check auth
    supabase.auth.getUser().then(({ data }) => {
      if (isMounted) setUser(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) setUser(session?.user ?? null);
    });

    // Load products strictly from Supabase database
    void supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .then(
        ({ data, error }) => {
          if (!isMounted) return;
          if (error || !data) {
            setProducts([]);
          } else {
            setProducts(data);
          }
        },
        () => {
          if (isMounted) setProducts([]);
        }
      );

    // Read category and search from URL query parameters (e.g. ?category=Sarees&search=Banarasi)
    const syncCategoryFromUrl = () => {
      if (typeof window === "undefined") return;
      const urlParams = new URLSearchParams(window.location.search);
      const categoryQuery = urlParams.get("category");
      const searchParam = urlParams.get("search");

      if (searchParam) {
        setSearchQuery(searchParam);
      }

      if (categoryQuery) {
        const normalized = categoryQuery.toLowerCase();
        if (normalized.includes("saree")) setActiveCategory("Sarees");
        else if (normalized.includes("dress")) setActiveCategory("Dresses");
        else if (normalized.includes("new")) setActiveCategory("New Arrivals");
        else if (normalized.includes("occasion")) setActiveCategory("Occasion Wear");
        else if (normalized === "all") setActiveCategory("ALL");
        return;
      }

      const hash = window.location.hash.toLowerCase();
      if (hash.includes("sarees")) setActiveCategory("Sarees");
      else if (hash.includes("dresses")) setActiveCategory("Dresses");
      else if (hash.includes("new-arrivals")) setActiveCategory("New Arrivals");
      else if (hash.includes("occasion-wear")) setActiveCategory("Occasion Wear");
    };

    syncCategoryFromUrl();
    window.addEventListener("popstate", syncCategoryFromUrl);


    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener("popstate", syncCategoryFromUrl);
    };
  }, []);

  const categoriesList: (ProductCategory | "ALL")[] = [
    "ALL",
    "Sarees",
    "Dresses",
    "New Arrivals",
    "Occasion Wear",
  ];

  // Filter & Sort
  const processedProducts = useMemo(() => {
    let result = activeCategory === "ALL"
      ? [...products]
      : products.filter((p) => p.category === activeCategory);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    if (sortBy === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, activeCategory, searchQuery, sortBy]);

  const handleQuickAdd = (product: Product) => {
    const success = addToCart(product);
    if (success) {
      setAddedId(product.id);
      setTimeout(() => setAddedId(null), 2000);
    }
  };

  return (
    <section
      id="products"
      style={{
        backgroundColor: "#FAF7F2",
        padding: showHeader ? "80px 24px 90px 24px" : "40px 24px 80px 24px",
        position: "relative",
        borderBottom: "1px solid #E6DACF",
      }}
    >
      <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
        {/* Section Header (Optional) */}
        {showHeader && (
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <span className="luxury-badge" style={{ marginBottom: "14px" }}>
              ✦ OUR COLLECTION ✦
            </span>
            <h2
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "clamp(32px, 4.5vw, 46px)",
                fontWeight: 500,
                color: "#261B13",
                lineHeight: 1.15,
                marginBottom: "14px",
              }}
            >
              Handcrafted Pieces
            </h2>
            <div className="section-divider" style={{ marginBottom: "16px" }} />
            <p
              style={{
                fontSize: "15px",
                color: "#6E5B4E",
                maxWidth: "580px",
                margin: "0 auto",
                lineHeight: 1.7,
              }}
            >
              Explore our curated handloom weaves and festive ensembles, thoughtfully designed for every celebration.
            </p>
          </div>
        )}

        {/* 1. Category Tabs Bar (Scrollable on mobile) */}
        <div style={{ marginBottom: "20px" }}>
          <div className="category-scroll-strip">
            {categoriesList.map((cat) => {
              const isActive = activeCategory === cat;
              const count = cat === "ALL" ? products.length : products.filter((p) => p.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="luxury-pill-tab"
                  style={{
                    padding: "9px 20px",
                    borderRadius: "24px",
                    fontSize: "12px",
                    fontWeight: isActive ? 600 : 500,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    backgroundColor: isActive ? "#261B13" : "#FFFFFF",
                    color: isActive ? "#FAF7F2" : "#6E5B4E",
                    border: isActive ? "1px solid #261B13" : "1px solid #CFBEAD",
                    cursor: "pointer",
                    boxShadow: isActive ? "0 4px 14px rgba(38,27,19,0.15)" : "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  <span>{cat}</span>
                  <span
                    style={{
                      fontSize: "11px",
                      opacity: isActive ? 0.9 : 0.6,
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Search & Sort Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "14px",
            marginBottom: "36px",
            paddingBottom: "18px",
            borderBottom: "1px solid #EAE0D5",
          }}
        >
          {/* Search Box */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "#FFFFFF",
              border: "1px solid #CFBEAD",
              borderRadius: "22px",
              padding: "0 16px",
              height: "42px",
              width: "100%",
              maxWidth: "360px",
              boxShadow: "0 2px 8px rgba(38, 27, 19, 0.03)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8E7D70" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search weaves, silks, drapes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                marginLeft: "10px",
                fontSize: "13px",
                color: "#261B13",
                width: "100%",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{ fontSize: "14px", color: "#8E7D70", cursor: "pointer" }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Right Controls: Sort & Concierge Link */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "12px", color: "#866951", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "featured" | "price-asc" | "price-desc")}
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #CFBEAD",
                  borderRadius: "18px",
                  padding: "6px 14px",
                  fontSize: "12px",
                  color: "#261B13",
                  cursor: "pointer",
                  outline: "none",
                  fontFamily: "inherit",
                }}
              >
                <option value="featured">Featured First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>

            <Link
              href="/contact"
              className="desktop-only"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12.5px",
                color: "#866951",
                fontWeight: 600,
                textDecoration: "underline",
                textUnderlineOffset: "3px",
              }}
            >
              <span>✦ Custom Blouse & Drape Styling →</span>
            </Link>
          </div>
        </div>

        {/* 3. Products Grid or Empty State */}
        {processedProducts.length === 0 ? (
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px dashed #D4C3B3",
              borderRadius: "24px",
              padding: "60px 24px",
              textAlign: "center",
              maxWidth: "580px",
              margin: "20px auto 0 auto",
              boxShadow: "0 8px 30px rgba(38, 27, 19, 0.03)",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                backgroundColor: "#FAF7F2",
                border: "1px solid #E6DACF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 18px auto",
                fontSize: "20px",
                color: "#866951",
              }}
            >
              ✦
            </div>
            <h3
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "22px",
                color: "#261B13",
                marginBottom: "8px",
                fontWeight: 500,
              }}
            >
              No Pieces Found
            </h3>
            <p
              style={{
                fontSize: "13.5px",
                color: "#6E5B4E",
                maxWidth: "420px",
                margin: "0 auto 24px auto",
                lineHeight: 1.6,
              }}
            >
              {searchQuery
                ? `No results matching "${searchQuery}". Try a different keyword.`
                : `No pieces currently listed in ${activeCategory}.`}
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveCategory("ALL");
                setSearchQuery("");
              }}
              className="avsaraa-btn-outline"
              style={{
                height: "44px",
                padding: "0 24px",
                fontSize: "12px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                backgroundColor: "#FFFFFF",
              }}
            >
              View Full Collection →
            </button>
          </div>
        ) : (
          <div className="responsive-product-grid">
            {processedProducts.map((product) => (
              <div
                key={product.id}
                className="luxury-hover-card product-card-container product-card-shimmer"
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "20px",
                  overflow: "hidden",
                  border: "1px solid #E8DED3",
                  boxShadow: "0 8px 24px -10px rgba(38,27,19,0.06)",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                }}
              >
                {/* Product Image Frame */}
                <div
                  className="luxury-image-zoom-container product-card-image"
                  onClick={() => setSelectedProduct(product)}
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "360px",
                    backgroundColor: "#F2EBE3",
                    cursor: "pointer",
                  }}
                >
                  <Image
                    src={product.image_url || DEFAULT_FALLBACK_IMAGE}
                    alt={product.name}
                    fill
                    sizes="(min-width: 900px) 25vw, 50vw"
                    style={{ objectFit: "cover", objectPosition: "center 20%" }}
                  />

                  {/* Category Badge */}
                  <div
                    className="product-card-badge"
                    style={{
                      position: "absolute",
                      top: "14px",
                      left: "14px",
                      backgroundColor: "rgba(38, 27, 19, 0.85)",
                      backdropFilter: "blur(6px)",
                      WebkitBackdropFilter: "blur(6px)",
                      color: "#FAF7F2",
                      padding: "5px 12px",
                      borderRadius: "14px",
                      fontSize: "10.5px",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    {product.category}
                  </div>

                  {/* Wishlist Heart Toggle Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(product);
                    }}
                    aria-label={isInWishlist(product.id) ? "Remove from saved heirlooms" : "Save to wishlist"}
                    style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      width: "34px",
                      height: "34px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(250, 247, 242, 0.94)",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      border: "1px solid rgba(197, 160, 89, 0.45)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      zIndex: 3,
                      boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <HeartIcon
                      size={16}
                      color={isInWishlist(product.id) ? "#B83A4B" : "#866951"}
                    />
                  </button>

                  {/* Quick View Button on Image */}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProduct(product);
                    }}
                    className="product-card-quickview"
                    style={{
                      position: "absolute",
                      bottom: "14px",
                      right: "14px",
                      backgroundColor: "rgba(250, 247, 242, 0.94)",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      color: "#261B13",
                      padding: "7px 16px",
                      borderRadius: "18px",
                      fontSize: "11px",
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      border: "1px solid rgba(197, 160, 89, 0.6)",
                      cursor: "pointer",
                      boxShadow: "0 4px 15px rgba(0,0,0,0.12)",
                    }}
                  >
                    Quick View ↗
                  </button>
                </div>

                {/* Product Info */}
                <div
                  className="product-card-body"
                  style={{
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                  }}
                >
                  <h3
                    onClick={() => setSelectedProduct(product)}
                    className="product-card-title"
                    style={{
                      fontFamily: "var(--font-serif), Georgia, serif",
                      fontSize: "19px",
                      fontWeight: 600,
                      color: "#261B13",
                      marginBottom: "6px",
                      lineHeight: 1.3,
                      cursor: "pointer",
                    }}
                  >
                    {product.name}
                  </h3>

                  {product.description && (
                    <p
                      className="product-card-desc"
                      style={{
                        fontSize: "12.5px",
                        color: "#6E5B4E",
                        lineHeight: 1.55,
                        marginBottom: "16px",
                        flex: 1,
                      }}
                    >
                      {product.description}
                    </p>
                  )}

                  <div
                    style={{
                      marginTop: "auto",
                      paddingTop: "14px",
                      borderTop: "1px solid #F0E8DF",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <span
                          className="product-card-price"
                          style={{
                            display: "block",
                            fontSize: "18px",
                            fontWeight: 700,
                            color: "#261B13",
                            lineHeight: 1.1,
                          }}
                        >
                          ₹{product.price.toLocaleString("en-IN")}
                        </span>
                        <span
                          className="desktop-only"
                          style={{
                            fontSize: "10.5px",
                            color: "#8E7D70",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                          }}
                        >
                          Handcrafted • Free Delivery
                        </span>
                      </div>

                      <Link
                        href={`/contact?inquire=${encodeURIComponent(product.name)}`}
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#866951",
                          textDecoration: "underline",
                          textUnderlineOffset: "3px",
                        }}
                      >
                        Inquire ↗
                      </Link>
                    </div>

                    {/* Add to Bag Action Button */}
                    <button
                      type="button"
                      onClick={() => handleQuickAdd(product)}
                      className="avsaraa-btn-primary product-card-btn btn-shine"
                      style={{
                        height: "40px",
                        fontSize: "11px",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        borderRadius: "20px",
                        width: "100%",
                        backgroundColor: addedId === product.id ? "#1B6B40" : "#261B13",
                        transition: "background-color 0.3s ease",
                      }}
                    >
                      <ShoppingBagIcon size={14} color="#FAF7F2" />
                      <span>{addedId === product.id ? "Added to Bag ✓" : "Add to Bag"}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      {selectedProduct && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(38, 27, 19, 0.72)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
            animation: "fadeIn 0.25s ease both",
          }}
          onClick={() => setSelectedProduct(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#FAF7F2",
              border: "1px solid #E6DACF",
              borderRadius: "24px",
              padding: "24px",
              maxWidth: "760px",
              width: "100%",
              maxHeight: "92vh",
              overflowY: "auto",
              boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "28px",
              position: "relative",
              animation: "fadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both",
            }}
          >
            <button
              onClick={() => setSelectedProduct(null)}
              aria-label="Close modal"
              style={{
                position: "absolute",
                top: "16px",
                right: "18px",
                fontSize: "20px",
                color: "#8E7D70",
                cursor: "pointer",
                background: "none",
                border: "none",
                zIndex: 2,
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>

            {/* Left Image */}
            <div
              style={{
                position: "relative",
                height: "380px",
                borderRadius: "18px",
                overflow: "hidden",
                backgroundColor: "#F2EBE3",
                boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
              }}
            >
              <Image
                src={selectedProduct.image_url || DEFAULT_FALLBACK_IMAGE}
                alt={selectedProduct.name}
                fill
                sizes="380px"
                style={{ objectFit: "cover" }}
              />
              <span
                style={{
                  position: "absolute",
                  top: "14px",
                  left: "14px",
                  backgroundColor: "rgba(38, 27, 19, 0.85)",
                  color: "#FAF7F2",
                  padding: "4px 12px",
                  borderRadius: "14px",
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {selectedProduct.category}
              </span>
            </div>

            {/* Right Details */}
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <span className="luxury-badge" style={{ marginBottom: "10px" }}>
                  ✦ AVSARAA ATELIER
                </span>
                <h3
                  style={{
                    fontFamily: "var(--font-serif), Georgia, serif",
                    fontSize: "26px",
                    fontWeight: 600,
                    color: "#261B13",
                    marginBottom: "8px",
                    lineHeight: 1.2,
                  }}
                >
                  {selectedProduct.name}
                </h3>

                <p style={{ fontSize: "22px", fontWeight: 700, color: "#261B13", marginBottom: "4px" }}>
                  ₹{selectedProduct.price.toLocaleString("en-IN")}
                </p>
                <p
                  style={{
                    fontSize: "11.5px",
                    color: "#8E7D70",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    marginBottom: "18px",
                  }}
                >
                  Inclusive of all taxes • Free delivery across India
                </p>

                <div
                  style={{
                    width: "40px",
                    height: "1px",
                    background: "linear-gradient(90deg, #C5A059, transparent)",
                    marginBottom: "18px",
                  }}
                />

                <p style={{ fontSize: "14px", color: "#543E2E", lineHeight: 1.7, marginBottom: "22px" }}>
                  {selectedProduct.description || "Handcrafted pure silk with delicate handwork and timeless elegance."}
                </p>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    fontSize: "12.5px",
                    color: "#6E5B4E",
                    marginBottom: "24px",
                  }}
                >
                  <div>✦ <strong>Category:</strong> {selectedProduct.category}</div>
                  <div>✦ <strong>Authenticity:</strong> 100% Handcrafted Indian Silk</div>
                  <div>✦ <strong>Finishing & Delivery:</strong> Fall & Pico • Insured Express Dispatch</div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => {
                    const added = addToCart(selectedProduct);
                    if (added) setSelectedProduct(null);
                  }}
                  className="avsaraa-btn-primary btn-shine"
                  style={{
                    height: "48px",
                    fontSize: "13px",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    borderRadius: "24px",
                    backgroundColor: "#261B13",
                    color: "#FAF7F2",
                  }}
                >
                  <ShoppingBagIcon size={16} color="#FAF7F2" />
                  <span>Add to Shopping Bag</span>
                </button>

                <Link
                  href={`/contact?inquire=${encodeURIComponent(selectedProduct.name)}`}
                  onClick={() => setSelectedProduct(null)}
                  className="avsaraa-btn-outline"
                  style={{
                    height: "44px",
                    fontSize: "12.5px",
                    backgroundColor: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    textDecoration: "none",
                    borderRadius: "22px",
                    border: "1px solid #CFBEAD",
                    color: "#261B13",
                  }}
                >
                  <span>Inquire with Atelier</span>
                  <span>→</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  style={{
                    fontSize: "12px",
                    color: "#8E7D70",
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                    padding: "6px",
                    textDecoration: "underline",
                    textUnderlineOffset: "3px",
                  }}
                >
                  Continue Browsing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
