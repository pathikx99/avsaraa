"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Product, ProductCategory } from "@/types/product";
import { SpinnerIcon, WhatsAppIcon } from "./Icons";
import type { User } from "@supabase/supabase-js";

interface ProductsSectionProps {
  initialCategory?: ProductCategory | "ALL";
}

const PRESET_IMAGES = [
  { label: "Banarasi Silk Saree", url: "/images/banarasi_silk_saree.jpg" },
  { label: "Emerald Organza Saree", url: "/images/royal_organza_saree.jpg" },
  { label: "Heritage Anarkali Gown", url: "/images/royal_occasion_dress.jpg" },
  { label: "Chanderi Dress", url: "/images/festive_chanderi_dress.jpg" },
  { label: "Royal Zari Bridal Drape", url: "/images/saree_model_hero.jpg" },
  { label: "Handloom Weave Texture", url: "/images/account_hero.jpg" },
];

export default function ProductsSection({ initialCategory = "ALL" }: ProductsSectionProps) {
  const [activeCategory, setActiveCategory] = useState<ProductCategory | "ALL">(initialCategory);
  const [products, setProducts] = useState<Product[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New product form state
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "Sarees" as ProductCategory,
    price: "",
    image_url: PRESET_IMAGES[0].url,
    description: "",
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3600);
  };

  // Load products strictly from Supabase database
  const fetchProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Database products query:", error.message);
        setProducts([]);
      } else if (data) {
        setProducts(data);
      }
    } catch {
      setProducts([]);
    }
  }, []);

  useEffect(() => {
    // Check auth
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    fetchProducts();

    // Listen to hash changes on URL (e.g. #products-sarees)
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.includes("sarees")) setActiveCategory("Sarees");
      else if (hash.includes("dresses")) setActiveCategory("Dresses");
      else if (hash.includes("new-arrivals")) setActiveCategory("New Arrivals");
      else if (hash.includes("occasion-wear")) setActiveCategory("Occasion Wear");
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [fetchProducts]);

  // Handle Add Product (Only available when logged in)
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      showToast("Only logged-in members can add products. Please sign in.");
      setShowAddModal(false);
      return;
    }

    if (!newProduct.name.trim() || !newProduct.price.trim()) {
      showToast("Please enter product name and price");
      return;
    }

    const priceNum = parseFloat(newProduct.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      showToast("Please enter a valid price");
      return;
    }

    setIsSubmitting(true);

    const productRecord = {
      name: newProduct.name.trim(),
      category: newProduct.category,
      price: priceNum,
      image_url: newProduct.image_url || PRESET_IMAGES[0].url,
      description: newProduct.description.trim() || null,
      user_id: user.id,
    };

    try {
      const { data, error } = await supabase
        .from("products")
        .insert([productRecord])
        .select()
        .single();

      if (error) {
        console.error("DB insert error:", error);
        showToast("Database error: " + (error.message || "Failed to save product"));
        return;
      }

      if (data) {
        setProducts((prev) => [data, ...prev]);
        showToast(`Added "${newProduct.name}" to database!`);
        setShowAddModal(false);
        setNewProduct({
          name: "",
          category: "Sarees",
          price: "",
          image_url: PRESET_IMAGES[0].url,
          description: "",
        });
      }
    } catch {
      showToast("Could not save product to database.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
        padding: "80px 24px 90px 24px",
        position: "relative",
        borderBottom: "1px solid #E6DACF",
      }}
    >
      {/* Anchors for smooth navigation from header/drawer */}
      <div id="products-sarees" style={{ position: "absolute", top: "-40px" }} />
      <div id="products-dresses" style={{ position: "absolute", top: "-40px" }} />
      <div id="products-new-arrivals" style={{ position: "absolute", top: "-40px" }} />
      <div id="products-occasion-wear" style={{ position: "absolute", top: "-40px" }} />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#261B13",
            color: "#FAF6F0",
            padding: "10px 24px",
            borderRadius: "10px",
            fontSize: "13px",
            zIndex: 1000,
            textAlign: "center",
            boxShadow: "0 8px 24px rgba(38, 27, 19, 0.35)",
            animation: "fadeIn 0.25s ease",
            maxWidth: "90vw",
          }}
        >
          {toastMessage}
        </div>
      )}

      <div style={{ maxWidth: "1140px", margin: "0 auto" }}>
        {/* Section Header */}
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

          {/* Add Product Button (Only when signed in) OR Sign In Prompt */}
          <div>
            {user ? (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="avsaraa-btn-primary"
                style={{
                  height: "44px",
                  padding: "0 22px",
                  fontSize: "12px",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  width: "auto",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>+ Add Product</span>
              </button>
            ) : (
              <Link
                href="/login"
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
                <span>Sign In to Add Products →</span>
              </Link>
            )}
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
            {user ? (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="avsaraa-btn-primary"
                style={{
                  height: "44px",
                  padding: "0 26px",
                  fontSize: "12px",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  width: "auto",
                }}
              >
                <span>+ Add Your First Piece</span>
              </button>
            ) : (
              <Link
                href="/login"
                className="avsaraa-btn-primary"
                style={{
                  height: "44px",
                  padding: "0 26px",
                  fontSize: "12px",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  textDecoration: "none",
                  width: "auto",
                }}
              >
                <span>Sign In to Add Pieces →</span>
              </Link>
            )}
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
                    src={product.image_url || PRESET_IMAGES[0].url}
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
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingTop: "14px",
                      borderTop: "1px solid #F0E8DF",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          display: "block",
                          fontSize: "17.5px",
                          fontWeight: 700,
                          color: "#261B13",
                          fontFamily: "var(--font-sans)",
                          lineHeight: 1.1,
                        }}
                      >
                        ₹{product.price.toLocaleString("en-IN")}
                      </span>
                      <span style={{ fontSize: "10px", color: "#8E7D70", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        Incl. all taxes
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
                        gap: "6px",
                        backgroundColor: "#FAF7F2",
                        border: "1px solid #CFBEAD",
                        color: "#261B13",
                        padding: "8px 14px",
                        borderRadius: "18px",
                        fontSize: "11.5px",
                        fontWeight: 600,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#25D366" }} />
                      <span>Inquire</span>
                    </a>
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
                src={selectedProduct.image_url || PRESET_IMAGES[0].url}
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
                <a
                  href={`https://wa.me/919825012345?text=${encodeURIComponent(
                    `Hello Avsaraa, I would like to inquire about and order "${selectedProduct.name}" (₹${selectedProduct.price.toLocaleString("en-IN")}).`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="avsaraa-btn-primary"
                  style={{ height: "48px", fontSize: "13px", gap: "8px" }}
                >
                  <WhatsAppIcon size={18} color="#25D366" />
                  <span>Inquire on WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="avsaraa-btn-outline"
                  style={{ height: "44px", fontSize: "12.5px" }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal (Only accessible when signed in) */}
      {showAddModal && user && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(38, 27, 19, 0.65)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#FAF7F2",
              border: "1px solid #E6DACF",
              borderRadius: "22px",
              padding: "30px 26px",
              maxWidth: "520px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "#866951", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", display: "block" }}>
                  MEMBER DEMO
                </span>
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "24px", color: "#261B13" }}>
                  Add Product
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ fontSize: "22px", color: "#8E7D70", cursor: "pointer", background: "none", border: "none" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddProduct} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#261B13", marginBottom: "4px" }}>
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pure Georgette Zari Saree"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  style={{ width: "100%", height: "44px", padding: "0 14px", borderRadius: "10px", border: "1px solid #CFBEAD", fontSize: "13.5px", backgroundColor: "#FFFFFF" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#261B13", marginBottom: "4px" }}>
                    Category *
                  </label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value as ProductCategory })}
                    style={{ width: "100%", height: "44px", padding: "0 12px", borderRadius: "10px", border: "1px solid #CFBEAD", fontSize: "13.5px", backgroundColor: "#FFFFFF" }}
                  >
                    <option value="Sarees">Sarees</option>
                    <option value="Dresses">Dresses</option>
                    <option value="New Arrivals">New Arrivals</option>
                    <option value="Occasion Wear">Occasion Wear</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#261B13", marginBottom: "4px" }}>
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="e.g. 12500"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    style={{ width: "100%", height: "44px", padding: "0 14px", borderRadius: "10px", border: "1px solid #CFBEAD", fontSize: "13.5px", backgroundColor: "#FFFFFF" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#261B13", marginBottom: "6px" }}>
                  Product Photo Choice *
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                  {PRESET_IMAGES.map((img) => {
                    const isSelected = newProduct.image_url === img.url;
                    return (
                      <div
                        key={img.url}
                        onClick={() => setNewProduct({ ...newProduct, image_url: img.url })}
                        style={{
                          position: "relative",
                          height: "75px",
                          borderRadius: "10px",
                          overflow: "hidden",
                          cursor: "pointer",
                          border: isSelected ? "2px solid #866951" : "1px solid #CFBEAD",
                          opacity: isSelected ? 1 : 0.65,
                        }}
                      >
                        <Image src={img.url} alt={img.label} fill sizes="80px" style={{ objectFit: "cover" }} />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#261B13", marginBottom: "4px" }}>
                  Short Description
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Handcrafted festive drape with intricate border details."
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid #CFBEAD",
                    fontSize: "13.5px",
                    backgroundColor: "#FFFFFF",
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="avsaraa-btn-outline"
                  style={{ flex: 1, height: "44px", fontSize: "13px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="avsaraa-btn-primary"
                  style={{ flex: 1, height: "44px", fontSize: "13px" }}
                >
                  {isSubmitting ? (
                    <>
                      <SpinnerIcon size={16} color="#FFFFFF" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    "Save Product →"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
