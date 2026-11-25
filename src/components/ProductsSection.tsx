"use client";

import React, { useState, useEffect, useMemo, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Product, ProductCategory } from "@/types/product";
import { productMatchesOccasion, getOccasionTitleBySlug, resolveProductImage } from "@/lib/productUtils";
import { HeartIcon } from "./Icons";
import { useWishlist } from "@/context/WishlistContext";
import { fetchCatalog } from "@/lib/useProductsCatalog";
import type { User } from "@supabase/supabase-js";

export type ProductDisplayCategory = ProductCategory | "ALL" | "Under ₹1,299";

interface ProductsSectionProps {
  initialCategory?: ProductDisplayCategory;
  initialMaxPrice?: number | null;
  showHeader?: boolean;
}

const DEFAULT_FALLBACK_IMAGE = "https://aqpkagsbaecavoznnrlj.supabase.co/storage/v1/object/public/items/products/e2000000-0000-0000-0000-000000000001/hero.webp";

export default function ProductsSection({
  initialCategory = "ALL",
  initialMaxPrice = null,
  showHeader = true,
}: ProductsSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [activeCategory, setActiveCategory] = useState<ProductDisplayCategory>(initialCategory);
  const [products, setProducts] = useState<Product[]>([]);
  const [, setUser] = useState<User | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeOccasion, setActiveOccasion] = useState<string | null>(null);
  const [activeMaxPrice, setActiveMaxPrice] = useState<number | null>(initialMaxPrice);
  const [sortBy, setSortBy] = useState<"featured" | "bestsellers" | "newest" | "price-asc" | "price-desc">("featured");
  const isMountedClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

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

    // Load products using fast shared catalog cache
    fetchCatalog().then(
      (data) => {
        if (!isMounted) return;
        setProducts(data || []);
      },
      () => {
        if (isMounted) setProducts([]);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Synchronize state when URL searchParams change
  const currentParamsKey = searchParams ? searchParams.toString() : "";
  const [prevParamsKey, setPrevParamsKey] = useState<string | null>(null);

  if (currentParamsKey !== prevParamsKey) {
    setPrevParamsKey(currentParamsKey);
    const categoryQuery = searchParams?.get("category");
    const searchParam = searchParams?.get("search");
    const occasionParam = searchParams?.get("occasion");
    const maxPriceParam = searchParams?.get("maxPrice");
    const sortParam = searchParams?.get("sort");

    setSearchQuery(searchParam !== null && searchParam !== undefined ? searchParam : "");
    setActiveOccasion(occasionParam || null);

    const parsedMax = maxPriceParam && !isNaN(Number(maxPriceParam)) ? Number(maxPriceParam) : initialMaxPrice;
    setActiveMaxPrice(parsedMax);

    if (sortParam) {
      if (["featured", "bestsellers", "newest", "price-asc", "price-desc"].includes(sortParam)) {
        setSortBy(sortParam as "featured" | "bestsellers" | "newest" | "price-asc" | "price-desc");
      }
    }

    if (parsedMax !== null && parsedMax <= 1299) {
      setActiveCategory("Under ₹1,299");
    } else if (categoryQuery) {
      const normalized = categoryQuery.toLowerCase();
      if (normalized.includes("1299") || normalized.includes("under")) {
        setActiveCategory("Under ₹1,299");
        setActiveMaxPrice(1299);
      } else if (normalized.includes("saree")) {
        setActiveCategory("Sarees");
      } else if (normalized.includes("dress")) {
        setActiveCategory("Dresses");
      } else if (normalized.includes("new")) {
        setActiveCategory("New Arrivals");
      } else if (normalized.includes("occasion")) {
        setActiveCategory("Occasion Wear");
      } else if (normalized === "all") {
        setActiveCategory("ALL");
      }
    } else if (initialCategory === "Under ₹1,299") {
      setActiveCategory("Under ₹1,299");
      setActiveMaxPrice(1299);
    } else {
      setActiveCategory(initialCategory);
    }
  }

  const categoriesList: ProductDisplayCategory[] = [
    "ALL",
    "Sarees",
    "Dresses",
    "Under ₹1,299",
    "New Arrivals",
    "Occasion Wear",
  ];

  // Filter & Sort
  const processedProducts = useMemo(() => {
    let result = [...products];

    if (activeCategory === "Under ₹1,299") {
      result = result.filter((p) => p.price <= 1299);
    } else if (activeCategory === "New Arrivals") {
      result = [...result]
        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
        .slice(0, 20);
    } else if (activeCategory === "Occasion Wear") {
      result = result.filter((p) => p.occasion_tags && p.occasion_tags.length > 0);
    } else if (activeCategory !== "ALL") {
      result = result.filter((p) => p.category.toLowerCase() === activeCategory.toLowerCase());
    }

    // Filter by occasion if active
    if (activeOccasion) {
      result = result.filter((p) => productMatchesOccasion(p, activeOccasion));
    }

    // Filter by max price if active and not already applied by category
    if (activeMaxPrice !== null && activeCategory !== "Under ₹1,299") {
      result = result.filter((p) => p.price <= activeMaxPrice);
    }

    // Filter by max price if active (e.g., Up to ₹1,299)
    if (activeMaxPrice !== null) {
      result = result.filter((p) => p.price <= activeMaxPrice);
    }

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          (p.occasion_tags && p.occasion_tags.some((tag) => tag.toLowerCase().includes(q)))
      );
    }

    // Sorting
    if (sortBy === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "bestsellers") {
      result.sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0));
    } else if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }

    return result;
  }, [products, activeCategory, activeOccasion, activeMaxPrice, searchQuery, sortBy]);

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
              const count =
                cat === "ALL"
                  ? products.length
                  : cat === "Under ₹1,299"
                  ? products.filter((p) => p.price <= 1299).length
                  : cat === "New Arrivals"
                  ? Math.min(20, products.length)
                  : cat === "Occasion Wear"
                  ? products.filter((p) => p.occasion_tags && p.occasion_tags.length > 0).length
                  : products.filter((p) => p.category.toLowerCase() === cat.toLowerCase()).length;
              return (
                <button
                  key={cat}
                  aria-pressed={isActive}
                  onClick={() => {
                    setActiveCategory(cat);
                    if (cat === "ALL") {
                      setActiveMaxPrice(null);
                      router.replace("/products", { scroll: false });
                    } else if (cat === "Under ₹1,299") {
                      setActiveMaxPrice(1299);
                      router.replace("/products?maxPrice=1299", { scroll: false });
                    } else {
                      setActiveMaxPrice(null);
                      router.replace(`/products?category=${encodeURIComponent(cat)}`, { scroll: false });
                    }
                  }}
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

        {/* Active Filter Chips (Occasion, Price Ceiling, Search) */}
        {(activeOccasion || activeMaxPrice !== null || searchQuery) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
              marginBottom: "20px",
              padding: "10px 14px",
              backgroundColor: "#F2EBE3",
              borderRadius: "12px",
              border: "1px solid #E2D7CC",
            }}
          >
            <span style={{ fontSize: "11.5px", fontWeight: 600, color: "#6E5B4E", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Active Filters:
            </span>

            {activeOccasion && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 10px",
                  borderRadius: "16px",
                  backgroundColor: "#261B13",
                  color: "#FAF7F2",
                  fontSize: "12px",
                  fontWeight: 500,
                }}
              >
                <span>Occasion: {getOccasionTitleBySlug(activeOccasion)}</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveOccasion(null);
                    router.replace("/products", { scroll: false });
                  }}
                  style={{ background: "none", border: "none", color: "#C4AB94", cursor: "pointer", fontSize: "13px", padding: 0 }}
                >
                  ✕
                </button>
              </span>
            )}

            {activeMaxPrice !== null && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 10px",
                  borderRadius: "16px",
                  backgroundColor: "#1E5E3A",
                  color: "#FAF7F2",
                  fontSize: "12px",
                  fontWeight: 500,
                }}
              >
                <span>Up to ₹{activeMaxPrice.toLocaleString("en-IN")}</span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveMaxPrice(null);
                    router.replace("/products", { scroll: false });
                  }}
                  style={{ background: "none", border: "none", color: "#D4EDDA", cursor: "pointer", fontSize: "13px", padding: 0 }}
                >
                  ✕
                </button>
              </span>
            )}

            {searchQuery && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 10px",
                  borderRadius: "16px",
                  backgroundColor: "#FFFFFF",
                  color: "#261B13",
                  border: "1px solid #CFBEAD",
                  fontSize: "12px",
                  fontWeight: 500,
                }}
              >
                <span>Query: &ldquo;{searchQuery}&rdquo;</span>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  style={{ background: "none", border: "none", color: "#8E7D70", cursor: "pointer", fontSize: "13px", padding: 0 }}
                >
                  ✕
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={() => {
                setActiveOccasion(null);
                setActiveMaxPrice(null);
                setActiveCategory("ALL");
                setSearchQuery("");
                router.replace("/products", { scroll: false });
              }}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                fontSize: "11.5px",
                color: "#8A181A",
                textDecoration: "underline",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Clear All Filters
            </button>
          </div>
        )}

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
              id="catalog-search-input"
              name="catalog-search"
              aria-label="Search catalog"
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
                onChange={(e) => setSortBy(e.target.value as "featured" | "bestsellers" | "newest" | "price-asc" | "price-desc")}
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
                <option value="bestsellers">Bestsellers</option>
                <option value="newest">New Arrivals First</option>
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
                onClick={() => router.push(`/products/${product.id}`)}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "1px solid rgba(230, 218, 207, 0.85)",
                  boxShadow: "0 4px 20px -4px rgba(38,27,19,0.06), 0 1px 3px rgba(38,27,19,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  cursor: "pointer",
                  transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s ease, border-color 0.3s ease",
                }}
              >
                {/* Product Image Frame */}
                <div
                  className="luxury-image-zoom-container product-card-image"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/products/${product.id}`);
                  }}
                  style={{
                    position: "relative",
                    width: "100%",
                    backgroundColor: "#F2EBE3",
                    cursor: "pointer",
                  }}
                >
                  <Image
                    src={resolveProductImage(product.image_url) || DEFAULT_FALLBACK_IMAGE}
                    alt={product.name}
                    fill
                    sizes="(min-width: 900px) 25vw, 50vw"
                    style={{ objectFit: "cover", objectPosition: "center 20%", transition: "transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)" }}
                  />

                  {/* Category Badge */}
                  <div
                    className="product-card-badge"
                    style={{
                      position: "absolute",
                      top: "10px",
                      left: "10px",
                      backgroundColor: "rgba(26, 18, 12, 0.88)",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      color: "#ECC880",
                      padding: "4px 10px",
                      borderRadius: "10px",
                      fontSize: "9.5px",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                      border: "1px solid rgba(197, 160, 89, 0.4)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span style={{ fontSize: "8px" }}>✦</span>
                    <span>{product.category}</span>
                  </div>

                  {/* Wishlist Heart Toggle Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWishlist(product);
                    }}
                    aria-label={isInWishlist(product.id) ? "Remove from wishlist" : "Save to wishlist"}
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      width: "34px",
                      height: "34px",
                      borderRadius: "50%",
                      backgroundColor: isInWishlist(product.id) ? "#8A181A" : "rgba(255, 255, 255, 0.9)",
                      color: isInWishlist(product.id) ? "#FFFFFF" : "#261B13",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      border: isInWishlist(product.id) ? "1px solid #8A181A" : "1px solid rgba(197, 160, 89, 0.35)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      zIndex: 3,
                      boxShadow: isInWishlist(product.id) ? "0 4px 12px rgba(138, 24, 26, 0.35)" : "0 4px 14px rgba(38, 27, 19, 0.12)",
                      transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    }}
                  >
                    <HeartIcon
                      size={16}
                      color={isInWishlist(product.id) ? "#FFFFFF" : "#261B13"}
                      fill={isInWishlist(product.id) ? "currentColor" : "none"}
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
                      bottom: "12px",
                      right: "12px",
                      backgroundColor: "rgba(250, 247, 242, 0.94)",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      color: "#261B13",
                      padding: "6px 14px",
                      borderRadius: "16px",
                      fontSize: "10.5px",
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
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                  }}
                >
                  <Link
                    href={`/products/${product.id}`}
                    className="product-card-title"
                    style={{
                      fontFamily: "var(--font-serif), Georgia, serif",
                      fontSize: "18px",
                      fontWeight: 600,
                      color: "#261B13",
                      marginBottom: "6px",
                      lineHeight: 1.3,
                      textDecoration: "none",
                      display: "block",
                    }}
                  >
                    {product.name}
                  </Link>

                  {product.description && (
                    <p
                      className="product-card-desc"
                      style={{
                        fontSize: "12px",
                        color: "#6E5B4E",
                        lineHeight: 1.55,
                        marginBottom: "14px",
                        flex: 1,
                      }}
                    >
                      {product.description}
                    </p>
                  )}

                  <div
                    style={{
                      marginTop: "auto",
                      paddingTop: "12px",
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
                            fontSize: "17px",
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
                            fontSize: "10px",
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
                        onClick={(e) => e.stopPropagation()}
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

                    {/* View Product Action Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/products/${product.id}`);
                      }}
                      className="avsaraa-btn-primary product-card-btn btn-shine"
                      style={{
                        height: "38px",
                        fontSize: "10.5px",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        borderRadius: "8px",
                        width: "100%",
                        backgroundColor: "#261B13",
                        border: "1px solid rgba(197, 160, 89, 0.4)",
                        boxShadow: "0 2px 8px rgba(38,27,19,0.14)",
                        cursor: "pointer",
                      }}
                    >
                      <span>Select Size & Details →</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      {isMountedClient && selectedProduct && typeof document !== "undefined" && createPortal(
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(20, 13, 8, 0.78)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: "20px",
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
                src={resolveProductImage(selectedProduct.image_url) || DEFAULT_FALLBACK_IMAGE}
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
                  ✦ AVSARAA COLLECTION
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
                  Inclusive of all taxes • Free Gujarat delivery ₹500+
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
                <Link
                  href={`/products/${selectedProduct.id}`}
                  onClick={() => setSelectedProduct(null)}
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
                    textDecoration: "none",
                  }}
                >
                  <span>Select Size & Customization →</span>
                </Link>

                <Link
                  href={`/products/${selectedProduct.id}`}
                  onClick={() => setSelectedProduct(null)}
                  className="avsaraa-btn-outline"
                  style={{
                    height: "44px",
                    fontSize: "12.5px",
                    backgroundColor: "#FAF7F2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    textDecoration: "none",
                    borderRadius: "22px",
                    border: "1.5px solid #261B13",
                    color: "#261B13",
                    fontWeight: 600,
                  }}
                >
                  <span>View Complete Details &amp; Size Guide →</span>
                </Link>

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
                  <span>Inquire with Us</span>
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
        </div>,
        document.body
      )}
    </section>
  );
}
