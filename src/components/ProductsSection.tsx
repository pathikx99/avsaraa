"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Product, ProductCategory } from "@/types/product";
import { ShoppingBagIcon, WhatsAppIcon } from "./Icons";
import { useCart } from "@/context/CartContext";
import type { User } from "@supabase/supabase-js";

interface ProductsSectionProps {
  initialCategory?: ProductCategory | "ALL";
  showHeader?: boolean;
}

const DEFAULT_FALLBACK_IMAGE = "/images/banarasi_silk_saree.jpg";

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Pure Banarasi Katan Silk Saree",
    category: "Sarees",
    price: 18500,
    image_url: "/images/banarasi_silk_saree.jpg",
    description: "Hand-loomed in Varanasi with authentic gold zari floral jaal, finished with heritage border.",
    created_at: new Date().toISOString(),
  },
  {
    id: "prod-2",
    name: "Emerald Royal Organza Saree",
    category: "Sarees",
    price: 14200,
    image_url: "/images/royal_organza_saree.jpg",
    description: "Sheer tissue organza drape in jewel emerald with delicate hand-embroidered scallop borders.",
    created_at: new Date().toISOString(),
  },
  {
    id: "prod-3",
    name: "Heritage Silk Anarkali Gown",
    category: "Dresses",
    price: 16800,
    image_url: "/images/royal_occasion_dress.jpg",
    description: "Floor-length raw silk flare adorned with regal dabka and gota patti artisan embroidery.",
    created_at: new Date().toISOString(),
  },
  {
    id: "prod-4",
    name: "Festive Chanderi Kurta Set",
    category: "Dresses",
    price: 9800,
    image_url: "/images/festive_chanderi_dress.jpg",
    description: "Breathable pure Chanderi silk with hand block-printed motifs and zari-threaded dupatta.",
    created_at: new Date().toISOString(),
  },
  {
    id: "prod-5",
    name: "Royal Zari Bridal Drape",
    category: "Occasion Wear",
    price: 24500,
    image_url: "/images/saree_model_hero.jpg",
    description: "Masterpiece festive weave featuring pure metallic zari embellishments and rich pallu craft.",
    created_at: new Date().toISOString(),
  },
  {
    id: "prod-6",
    name: "Surat Handloom Tissue Saree",
    category: "New Arrivals",
    price: 12900,
    image_url: "/images/account_hero.jpg",
    description: "Modern metallic sheen handloom drape woven in Surat with refined lightweight texture.",
    created_at: new Date().toISOString(),
  },
];

