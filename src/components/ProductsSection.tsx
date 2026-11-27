"use client";

import React, { useState, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Product, ProductCategory, OCCASIONS_LIST } from "@/types/product";
import { productMatchesOccasion, getOccasionTitleBySlug, resolveProductImage, formatINR } from "@/lib/productUtils";
import { SlidersIcon, CloseIcon, SearchIcon, ShoppingBagIcon, CheckIcon } from "./Icons";
import { fetchCatalog } from "@/lib/useProductsCatalog";
import { useCart } from "@/context/CartContext";
import ProductCard from "./home/ProductCard";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";

export type ProductDisplayCategory = ProductCategory | "ALL" | "Under ₹1,299";
type PriceBracket = "all" | "under-1299" | "1300-4999" | "5000-14999" | "15000-plus";

interface ProductsSectionProps {
  initialCategory?: ProductDisplayCategory;
  initialMaxPrice?: number | null;
  showHeader?: boolean;
}

const DEFAULT_FALLBACK_IMAGE = "/images/saree_model_hero.jpg";

export default function ProductsSection({
  initialCategory = "ALL",
  initialMaxPrice = null,
  showHeader = true,
}: ProductsSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToCart } = useCart();

  const currentParamsKey = searchParams ? searchParams.toString() : "";

  const urlDefaults = useMemo(() => {
    const categoryQuery = searchParams?.get("category");
    const searchParam = searchParams?.get("search") || "";
    const occasionParam = searchParams?.get("occasion") || null;
    const maxPriceParam = searchParams?.get("maxPrice");
    const sortParam = searchParams?.get("sort");

    const parsedMax =
      maxPriceParam && !isNaN(Number(maxPriceParam)) ? Number(maxPriceParam) : initialMaxPrice;

    let derivedCategory: ProductDisplayCategory = initialCategory;
    let effectiveMax = parsedMax;

    if (parsedMax !== null && parsedMax <= 1299) {
      derivedCategory = "Under ₹1,299";
    } else if (categoryQuery) {
      const normalized = categoryQuery.toLowerCase();
      if (normalized.includes("1299") || normalized.includes("under")) {
        derivedCategory = "Under ₹1,299";
        effectiveMax = 1299;
      } else if (normalized.includes("saree")) {
        derivedCategory = "Sarees";
      } else if (normalized.includes("dress")) {
        derivedCategory = "Dresses";
      } else if (normalized.includes("new")) {
        derivedCategory = "New Arrivals";
      } else if (normalized.includes("occasion")) {
        derivedCategory = "Occasion Wear";
      } else if (normalized === "all") {
        derivedCategory = "ALL";
      }
    } else if (initialCategory === "Under ₹1,299") {
      derivedCategory = "Under ₹1,299";
      effectiveMax = 1299;
    }

    const derivedSort: "featured" | "bestsellers" | "newest" | "price-asc" | "price-desc" =
      sortParam && ["featured", "bestsellers", "newest", "price-asc", "price-desc"].includes(sortParam)
        ? (sortParam as "featured" | "bestsellers" | "newest" | "price-asc" | "price-desc")
        : "featured";

    const derivedBracket: PriceBracket =
      effectiveMax !== null && effectiveMax <= 1299 ? "under-1299" : "all";

    return {
      category: derivedCategory,
      search: searchParam,
      occasion: occasionParam,
      maxPrice: effectiveMax,
      priceBracket: derivedBracket,
      sort: derivedSort,
    };
  }, [searchParams, initialCategory, initialMaxPrice]);

  interface LocalOverrides {
    paramsKey: string;
    category?: ProductDisplayCategory;
    search?: string;
    occasion?: string | null;
    maxPrice?: number | null;
    priceBracket?: PriceBracket;
    sort?: "featured" | "bestsellers" | "newest" | "price-asc" | "price-desc";
  }

  const [overrides, setOverrides] = useState<LocalOverrides>({ paramsKey: currentParamsKey });
  const hasMatchingOverrides = overrides.paramsKey === currentParamsKey;

  const activeCategory = (hasMatchingOverrides ? overrides.category : undefined) ?? urlDefaults.category;
  const searchQuery = (hasMatchingOverrides ? overrides.search : undefined) ?? urlDefaults.search;
  const activeOccasion =
    hasMatchingOverrides && overrides.occasion !== undefined ? overrides.occasion : urlDefaults.occasion;
  const activeMaxPrice =
    hasMatchingOverrides && overrides.maxPrice !== undefined ? overrides.maxPrice : urlDefaults.maxPrice;
  const priceBracket = (hasMatchingOverrides ? overrides.priceBracket : undefined) ?? urlDefaults.priceBracket;
  const sortBy = (hasMatchingOverrides ? overrides.sort : undefined) ?? urlDefaults.sort;

  const setActiveCategory = (category: ProductDisplayCategory) =>
    setOverrides((prev) => ({ ...(prev.paramsKey === currentParamsKey ? prev : { paramsKey: currentParamsKey }), category }));
  const setSearchQuery = (search: string) =>
    setOverrides((prev) => ({ ...(prev.paramsKey === currentParamsKey ? prev : { paramsKey: currentParamsKey }), search }));
  const setActiveOccasion = (occasion: string | null) =>
    setOverrides((prev) => ({ ...(prev.paramsKey === currentParamsKey ? prev : { paramsKey: currentParamsKey }), occasion }));
  const setActiveMaxPrice = (maxPrice: number | null) =>
    setOverrides((prev) => ({ ...(prev.paramsKey === currentParamsKey ? prev : { paramsKey: currentParamsKey }), maxPrice }));
  const setPriceBracket = (bracket: PriceBracket) =>
    setOverrides((prev) => ({ ...(prev.paramsKey === currentParamsKey ? prev : { paramsKey: currentParamsKey }), priceBracket: bracket }));
  const setSortBy = (sort: "featured" | "bestsellers" | "newest" | "price-asc" | "price-desc") =>
    setOverrides((prev) => ({ ...(prev.paramsKey === currentParamsKey ? prev : { paramsKey: currentParamsKey }), sort }));

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quickViewColor, setQuickViewColor] = useState<string>("");
  const [quickViewSize, setQuickViewSize] = useState<string>("");
  const [quickViewAdded, setQuickViewAdded] = useState(false);

  const [selectedFabric, setSelectedFabric] = useState<string>("all");
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(false);

  const quickViewRef = useRef<HTMLDivElement>(null);
  useAccessibleDialog(Boolean(selectedProduct), () => setSelectedProduct(null), quickViewRef);

  const isMountedClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useEffect(() => {
    let isMounted = true;
    fetchCatalog()
      .then((data) => {
        if (!isMounted) return;
        setProducts(data || []);
        setLoading(false);
      })
      .catch(() => {
        if (isMounted) {
          setProducts([]);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const categoriesList: ProductDisplayCategory[] = [
    "ALL",
    "Sarees",
    "Dresses",
    "Under ₹1,299",
    "New Arrivals",
    "Occasion Wear",
  ];

  // Dynamically derive unique fabric options from catalog
  const fabricOptions = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.fabric && p.fabric.trim()) {
        set.add(p.fabric.trim());
      }
    });
    return Array.from(set).sort();
  }, [products]);

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

    if (activeOccasion) {
      result = result.filter((p) => productMatchesOccasion(p, activeOccasion));
    }

    if (activeMaxPrice !== null) {
      result = result.filter((p) => p.price <= activeMaxPrice);
    }

    if (priceBracket === "under-1299") {
      result = result.filter((p) => p.price <= 1299);
    } else if (priceBracket === "1300-4999") {
      result = result.filter((p) => p.price >= 1300 && p.price <= 4999);
    } else if (priceBracket === "5000-14999") {
      result = result.filter((p) => p.price >= 5000 && p.price <= 14999);
    } else if (priceBracket === "15000-plus") {
      result = result.filter((p) => p.price >= 15000);
    }

    if (selectedFabric !== "all") {
      result = result.filter((p) => p.fabric?.toLowerCase() === selectedFabric.toLowerCase());
    }

    if (inStockOnly) {
      result = result.filter((p) => p.stock_count === undefined || p.stock_count > 0);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.fabric?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          (p.occasion_tags && p.occasion_tags.some((tag) => tag.toLowerCase().includes(q)))
      );
    }

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
  }, [products, activeCategory, activeOccasion, activeMaxPrice, priceBracket, selectedFabric, inStockOnly, searchQuery, sortBy]);

  const activeFacetCount =
    (activeOccasion ? 1 : 0) +
    (priceBracket !== "all" || activeMaxPrice !== null ? 1 : 0) +
    (selectedFabric !== "all" ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const clearAllFilters = () => {
    setActiveOccasion(null);
    setActiveMaxPrice(null);
    setActiveCategory("ALL");
    setPriceBracket("all");
    setSelectedFabric("all");
    setInStockOnly(false);
    setSearchQuery("");
    router.replace("/products", { scroll: false });
  };

  const openQuickView = (product: Product) => {
    setSelectedProduct(product);
    setQuickViewColor(product.color_variants?.[0]?.name || "");
    setQuickViewSize(
      product.available_sizes?.[0] ||
        (product.category === "Sarees" ? "Free Size (5.5m + 0.8m Blouse)" : "M")
    );
    setQuickViewAdded(false);
  };

  const handleQuickViewAddToBag = () => {
    if (!selectedProduct) return;
    const activeVariant = selectedProduct.color_variants?.find((v) => v.name === quickViewColor);
    const imgUrl = activeVariant?.primary_image || activeVariant?.image_url || selectedProduct.image_url;
    const colorSuffix = quickViewColor ? ` · ${quickViewColor}` : "";
    const cartProduct: Product = {
      ...selectedProduct,
      image_url: imgUrl,
      name: `${selectedProduct.name} · ${quickViewSize}${colorSuffix}`,
    };
    const ok = addToCart(cartProduct, 1);
    if (ok) {
      setQuickViewAdded(true);
      setTimeout(() => {
        setSelectedProduct(null);
      }, 650);
    }
  };

  return (
    <section
      id="products"
      className="catalog-section-wrap"
      style={{
        backgroundColor: "#FAF7F2",
        padding: showHeader ? "80px 24px 90px 24px" : "36px 20px 80px 20px",
        position: "relative",
        borderBottom: "1px solid #E6DACF",
      }}
    >
      <div style={{ maxWidth: "1260px", margin: "0 auto" }}>
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
                color: "#6A584B",
                maxWidth: "580px",
                margin: "0 auto",
                lineHeight: 1.7,
              }}
            >
              Explore our curated handloom weaves and festive ensembles, thoughtfully designed for every celebration.
            </p>
          </div>
        )}

        {/* 1. Category Tabs Bar */}
        <div className="category-strip-wrap" style={{ marginBottom: "18px", position: "relative" }}>
          <div className="category-scroll-strip" role="tablist" aria-label="Product Categories">
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
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => {
                    setActiveCategory(cat);
                    if (cat === "ALL") {
                      setActiveMaxPrice(null);
                      setPriceBracket("all");
                      router.replace("/products", { scroll: false });
                    } else if (cat === "Under ₹1,299") {
                      setActiveMaxPrice(1299);
                      setPriceBracket("under-1299");
                      router.replace("/products?maxPrice=1299", { scroll: false });
                    } else {
                      setActiveMaxPrice(null);
                      if (priceBracket === "under-1299") setPriceBracket("all");
                      router.replace(`/products?category=${encodeURIComponent(cat)}`, { scroll: false });
                    }
                  }}
                  className="luxury-pill-tab"
                  style={{
                    padding: "9px 18px",
                    borderRadius: "24px",
                    fontSize: "12px",
                    fontWeight: isActive ? 600 : 500,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    backgroundColor: isActive ? "#261B13" : "#FFFFFF",
                    color: isActive ? "#FAF7F2" : "#5A4535",
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
                  <span style={{ fontSize: "11px", opacity: isActive ? 0.9 : 0.65 }}>({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Search, Filter Toggle & Sort Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: isFiltersOpen ? "16px" : "24px",
            paddingBottom: "16px",
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
              padding: "0 14px",
              height: "42px",
              flex: "1 1 260px",
              maxWidth: "380px",
              boxShadow: "0 2px 8px rgba(38, 27, 19, 0.03)",
            }}
          >
            <SearchIcon size={16} color="#6A584B" />
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
                type="button"
                aria-label="Clear search"
                onClick={() => setSearchQuery("")}
                style={{ color: "#6A584B", cursor: "pointer", padding: "2px", display: "flex" }}
              >
                <CloseIcon size={14} color="#6A584B" />
              </button>
            )}
          </div>

          {/* Right Controls: Filters Toggle + Result Count + Sort */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", color: "#6A584B", fontWeight: 500 }}>
              Showing <strong style={{ color: "#261B13" }}>{processedProducts.length}</strong> of {products.length}
            </span>

            <button
              type="button"
              className="catalog-filters-btn"
              onClick={() => setIsFiltersOpen((prev) => !prev)}
              aria-expanded={isFiltersOpen}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "9px 15px",
                minHeight: "40px",
                borderRadius: "20px",
                backgroundColor: isFiltersOpen || activeFacetCount > 0 ? "#261B13" : "#FFFFFF",
                color: isFiltersOpen || activeFacetCount > 0 ? "#FAF7F2" : "#261B13",
                border: "1px solid #CFBEAD",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <SlidersIcon size={14} color={isFiltersOpen || activeFacetCount > 0 ? "#ECC880" : "#866951"} />
              <span>Filters{activeFacetCount > 0 ? ` (${activeFacetCount})` : ""}</span>
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <label htmlFor="catalog-sort-select" className="sr-only">
                Sort products
              </label>
              <select
                id="catalog-sort-select"
                className="catalog-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "featured" | "bestsellers" | "newest" | "price-asc" | "price-desc")}
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #CFBEAD",
                  borderRadius: "20px",
                  minHeight: "40px",
                  padding: "8px 14px",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "#261B13",
                  cursor: "pointer",
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
          </div>
        </div>

        {/* 2B. Collapsible Faceted Filter Bar */}
        {isFiltersOpen && (
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E6DACF",
              borderRadius: "16px",
              padding: "18px 20px",
              marginBottom: "22px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
              gap: "16px",
              alignItems: "end",
              boxShadow: "0 8px 24px rgba(38, 27, 19, 0.05)",
              animation: "fadeIn 0.2s ease both",
            }}
          >
            <div>
              <label htmlFor="filter-occasion" style={{ display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#5A4535", marginBottom: "6px" }}>
                Occasion
              </label>
              <select
                id="filter-occasion"
                value={activeOccasion || ""}
                onChange={(e) => setActiveOccasion(e.target.value || null)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "10px",
                  border: "1px solid #CFBEAD",
                  backgroundColor: "#FAF7F2",
                  fontSize: "12.5px",
                  color: "#261B13",
                }}
              >
                <option value="">All Occasions</option>
                {OCCASIONS_LIST.map((occ) => (
                  <option key={occ.id} value={occ.slug}>
                    {occ.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filter-price" style={{ display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#5A4535", marginBottom: "6px" }}>
                Price Range
              </label>
              <select
                id="filter-price"
                value={priceBracket}
                onChange={(e) => {
                  const val = e.target.value as PriceBracket;
                  setPriceBracket(val);
                  if (val !== "under-1299") setActiveMaxPrice(null);
                }}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "10px",
                  border: "1px solid #CFBEAD",
                  backgroundColor: "#FAF7F2",
                  fontSize: "12.5px",
                  color: "#261B13",
                }}
              >
                <option value="all">All Prices</option>
                <option value="under-1299">Up to ₹1,299</option>
                <option value="1300-4999">₹1,300 – ₹4,999</option>
                <option value="5000-14999">₹5,000 – ₹14,999</option>
                <option value="15000-plus">₹15,000+ Couture</option>
              </select>
            </div>

            {fabricOptions.length > 0 && (
              <div>
                <label htmlFor="filter-fabric" style={{ display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#5A4535", marginBottom: "6px" }}>
                  Fabric &amp; Weave
                </label>
                <select
                  id="filter-fabric"
                  value={selectedFabric}
                  onChange={(e) => setSelectedFabric(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "10px",
                    border: "1px solid #CFBEAD",
                    backgroundColor: "#FAF7F2",
                    fontSize: "12.5px",
                    color: "#261B13",
                  }}
                >
                  <option value="all">All Fabrics</option>
                  {fabricOptions.map((fab) => (
                    <option key={fab} value={fab}>
                      {fab}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", paddingBottom: "4px" }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "12.5px", fontWeight: 600, color: "#261B13", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  className="avsaraa-checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                />
                <span>In Stock Only</span>
              </label>

              {activeFacetCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  style={{
                    fontSize: "11.5px",
                    fontWeight: 600,
                    color: "#8A181A",
                    textDecoration: "underline",
                    cursor: "pointer",
                  }}
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        )}

        {/* Active Filter Chips */}
        {activeFacetCount > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
              marginBottom: "22px",
              padding: "10px 14px",
              backgroundColor: "#F2EBE3",
              borderRadius: "12px",
              border: "1px solid #E2D7CC",
            }}
          >
            <span style={{ fontSize: "11.5px", fontWeight: 600, color: "#5A4535", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Active:
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
                  aria-label="Remove occasion filter"
                  onClick={() => {
                    setActiveOccasion(null);
                    router.replace("/products", { scroll: false });
                  }}
                  style={{ color: "#C4AB94", display: "flex", alignItems: "center" }}
                >
                  <CloseIcon size={12} color="#C4AB94" />
                </button>
              </span>
            )}

            {(activeMaxPrice !== null || priceBracket !== "all") && (
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
                <span>
                  {activeMaxPrice !== null
                    ? `Up to ₹${activeMaxPrice.toLocaleString("en-IN")}`
                    : priceBracket === "under-1299"
                    ? "Up to ₹1,299"
                    : priceBracket === "1300-4999"
                    ? "₹1,300 – ₹4,999"
                    : priceBracket === "5000-14999"
                    ? "₹5,000 – ₹14,999"
                    : "₹15,000+"}
                </span>
                <button
                  type="button"
                  aria-label="Remove price filter"
                  onClick={() => {
                    setActiveMaxPrice(null);
                    setPriceBracket("all");
                    router.replace("/products", { scroll: false });
                  }}
                  style={{ color: "#D4EDDA", display: "flex", alignItems: "center" }}
                >
                  <CloseIcon size={12} color="#D4EDDA" />
                </button>
              </span>
            )}

            {selectedFabric !== "all" && (
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
                <span>Fabric: {selectedFabric}</span>
                <button
                  type="button"
                  aria-label="Remove fabric filter"
                  onClick={() => setSelectedFabric("all")}
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <CloseIcon size={12} color="#6A584B" />
                </button>
              </span>
            )}

            {inStockOnly && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 10px",
                  borderRadius: "16px",
                  backgroundColor: "#FFFFFF",
                  color: "#1E5E3A",
                  border: "1px solid #C4D9CC",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                <span>In Stock Only</span>
                <button
                  type="button"
                  aria-label="Remove stock filter"
                  onClick={() => setInStockOnly(false)}
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <CloseIcon size={12} color="#1E5E3A" />
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
                  aria-label="Clear search filter"
                  onClick={() => setSearchQuery("")}
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <CloseIcon size={12} color="#6A584B" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={clearAllFilters}
              style={{
                marginLeft: "auto",
                fontSize: "11.5px",
                color: "#8A181A",
                textDecoration: "underline",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Clear All
            </button>
          </div>
        )}

        {/* 3. Products Grid / Skeleton / Empty State */}
        {loading ? (
          <div className="responsive-product-grid">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "16px",
                  border: "1px solid #E8DED3",
                  overflow: "hidden",
                  height: "410px",
                }}
              >
                <div
                  style={{
                    height: "300px",
                    background: "linear-gradient(90deg, #F0E6DC 0%, #E6DACF 50%, #F0E6DC 100%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 2s infinite ease-in-out",
                  }}
                />
                <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ width: "75%", height: "14px", backgroundColor: "#E6DACF", borderRadius: "4px" }} />
                  <div style={{ width: "45%", height: "16px", backgroundColor: "#E6DACF", borderRadius: "4px" }} />
                </div>
              </div>
            ))}
          </div>
        ) : processedProducts.length === 0 ? (
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px dashed #D4C3B3",
              borderRadius: "24px",
              padding: "56px 24px",
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
              No Pieces Match Your Selection
            </h3>
            <p
              style={{
                fontSize: "13.5px",
                color: "#6A584B",
                maxWidth: "420px",
                margin: "0 auto 24px auto",
                lineHeight: 1.6,
              }}
            >
              Try broadening your filters or clearing your search to explore our full handloom collection.
            </p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="avsaraa-btn-outline"
              style={{
                height: "44px",
                padding: "0 24px",
                fontSize: "12px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                backgroundColor: "#FFFFFF",
                maxWidth: "240px",
                margin: "0 auto",
              }}
            >
              View Full Collection →
            </button>
          </div>
        ) : (
          <div className="responsive-product-grid">
            {processedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={openQuickView}
              />
            ))}
          </div>
        )}
      </div>

      {/* Upgraded Quick View Modal with Variant Selection & Direct Add to Bag */}
      {isMountedClient &&
        selectedProduct &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Quick view: ${selectedProduct.name}`}
            className="quickview-dialog-backdrop"
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(20, 13, 8, 0.78)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 99999,
              padding: "16px",
              animation: "fadeIn 0.25s ease both",
            }}
            onClick={() => setSelectedProduct(null)}
          >
            <div
              ref={quickViewRef}
              className="quickview-dialog-panel"
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: "#FAF7F2",
                border: "1px solid #E6DACF",
                borderRadius: "24px",
                padding: "24px",
                maxWidth: "780px",
                width: "100%",
                maxHeight: "92dvh",
                overflowY: "auto",
                boxShadow: "0 25px 60px rgba(0,0,0,0.35)",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "24px",
                position: "relative",
                animation: "fadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both",
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                aria-label="Close quick view modal"
                style={{
                  position: "absolute",
                  top: "14px",
                  right: "14px",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "#F2EBE3",
                  border: "1px solid #E2D7CC",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 2,
                }}
              >
                <CloseIcon size={16} color="#261B13" />
              </button>

              {/* Left Image */}
              <div
                className="quickview-image-box"
                style={{
                  position: "relative",
                  minHeight: "340px",
                  aspectRatio: "3 / 4",
                  borderRadius: "16px",
                  overflow: "hidden",
                  backgroundColor: "#F2EBE3",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                }}
              >
                <Image
                  src={
                    resolveProductImage(
                      selectedProduct.color_variants?.find((v) => v.name === quickViewColor)?.image_url ||
                        selectedProduct.image_url
                    ) || DEFAULT_FALLBACK_IMAGE
                  }
                  alt={selectedProduct.name}
                  fill
                  sizes="380px"
                  style={{ objectFit: "cover", objectPosition: "center 20%" }}
                />
                <span
                  style={{
                    position: "absolute",
                    top: "12px",
                    left: "12px",
                    backgroundColor: "rgba(38, 27, 19, 0.85)",
                    color: "#ECC880",
                    padding: "4px 12px",
                    borderRadius: "14px",
                    fontSize: "10.5px",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {selectedProduct.category}
                </span>
              </div>

              {/* Right Details + Variant Picker */}
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "14px" }}>
                <div>
                  <span className="luxury-badge" style={{ marginBottom: "8px" }}>
                    ✦ AVSARAA ATELIER
                  </span>
                  <h3
                    style={{
                      fontFamily: "var(--font-serif), Georgia, serif",
                      fontSize: "24px",
                      fontWeight: 600,
                      color: "#261B13",
                      marginBottom: "6px",
                      lineHeight: 1.2,
                    }}
                  >
                    {selectedProduct.name}
                  </h3>

                  <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "21px", fontWeight: 700, color: "#261B13" }}>
                      {formatINR(selectedProduct.price)}
                    </span>
                    {selectedProduct.mrp && selectedProduct.mrp > selectedProduct.price && (
                      <span style={{ fontSize: "14px", color: "#6A584B", textDecoration: "line-through" }}>
                        {formatINR(selectedProduct.mrp)}
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "#6A584B",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      marginBottom: "14px",
                    }}
                  >
                    Inclusive of all taxes • Free Pan-India delivery ₹799+
                  </p>

                  <p style={{ fontSize: "13px", color: "#543E2E", lineHeight: 1.6, marginBottom: "16px" }}>
                    {selectedProduct.description || "Handcrafted pure silk with delicate handwork and timeless elegance."}
                  </p>

                  {/* Quick Color Swatch Picker */}
                  {selectedProduct.color_variants && selectedProduct.color_variants.length > 0 && (
                    <div style={{ marginBottom: "14px" }}>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "#261B13", marginBottom: "6px" }}>
                        Shade: <span style={{ fontWeight: 400, color: "#6A584B" }}>{quickViewColor}</span>
                      </div>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {selectedProduct.color_variants.map((v) => {
                          const active = quickViewColor === v.name;
                          return (
                            <button
                              key={v.name}
                              type="button"
                              onClick={() => setQuickViewColor(v.name)}
                              aria-label={`Select shade ${v.name}`}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "5px 10px",
                                borderRadius: "20px",
                                border: active ? "1.5px solid #261B13" : "1px solid #D8CABE",
                                backgroundColor: active ? "#F3ECE1" : "#FFFFFF",
                                fontSize: "11.5px",
                                fontWeight: active ? 600 : 500,
                              }}
                            >
                              <span
                                style={{
                                  width: "12px",
                                  height: "12px",
                                  borderRadius: "50%",
                                  backgroundColor: v.hex,
                                  border: "1px solid rgba(0,0,0,0.2)",
                                }}
                              />
                              <span>{v.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Quick Size Selector */}
                  <div style={{ marginBottom: "14px" }}>
                    <div style={{ fontSize: "12px", fontWeight: 600, color: "#261B13", marginBottom: "6px" }}>
                      Size: <span style={{ fontWeight: 400, color: "#6A584B" }}>{quickViewSize}</span>
                    </div>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {(selectedProduct.available_sizes && selectedProduct.available_sizes.length > 0
                        ? selectedProduct.available_sizes
                        : selectedProduct.category === "Sarees"
                        ? ["Free Size (5.5m + 0.8m Blouse)"]
                        : ["XS", "S", "M", "L", "XL"]
                      ).map((sz) => {
                        const active = quickViewSize === sz;
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setQuickViewSize(sz)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "8px",
                              border: active ? "1.5px solid #261B13" : "1px solid #D8CABE",
                              backgroundColor: active ? "#261B13" : "#FFFFFF",
                              color: active ? "#FAF7F2" : "#261B13",
                              fontSize: "12px",
                              fontWeight: 600,
                            }}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={handleQuickViewAddToBag}
                    disabled={selectedProduct.stock_count === 0}
                    className="avsaraa-btn-primary btn-shine"
                    style={{
                      height: "46px",
                      fontSize: "12.5px",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      borderRadius: "24px",
                      backgroundColor: quickViewAdded ? "#1E5E3A" : "#261B13",
                    }}
                  >
                    {quickViewAdded ? (
                      <>
                        <CheckIcon size={15} color="#FFFFFF" />
                        <span>Added to Bag</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBagIcon size={16} color="#FAF7F2" />
                        <span>
                          {selectedProduct.stock_count === 0 ? "Out of Stock" : "Add to Bag"}
                        </span>
                      </>
                    )}
                  </button>

                  <Link
                    href={`/products/${selectedProduct.id}${quickViewColor ? `?color=${encodeURIComponent(quickViewColor)}` : ""}`}
                    onClick={() => setSelectedProduct(null)}
                    className="avsaraa-btn-outline"
                    style={{
                      height: "44px",
                      fontSize: "12px",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      backgroundColor: "#FFFFFF",
                      borderRadius: "22px",
                      border: "1px solid #CFBEAD",
                      color: "#261B13",
                    }}
                  >
                    <span>View Full Details &amp; Size Guide →</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </section>
  );
}
