"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { Product } from "@/types/product";
import { ShoppingBagIcon, WhatsAppIcon } from "@/components/Icons";

const SPOTLIGHT_PRODUCTS: Product[] = [
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
];

export default function HomePage() {
  const { addToCart } = useCart();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#F7F2EE",
      }}
    >
      {/* 1. Header & Announcement Bar */}
      <Header />

      {/* 2. Hero Section (Luxury Editorial Brand Showcase) */}
      <section
        style={{
          position: "relative",
          backgroundColor: "#FAF7F2",
          borderBottom: "1px solid #E6DACF",
          overflow: "hidden",
          padding: "70px 24px 80px 24px",
        }}
      >
        {/* Corner Botanical Flourish */}
        <div
          style={{
            position: "absolute",
            left: "-40px",
            top: "-40px",
            width: "240px",
            height: "240px",
            pointerEvents: "none",
            opacity: 0.4,
            zIndex: 0,
          }}
        >
          <Image
            src="/images/botanical_flowers.jpg"
            alt=""
            fill
            sizes="240px"
            style={{ objectFit: "contain", mixBlendMode: "multiply" }}
          />
        </div>

        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "48px",
            alignItems: "center",
          }}
        >
          {/* Left Column: Brand Essence */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              textAlign: "left",
            }}
          >
            <div style={{ marginBottom: "18px" }}>
              <span className="luxury-badge">
                ✦ BASED IN SURAT • SHOP ONLINE ACROSS INDIA ✦
              </span>
            </div>

            <h1
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "clamp(46px, 6.5vw, 76px)",
                fontWeight: 500,
                color: "#261B13",
                lineHeight: 1.05,
                letterSpacing: "0.05em",
                marginBottom: "14px",
              }}
            >
              AVSARAA
            </h1>

            <p
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "clamp(22px, 3.2vw, 32px)",
                fontStyle: "italic",
                color: "#6E523D",
                lineHeight: 1.25,
                marginBottom: "20px",
              }}
            >
              Thoughtfully chosen. Beautifully worn.
            </p>

            <div style={{ width: "56px", height: "1.5px", backgroundColor: "#C4AB94", marginBottom: "20px" }} />

            <p
              style={{
                fontSize: "15.5px",
                lineHeight: 1.8,
                color: "#5C4A3E",
                marginBottom: "28px",
                maxWidth: "520px",
              }}
            >
              Handcrafted Indian sarees and silks from Banaras, Chanderi, and Bengal. Simple, timeless, and made with care for your special moments.
            </p>

            {/* Handloom Provenance Tags */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                marginBottom: "34px",
              }}
            >
              {["Banarasi Katan Silk", "Chanderi Handloom", "Royal Zari Drapes"].map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: "11.5px",
                    color: "#866951",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E2D7CC",
                    borderRadius: "16px",
                    padding: "4px 12px",
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                  }}
                >
                  ✦ {tag}
                </span>
              ))}
            </div>

            {/* Core Action Buttons - Navigate to Separate Pages */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", width: "100%" }}>
              <Link
                href="/collection"
                className="avsaraa-btn-primary"
                style={{
                  display: "inline-flex",
                  width: "auto",
                  padding: "0 34px",
                  height: "52px",
                  fontSize: "13px",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                }}
              >
                <span>Explore Collection</span>
                <span>→</span>
              </Link>

              <Link
                href="/about"
                className="avsaraa-btn-outline"
                style={{
                  display: "inline-flex",
                  width: "auto",
                  padding: "0 28px",
                  height: "52px",
                  fontSize: "13px",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  backgroundColor: "#FFFFFF",
                  textDecoration: "none",
                }}
              >
                <span>Our Story</span>
                <span>→</span>
              </Link>
            </div>

            {/* Trust Micro-bar */}
            <div
              style={{
                marginTop: "32px",
                paddingTop: "20px",
                borderTop: "1px solid #EAE0D5",
                display: "flex",
                flexWrap: "wrap",
                gap: "18px",
                fontSize: "12px",
                color: "#8E7D70",
              }}
            >
              <span>✦ Free Delivery in India</span>
              <span>•</span>
              <span>✦ 100% Handloom Guarantee</span>
              <span>•</span>
              <span>✦ WhatsApp Concierge</span>
            </div>
          </div>

          {/* Right Column: Royal Arch Fashion Portrait */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <div
              className="luxury-arch-frame"
              style={{
                position: "relative",
                width: "100%",
                maxWidth: "440px",
                height: "clamp(440px, 50vw, 560px)",
                backgroundColor: "#EFE6DC",
              }}
            >
              <Image
                src="/images/royal_organza_saree.jpg"
                alt="Avsaraa Handcrafted Royal Silk Saree"
                fill
                priority
                sizes="(min-width: 900px) 440px, 90vw"
                style={{ objectFit: "cover", objectPosition: "center 20%" }}
              />

              {/* Season Pill */}
              <div
                style={{
                  position: "absolute",
                  top: "22px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: "rgba(38, 27, 19, 0.88)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  color: "#FAF7F2",
                  padding: "6px 16px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  boxShadow: "0 4px 18px rgba(0,0,0,0.2)",
                  whiteSpace: "nowrap",
                  zIndex: 2,
                  border: "1px solid rgba(196, 171, 148, 0.35)",
                }}
              >
                ✦ Festive 2026 Edition ✦
              </div>

              {/* Bottom Atelier Preview Card */}
              <div
                style={{
                  position: "absolute",
                  bottom: "16px",
                  left: "16px",
                  right: "16px",
                  backgroundColor: "rgba(250, 247, 242, 0.94)",
                  backdropFilter: "blur(14px)",
                  WebkitBackdropFilter: "blur(14px)",
                  border: "1px solid rgba(196, 171, 148, 0.55)",
                  borderRadius: "16px",
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                  boxShadow: "0 10px 30px rgba(38, 27, 19, 0.15)",
                  zIndex: 2,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: "10px", color: "#866951", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                    HANDWOVEN SILK
                  </span>
                  <span style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "16px", color: "#261B13", fontWeight: 600, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden", display: "block" }}>
                    Emerald Tissue Organza
                  </span>
                </div>
                <Link
                  href="/collection?category=Sarees"
                  style={{
                    backgroundColor: "#261B13",
                    color: "#FAF7F2",
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    padding: "8px 14px",
                    borderRadius: "20px",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  View Drape →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Curated Spotlight Pieces (Highlights of the Collection) */}
      <section
        style={{
          backgroundColor: "#F7F2EE",
          padding: "80px 24px",
          borderBottom: "1px solid #E6DACF",
        }}
      >
        <div style={{ maxWidth: "1140px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <span className="luxury-badge" style={{ marginBottom: "14px" }}>
              ✦ SPOTLIGHT EDITIONS ✦
            </span>
            <h2
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "clamp(30px, 4vw, 42px)",
                fontWeight: 500,
                color: "#261B13",
                lineHeight: 1.15,
                marginBottom: "12px",
              }}
            >
              Curated Highlights
            </h2>
            <div style={{ width: "44px", height: "1.5px", backgroundColor: "#C4AB94", margin: "0 auto 16px auto" }} />
            <p style={{ fontSize: "14.5px", color: "#6E5B4E", maxWidth: "560px", margin: "0 auto", lineHeight: 1.65 }}>
              A handpicked selection from our artisan looms. Click to view details freely or add to your shopping bag.
            </p>
          </div>

          {/* 3-Column Spotlight Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "32px",
              marginBottom: "44px",
            }}
          >
            {SPOTLIGHT_PRODUCTS.map((product) => (
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
                {/* Image Frame */}
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
                    src={product.image_url}
                    alt={product.name}
                    fill
                    sizes="(min-width: 900px) 33vw, 100vw"
                    style={{ objectFit: "cover", objectPosition: "center 20%" }}
                  />

                  <div
                    style={{
                      position: "absolute",
                      top: "14px",
                      left: "14px",
                      backgroundColor: "rgba(38, 27, 19, 0.85)",
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
                    }}
                  >
                    Quick View ↗
                  </button>
                </div>

                {/* Info & Add to Bag */}
                <div style={{ padding: "20px", display: "flex", flexDirection: "column", flex: 1 }}>
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

                  <p style={{ fontSize: "12.5px", color: "#6E5B4E", lineHeight: 1.55, marginBottom: "16px", flex: 1 }}>
                    {product.description}
                  </p>

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
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                      <div>
                        <span style={{ display: "block", fontSize: "18px", fontWeight: 700, color: "#261B13" }}>
                          ₹{product.price.toLocaleString("en-IN")}
                        </span>
                        <span style={{ fontSize: "10.5px", color: "#8E7D70", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          Handcrafted • Free Delivery
                        </span>
                      </div>

                      <a
                        href={`https://wa.me/919825012345?text=${encodeURIComponent(
                          `Hello Avsaraa, I am inquiring about "${product.name}" (₹${product.price.toLocaleString("en-IN")}).`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: "11.5px",
                          fontWeight: 600,
                          color: "#6E5B4E",
                          textDecoration: "underline",
                          textUnderlineOffset: "3px",
                        }}
                      >
                        Inquire ↗
                      </a>
                    </div>

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

          {/* Link to Full Dedicated Collection Page */}
          <div style={{ textAlign: "center" }}>
            <Link
              href="/collection"
              className="avsaraa-btn-primary"
              style={{
                height: "50px",
                padding: "0 36px",
                fontSize: "13px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                textDecoration: "none",
              }}
            >
              <span>Explore The Entire Collection ({">"} Sarees, Dresses & More)</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Atelier Heritage Narrative Teaser (Links to /about) */}
      <section
        style={{
          backgroundColor: "#FAF7F2",
          padding: "70px 24px",
          borderBottom: "1px solid #E6DACF",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "780px", margin: "0 auto" }}>
          <span className="luxury-badge" style={{ marginBottom: "14px" }}>
            ✦ ROOTED IN SURAT ✦
          </span>
          <h2
            style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontSize: "clamp(28px, 3.8vw, 38px)",
              fontWeight: 500,
              color: "#261B13",
              lineHeight: 1.25,
              marginBottom: "16px",
            }}
          >
            Artisan Handlooms & Timeless Drapes
          </h2>
          <p
            style={{
              fontSize: "15px",
              color: "#5C4A3E",
              lineHeight: 1.8,
              marginBottom: "28px",
            }}
          >
            Every Avsaraa saree represents generations of weaving legacy. From Varanasi’s master zaris to Surat’s refined finishing, we bring genuine handlooms directly to your doorstep.
          </p>
          <Link
            href="/about"
            className="avsaraa-btn-outline"
            style={{
              height: "46px",
              padding: "0 28px",
              fontSize: "12.5px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              backgroundColor: "#FFFFFF",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              textDecoration: "none",
            }}
          >
            <span>Discover Our Craft & Story</span>
            <span>→</span>
          </Link>
        </div>
      </section>

      {/* 5. Bespoke Inquiries & Studio Concierge Teaser (Links to /contact) */}
      <section
        style={{
          backgroundColor: "#261B13",
          color: "#FAF7F2",
          padding: "60px 24px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <span
            className="luxury-badge"
            style={{
              marginBottom: "12px",
              backgroundColor: "rgba(196, 171, 148, 0.15)",
              color: "#E2D7CC",
              border: "1px solid rgba(196, 171, 148, 0.3)",
            }}
          >
            ✦ PERSONAL STYLING & SIZING ✦
          </span>
          <h3
            style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontSize: "28px",
              fontWeight: 500,
              color: "#FAF7F2",
              marginBottom: "12px",
            }}
          >
            Need Help Choosing Your Saree?
          </h3>
          <p
            style={{
              fontSize: "14px",
              color: "#D6C7B8",
              lineHeight: 1.7,
              marginBottom: "24px",
            }}
          >
            Our personal concierge is available to assist with drape inquiries, color matching, and custom blouse tailoring.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/contact"
              className="avsaraa-btn-primary"
              style={{
                height: "46px",
                padding: "0 26px",
                fontSize: "12.5px",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: "#FAF7F2",
                color: "#261B13",
              }}
            >
              <span>Contact Us</span>
              <span>→</span>
            </Link>
            <a
              href="https://wa.me/919825012345?text=Hello%20Avsaraa%2C%20I%20would%20like%20assistance%20with%20choosing%20a%20saree."
              target="_blank"
              rel="noopener noreferrer"
              className="avsaraa-btn-outline"
              style={{
                height: "46px",
                padding: "0 22px",
                fontSize: "12.5px",
                borderColor: "#866951",
                color: "#FAF7F2",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <WhatsAppIcon size={16} color="#25D366" />
              <span>WhatsApp Chat</span>
            </a>
          </div>
        </div>
      </section>

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
                src={selectedProduct.image_url}
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
                  {selectedProduct.description}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12.5px", color: "#6E5B4E", marginBottom: "24px" }}>
                  <div>✦ <strong>Category:</strong> {selectedProduct.category}</div>
                  <div>✦ <strong>Authenticity:</strong> 100% Handcrafted Indian Silk</div>
                  <div>✦ <strong>Delivery:</strong> Express Nationwide Handloom Shipping</div>
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
                    `Hello Avsaraa, I would like to inquire about "${selectedProduct.name}" (₹${selectedProduct.price.toLocaleString("en-IN")}).`
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

      {/* 6. Footer */}
      <Footer />
    </div>
  );
}