export default function ProductsSection({
  initialCategory = "ALL",
  showHeader = true,
}: ProductsSectionProps) {
  const { addToCart } = useCart();
  const [activeCategory, setActiveCategory] = useState<ProductCategory | "ALL">(initialCategory);
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [user, setUser] = useState<User | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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

    // Load products strictly from Supabase database; fallback to curated collection
    void supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .then(
        ({ data, error }) => {
          if (!isMounted) return;
          if (error || !data || data.length === 0) {
            setProducts(DEFAULT_PRODUCTS);
          } else {
            setProducts(data);
          }
        },
        () => {
          if (isMounted) setProducts(DEFAULT_PRODUCTS);
        }
      );

    // Read category from URL query parameters (e.g. ?category=Sarees) or hash
    const syncCategoryFromUrl = () => {
      if (typeof window === "undefined") return;
      const urlParams = new URLSearchParams(window.location.search);
      const categoryQuery = urlParams.get("category");

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

  const filteredProducts = activeCategory === "ALL"
    ? products
    : products.filter((p) => p.category === activeCategory);

  const categoriesList: (ProductCategory | "ALL")[] = [
    "ALL",
    "Sarees",
    "Dresses",
    "New Arrivals",
    "Occasion Wear",
  ];

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
      <div style={{ maxWidth: "1140px", margin: "0 auto" }}>
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
            <div style={{ width: "48px", height: "1.5px", backgroundColor: "#C4AB94", margin: "0 auto 16px auto" }} />
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

        {/* Categories Bar & Add Product Action */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "36px",
            paddingBottom: "16px",
            borderBottom: "1px solid #EAE0D5",
          }}
        >
          {/* Category Tabs */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
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

          {/* Atelier Concierge Inquiries */}
          <div>
            <Link
              href="/contact"
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
              <span>✦ Custom Tailoring & Inquiries →</span>
            </Link>
          </div>
        </div>

        {/* Products Grid or Empty State */}
        {filteredProducts.length === 0 ? (
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
              No Products in {activeCategory === "ALL" ? "Collection" : activeCategory} Yet
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
              All handcrafted pieces added to your database will appear here in real time.
            </p>
            <button
              type="button"
              onClick={() => setActiveCategory("ALL")}
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
              Explore All Pieces →
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
              gap: "32px",
            }}
          >
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="luxury-hover-card"
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
                  className="luxury-image-zoom-container"
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

                  {/* Quick View Button on Image */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProduct(product);
                    }}
                    style={{
                      position: "absolute",
                      bottom: "14px",
                      right: "14px",
                      backgroundColor: "rgba(250, 247, 242, 0.92)",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      color: "#261B13",
                      padding: "6px 14px",
                      borderRadius: "16px",
                      fontSize: "11px",
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      border: "1px solid rgba(196, 171, 148, 0.6)",
                      cursor: "pointer",
                      boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                    }}
                  >
                    Quick View ↗
                  </button>
                </div>

                {/* Product Info */}
                <div style={{ padding: "20px 20px 24px 20px", display: "flex", flexDirection: "column", flex: 1 }}>
                  <h3
                    onClick={() => setSelectedProduct(product)}
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
                      gap: "12px",
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
                          style={{
                            display: "block",
                            fontSize: "18px",
                            fontWeight: 700,
                            color: "#261B13",
                            fontFamily: "var(--font-sans)",
                            lineHeight: 1.1,
                          }}
                        >
                          ₹{product.price.toLocaleString("en-IN")}
                        </span>
                        <span style={{ fontSize: "10.5px", color: "#8E7D70", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          Handcrafted • Free Delivery
                        </span>
                      </div>

                      <a
                        href={`https://wa.me/919825012345?text=${encodeURIComponent(
                          `Hello Avsaraa, I am inquiring about "${product.name}" (₹${product.price.toLocaleString("en-IN")}) from the ${product.category} collection.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          color: "#6E5B4E",
                          fontSize: "11.5px",
                          fontWeight: 600,
                          textDecoration: "underline",
                          textUnderlineOffset: "3px",
                        }}
                      >
                        <span>Inquire</span>
                        <span>↗</span>
                      </a>
                    </div>

                    {/* Add to Bag Action Button (Gated to login) */}
                    <button
                      type="button"
                      onClick={() => addToCart(product)}
                      className="avsaraa-btn-primary"
                      style={{
                        height: "40px",
                        fontSize: "11.5px",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        borderRadius: "20px",
                        width: "100%",
                      }}
                    >
                      <ShoppingBagIcon size={14} color="#FAF7F2" />
                      <span>Add to Bag</span>
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
            backgroundColor: "rgba(38, 27, 19, 0.7)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setSelectedProduct(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#FAF7F2",
              border: "1px solid #E6DACF",
              borderRadius: "24px",
              padding: "28px",
              maxWidth: "760px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "28px",
              position: "relative",
            }}
          >
            <button
              onClick={() => setSelectedProduct(null)}
              style={{
                position: "absolute",
                top: "16px",
                right: "18px",
                fontSize: "22px",
                color: "#8E7D70",
                cursor: "pointer",
                background: "none",
                border: "none",
                zIndex: 2,
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
                <p style={{ fontSize: "11.5px", color: "#8E7D70", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "18px" }}>
                  Inclusive of all taxes • Free delivery across India
                </p>

                <div style={{ width: "40px", height: "1px", backgroundColor: "#C4AB94", marginBottom: "18px" }} />

                <p style={{ fontSize: "14px", color: "#543E2E", lineHeight: 1.7, marginBottom: "22px" }}>
                  {selectedProduct.description || "Handcrafted pure silk with delicate handwork and timeless elegance."}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12.5px", color: "#6E5B4E", marginBottom: "24px" }}>
                  <div>✦ <strong>Category:</strong> {selectedProduct.category}</div>
                  <div>✦ <strong>Authenticity:</strong> 100% Handcrafted Indian Silk</div>
                  <div>✦ <strong>Finishing & Delivery:</strong> Hand-checked at Surat Studio • Delivered Across India</div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {/* Add to Shopping Bag Button (Gated to login) */}
                <button
                  type="button"
                  onClick={() => {
                    const added = addToCart(selectedProduct);
                    if (added) setSelectedProduct(null);
                  }}
                  className="avsaraa-btn-primary"
                  style={{
                    height: "48px",
                    fontSize: "13px",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <ShoppingBagIcon size={16} color="#FAF7F2" />
                  <span>Add to Shopping Bag</span>
                </button>

                <a
                  href={`https://wa.me/919825012345?text=${encodeURIComponent(
                    `Hello Avsaraa, I would like to inquire about and order "${selectedProduct.name}" (₹${selectedProduct.price.toLocaleString("en-IN")}).`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
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
                  }}
                >
                  <WhatsAppIcon size={18} color="#25D366" />
                  <span>Inquire on WhatsApp</span>
                </a>

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
