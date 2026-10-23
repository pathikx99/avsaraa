"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { Product } from "@/types/product";
import {
  ShoppingBagIcon,
  HeartIcon,
  LoomWeaveIcon,
  NeedleThreadIcon,
  DiamondCrownIcon,
  DeliveryVanIcon,
  WhatsAppIcon,
} from "@/components/Icons";
import { RevealSection } from "@/components/RevealSection";


const CURATED_SPOTLIGHT: Product[] = [
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

const WEAVE_CATEGORIES = [
  {
    name: "Banarasi Silks",
    origin: "Varanasi Atelier",
    image: "/images/banarasi_silk_saree.jpg",
    tag: "Pure Katan & Zari",
    href: "/collection?category=Sarees",
  },
  {
    name: "Tissue Organza",
    origin: "Surat Weaving Looms",
    image: "/images/royal_organza_saree.jpg",
    tag: "Sheer Scallop Drape",
    href: "/collection?category=Sarees",
  },
  {
    name: "Festive Dresses",
    origin: "Artisan Ensembles",
    image: "/images/royal_occasion_dress.jpg",
    tag: "Raw Silk & Gota Patti",
    href: "/collection?category=Dresses",
  },
  {
    name: "Handloom Chanderi",
    origin: "Madhya Pradesh Looms",
    image: "/images/festive_chanderi_dress.jpg",
    tag: "Gold Zari Border",
    href: "/collection?category=Dresses",
  },
];

const PATRON_REVIEWS = [
  {
    quote: "The Banarasi Katan silk saree arrived in the most exquisite heritage box. The zari work is unimaginably soft and authentic. Worth every rupee.",
    author: "Meera Singhania",
    city: "Mumbai",
    rating: 5,
    piece: "Banarasi Katan Silk",
  },
  {
    quote: "Avsaraa's concierge arranged a private video consultation to help me choose my bridal drape in Surat silk. The drape and fall pico were completed with sheer perfection.",
    author: "Ananya Desai",
    city: "Surat & London",
    rating: 5,
    piece: "Emerald Royal Organza",
  },
  {
    quote: "Received compliments all evening at my brother's wedding. Pure royal elegance without feeling overly heavy. Truly heirloom craftsmanship.",
    author: "Rituja Trivedi",
    city: "Delhi NCR",
    rating: 5,
    piece: "Heritage Silk Anarkali",
  },
];

export default function HomePage() {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);


  const handleQuickAdd = (product: Product) => {
    const success = addToCart(product);
    if (success) {
      setAddedId(product.id);
      setTimeout(() => setAddedId(null), 2000);
    }
  };

  return (
    <div
      className="page-enter"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#FAF7F2",
      }}
    >
      {/* 1. Header & Marquee Announcement */}
      <Header />

      {/* 2. Hero Section (Grand Royal Editorial Showcase) */}
      <section
        style={{
          position: "relative",
          backgroundColor: "#FAF7F2",
          borderBottom: "1px solid #E8DED3",
          overflow: "hidden",
          padding: "72px 24px 84px 24px",
        }}
        className="mobile-hero-padding"
      >
        {/* Subtle Luxury Radial Background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `radial-gradient(circle at 10% 20%, rgba(197, 160, 89, 0.08) 0%, transparent 45%),
                             radial-gradient(circle at 90% 80%, rgba(134, 105, 81, 0.06) 0%, transparent 50%)`,
            pointerEvents: "none",
          }}
        />

        {/* Botanical Flourish Corner Accent */}
        <div
          className="botanical-float"
          style={{
            position: "absolute",
            left: "-50px",
            top: "-50px",
            width: "260px",
            height: "260px",
            pointerEvents: "none",
            opacity: 0.35,
            zIndex: 0,
          }}
        >
          <Image
            src="/images/botanical_flowers.jpg"
            alt=""
            fill
            sizes="260px"
            style={{ objectFit: "contain", mixBlendMode: "multiply" }}
          />
        </div>

        <div
          style={{
            maxWidth: "1240px",
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "52px",
            alignItems: "center",
          }}
        >
          {/* Left Column: Royal Typography & Atelier Brand Essence */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              textAlign: "left",
            }}
          >
            {/* Gilded Heritage Badge */}
            <div style={{ marginBottom: "20px" }} className="hero-badge">
              <span
                className="luxury-badge"
                style={{
                  border: "1px solid rgba(197, 160, 89, 0.5)",
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  boxShadow: "0 2px 10px rgba(197, 160, 89, 0.15)",
                }}
              >
                ✦ SURAT ATELIER • PAN-INDIA HANDLOOM PREVIEWS ✦
              </span>
            </div>

            {/* Regal Heading */}
            <h1
              className="hero-title"
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "clamp(46px, 6.8vw, 80px)",
                fontWeight: 500,
                color: "#261B13",
                lineHeight: 1.04,
                letterSpacing: "0.06em",
                marginBottom: "14px",
              }}
            >
              AVSARAA
            </h1>

            {/* Italic Poetry */}
            <p
              className="hero-subtitle"
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "clamp(22px, 3.4vw, 34px)",
                fontStyle: "italic",
                color: "#866951",
                lineHeight: 1.25,
                marginBottom: "20px",
              }}
            >
              Wear The Moment. Beautifully Handwoven.
            </p>

            {/* Subtle Divider Hairline */}
            <div
              className="hero-body"
              style={{
                width: "60px",
                height: "1.5px",
                background: "linear-gradient(90deg, #C5A059, transparent)",
                marginBottom: "22px",
              }}
            />

            <p
              className="hero-body"
              style={{
                fontSize: "16px",
                lineHeight: 1.85,
                color: "#5C4A3E",
                marginBottom: "28px",
                maxWidth: "520px",
              }}
            >
              Handcrafted Indian sarees and silks from Varanasi, Chanderi, and Surat. Simple, timeless, and thoughtfully loomed for your cherished celebrations.
            </p>

            {/* Provenance Pills */}
            <div
              className="hero-body"
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                marginBottom: "36px",
              }}
            >
              {["Banarasi Katan Silk", "Tissue Organza", "Pure Chanderi", "Hand-Finished Zari"].map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: "11.5px",
                    color: "#6E523D",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E2D5C7",
                    borderRadius: "18px",
                    padding: "5px 14px",
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                    boxShadow: "0 2px 6px rgba(38, 27, 19, 0.03)",
                  }}
                >
                  ✦ {tag}
                </span>
              ))}
            </div>

            {/* Core Action Buttons */}
            <div
              className="hero-cta"
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "14px",
                width: "100%",
              }}
            >
              <Link
                href="/collection"
                className="avsaraa-btn-primary btn-shine"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  padding: "0 34px",
                  height: "52px",
                  fontSize: "13px",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  backgroundColor: "#261B13",
                  color: "#FAF7F2",
                  borderRadius: "26px",
                  boxShadow: "0 6px 20px rgba(38, 27, 19, 0.25)",
                }}
              >
                <span>Explore The Atelier</span>
                <span>→</span>
              </Link>

              <Link
                href="/about"
                className="avsaraa-btn-outline"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  padding: "0 30px",
                  height: "52px",
                  fontSize: "13px",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #CFBEAD",
                  color: "#261B13",
                  borderRadius: "26px",
                  textDecoration: "none",
                  transition: "all 0.25s ease",
                }}
              >
                <span>Our Heritage</span>
                <span>→</span>
              </Link>
            </div>

            {/* Trust Micro-bar */}
            <div
              className="hero-trust"
              style={{
                marginTop: "36px",
                paddingTop: "20px",
                borderTop: "1px solid #EAE0D5",
                display: "flex",
                flexWrap: "wrap",
                gap: "20px",
                fontSize: "12px",
                color: "#8E7D70",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: "#C5A059" }}>✦</span> Free Delivery in India
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: "#C5A059" }}>✦</span> 100% Handloom Certified
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: "#C5A059" }}>✦</span> Private Drape Consultations
              </span>
            </div>
          </div>

          {/* Right Column: Royal Arch Fashion Drape */}
          <div
            className="hero-image"
            style={{
              display: "flex",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <div
              className="arch-top-frame"
              style={{
                position: "relative",
                width: "100%",
                maxWidth: "460px",
                height: "clamp(460px, 52vw, 580px)",
                backgroundColor: "#EFE6DC",
              }}
            >
              <Image
                src="/images/royal_organza_saree.jpg"
                alt="Avsaraa Handcrafted Royal Silk Saree"
                fill
                priority
                sizes="(min-width: 900px) 460px, 90vw"
                style={{ objectFit: "cover", objectPosition: "center 20%" }}
              />

              {/* Season Pill */}
              <div
                style={{
                  position: "absolute",
                  top: "24px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: "rgba(38, 27, 19, 0.9)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  color: "#FAF7F2",
                  padding: "6px 18px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
                  whiteSpace: "nowrap",
                  zIndex: 2,
                  border: "1px solid rgba(226, 190, 114, 0.5)",
                }}
              >
                ✦ Festive 2026 Collection ✦
              </div>

              {/* Bottom Frosted Atelier Preview Card */}
              <div
                style={{
                  position: "absolute",
                  bottom: "16px",
                  left: "16px",
                  right: "16px",
                  backgroundColor: "rgba(250, 247, 242, 0.94)",
                  backdropFilter: "blur(14px)",
                  WebkitBackdropFilter: "blur(14px)",
                  border: "1px solid rgba(197, 160, 89, 0.5)",
                  borderRadius: "18px",
                  padding: "14px 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  boxShadow: "0 12px 35px rgba(38, 27, 19, 0.16)",
                  zIndex: 2,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: "10px",
                      color: "#866951",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      fontWeight: 600,
                    }}
                  >
                    HANDWOVEN SILK
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-serif), Georgia, serif",
                      fontSize: "17px",
                      color: "#261B13",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                      display: "block",
                    }}
                  >
                    Emerald Tissue Organza
                  </span>
                </div>
                <Link
                  href="/collection?category=Sarees"
                  className="btn-shine"
                  style={{
                    backgroundColor: "#261B13",
                    color: "#FAF7F2",
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    padding: "9px 16px",
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

      {/* 3. The 4 Vows of Avsaraa (Luxury Trust Bar) */}
      <section
        style={{
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid #E8DED3",
          padding: "38px 24px",
          position: "relative",
        }}
      >
        <div
          style={{
            maxWidth: "1220px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "22px",
          }}
        >
          <div className="trust-pillar-card">
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                backgroundColor: "rgba(197, 160, 89, 0.12)",
                border: "1px solid rgba(197, 160, 89, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "14px",
              }}
            >
              <LoomWeaveIcon size={22} color="#866951" />
            </div>
            <h4
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "17px",
                fontWeight: 600,
                color: "#261B13",
                marginBottom: "6px",
              }}
            >
              100% Handloom Certified
            </h4>
            <p style={{ fontSize: "12.5px", color: "#6E5B4E", lineHeight: 1.6 }}>
              Authentic weaves sourced directly from master craft clusters in Varanasi & Surat.
            </p>
          </div>

          <div className="trust-pillar-card">
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                backgroundColor: "rgba(197, 160, 89, 0.12)",
                border: "1px solid rgba(197, 160, 89, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "14px",
              }}
            >
              <NeedleThreadIcon size={22} color="#866951" />
            </div>
            <h4
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "17px",
                fontWeight: 600,
                color: "#261B13",
                marginBottom: "6px",
              }}
            >
              Bespoke Blouse Tailoring
            </h4>
            <p style={{ fontSize: "12.5px", color: "#6E5B4E", lineHeight: 1.6 }}>
              Custom designer blouse stitching and fall-pico finishing included on request.
            </p>
          </div>

          <div className="trust-pillar-card">
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                backgroundColor: "rgba(197, 160, 89, 0.12)",
                border: "1px solid rgba(197, 160, 89, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "14px",
              }}
            >
              <DiamondCrownIcon size={22} color="#866951" />
            </div>
            <h4
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "17px",
                fontWeight: 600,
                color: "#261B13",
                marginBottom: "6px",
              }}
            >
              Live Video Call Previews
            </h4>
            <p style={{ fontSize: "12.5px", color: "#6E5B4E", lineHeight: 1.6 }}>
              Schedule a private 1-on-1 drape consultation with our studio before you order.
            </p>
          </div>

          <div className="trust-pillar-card">
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                backgroundColor: "rgba(197, 160, 89, 0.12)",
                border: "1px solid rgba(197, 160, 89, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "14px",
              }}
            >
              <DeliveryVanIcon size={22} color="#866951" />
            </div>
            <h4
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "17px",
                fontWeight: 600,
                color: "#261B13",
                marginBottom: "6px",
              }}
            >
              Free Insured Delivery
            </h4>
            <p style={{ fontSize: "12.5px", color: "#6E5B4E", lineHeight: 1.6 }}>
              Express pan-India shipping in tamper-proof luxury presentation boxes.
            </p>
          </div>
        </div>
      </section>


      {/* 4. The Weaves of Avsaraa (Curated Craft Categories) */}
      <RevealSection
        as="section"
        className="reveal"
        style={{
          backgroundColor: "#FAF7F2",
          padding: "76px 24px",
          borderBottom: "1px solid #E8DED3",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "42px" }}>
            <span className="luxury-badge" style={{ marginBottom: "12px" }}>
              ✦ MASTERPIECES BY REGION ✦
            </span>
            <h2
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "clamp(30px, 4vw, 44px)",
                fontWeight: 500,
                color: "#261B13",
                lineHeight: 1.15,
                marginBottom: "12px",
              }}
            >
              The Weaves of Avsaraa
            </h2>
            <div className="section-divider" style={{ marginBottom: "16px" }} />
            <p style={{ fontSize: "15px", color: "#6E5B4E", maxWidth: "560px", margin: "0 auto", lineHeight: 1.7 }}>
              Discover regional artisan specialties woven on traditional pit and jacquard looms.
            </p>
          </div>

          {/* Grid on Desktop, Horizontal Scroll on Mobile */}
          <div
            className="category-scroll-strip"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "24px",
            }}
          >
            {WEAVE_CATEGORIES.map((craft) => (
              <Link
                key={craft.name}
                href={craft.href}
                className="luxury-hover-card"
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: "20px",
                  overflow: "hidden",
                  border: "1px solid #E8DED3",
                  boxShadow: "0 8px 24px -10px rgba(38,27,19,0.06)",
                  display: "flex",
                  flexDirection: "column",
                  textDecoration: "none",
                  minWidth: "240px",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "260px",
                    backgroundColor: "#F2EBE3",
                  }}
                >
                  <Image
                    src={craft.image}
                    alt={craft.name}
                    fill
                    sizes="(min-width: 900px) 25vw, 60vw"
                    style={{ objectFit: "cover", objectPosition: "center 20%" }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(26, 18, 12, 0.75) 100%)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: "16px",
                      left: "16px",
                      right: "16px",
                      color: "#FAF7F2",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        fontSize: "10px",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "#E2BE72",
                        fontWeight: 600,
                      }}
                    >
                      {craft.origin}
                    </span>
                    <h3
                      style={{
                        fontFamily: "var(--font-serif), Georgia, serif",
                        fontSize: "20px",
                        fontWeight: 600,
                        color: "#FAF7F2",
                        margin: "2px 0 0 0",
                      }}
                    >
                      {craft.name}
                    </h3>
                  </div>
                </div>
                <div
                  style={{
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: "#FCFAF7",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "#6E5B4E", fontWeight: 500 }}>
                    {craft.tag}
                  </span>
                  <span style={{ fontSize: "12px", color: "#C5A059", fontWeight: 700 }}>
                    Explore →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* 5. Curated Spotlight Masterpieces (Featured Pieces) */}
      <RevealSection
        as="section"
        className="reveal"
        style={{
          backgroundColor: "#F7F2EE",
          padding: "80px 24px",
          borderBottom: "1px solid #E8DED3",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "44px" }}>
            <span className="luxury-badge" style={{ marginBottom: "14px" }}>
              ✦ SPOTLIGHT EDITIONS ✦
            </span>
            <h2
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "clamp(30px, 4.2vw, 46px)",
                fontWeight: 500,
                color: "#261B13",
                lineHeight: 1.15,
                marginBottom: "12px",
              }}
            >
              Handpicked Heirlooms
            </h2>
            <div className="section-divider" style={{ marginBottom: "16px" }} />
            <p style={{ fontSize: "15px", color: "#6E5B4E", maxWidth: "580px", margin: "0 auto", lineHeight: 1.7 }}>
              Exquisite handlooms selected for their exceptional weave density, pure zari threadwork, and royal heritage.
            </p>
          </div>

          {/* Responsive 2-column on mobile, 3-column on desktop */}
          <div className="responsive-product-grid" style={{ marginBottom: "48px" }}>
            {CURATED_SPOTLIGHT.map((product) => (
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
                {/* Image Frame */}
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
                    src={product.image_url}
                    alt={product.name}
                    fill
                    sizes="(min-width: 900px) 33vw, 50vw"
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
                    aria-label={isInWishlist(product.id) ? "Remove from saved heirlooms" : "Save to wish list"}
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


                  {/* Desktop Quick View Button */}
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

                {/* Info & Add to Bag */}
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

                  <p
                    className="product-card-desc"
                    style={{
                      fontSize: "13px",
                      color: "#6E5B4E",
                      lineHeight: 1.55,
                      marginBottom: "16px",
                      flex: 1,
                    }}
                  >
                    {product.description}
                  </p>

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
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                      <div>
                        <span
                          className="product-card-price"
                          style={{
                            display: "block",
                            fontSize: "18px",
                            fontWeight: 700,
                            color: "#261B13",
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
                          Free Insured Delivery
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

          {/* Link to Full Collection */}
          <div style={{ textAlign: "center" }}>
            <Link
              href="/collection"
              className="avsaraa-btn-primary btn-shine"
              style={{
                height: "52px",
                padding: "0 38px",
                fontSize: "13px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                textDecoration: "none",
                borderRadius: "26px",
                backgroundColor: "#261B13",
                color: "#FAF7F2",
              }}
            >
              <span>Explore All Sarees & Dresses</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </RevealSection>

      {/* 6. The Weaver's Journey (Split Editorial Craftsmanship Section) */}
      <RevealSection
        as="section"
        className="reveal"
        style={{
          backgroundColor: "#FAF7F2",
          padding: "84px 24px",
          borderBottom: "1px solid #E8DED3",
        }}
      >
        <div
          style={{
            maxWidth: "1140px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "54px",
            alignItems: "center",
          }}
        >
          {/* Left: Artisan Craft Portrait */}
          <div
            style={{
              position: "relative",
              height: "clamp(380px, 45vw, 480px)",
              borderRadius: "24px",
              overflow: "hidden",
              border: "1px solid #E2D5C7",
              boxShadow: "0 20px 50px -15px rgba(38,27,19,0.15)",
            }}
          >
            <Image
              src="/images/saree_model_hero.jpg"
              alt="Avsaraa Handloom Weaving Craft"
              fill
              sizes="(min-width: 900px) 50vw, 90vw"
              style={{ objectFit: "cover", objectPosition: "center 25%" }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(26, 18, 12, 0.8) 100%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "24px",
                left: "24px",
                right: "24px",
                color: "#FAF7F2",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "#E2BE72",
                  fontWeight: 600,
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                SURAT & VARANASI ARTISAN CLUSTERS
              </span>
              <p
                style={{
                  fontFamily: "var(--font-serif), Georgia, serif",
                  fontSize: "20px",
                  lineHeight: 1.3,
                  margin: 0,
                }}
              >
                “Each drape takes over 64 hours on a traditional handloom.”
              </p>
            </div>
          </div>

          {/* Right: Narrative & Guarantees */}
          <div>
            <span className="luxury-badge" style={{ marginBottom: "14px" }}>
              ✦ ROOTED IN SURAT ✦
            </span>
            <h2
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "clamp(30px, 4.2vw, 44px)",
                fontWeight: 500,
                color: "#261B13",
                lineHeight: 1.2,
                marginBottom: "16px",
              }}
            >
              Where Ancient Looms Meet Modern Grace
            </h2>
            <div
              style={{
                width: "48px",
                height: "1.5px",
                background: "linear-gradient(90deg, #C5A059, transparent)",
                marginBottom: "20px",
              }}
            />
            <p
              style={{
                fontSize: "15px",
                color: "#5C4A3E",
                lineHeight: 1.8,
                marginBottom: "22px",
              }}
            >
              Avsaraa was founded with a singular devotion: to preserve the living art of Indian handlooms while offering modern women heirlooms of unmatched grace and comfort.
            </p>
            <p
              style={{
                fontSize: "14.5px",
                color: "#6E5B4E",
                lineHeight: 1.75,
                marginBottom: "32px",
              }}
            >
              We bypass intermediaries, sourcing straight from master weaver households in Surat, Varanasi, and Chanderi. Every saree is thoroughly checked for silk purity and hand-finished with fall, pico, and tassel trims.
            </p>

            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
              <Link
                href="/about"
                className="avsaraa-btn-outline"
                style={{
                  height: "48px",
                  padding: "0 28px",
                  fontSize: "12.5px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  backgroundColor: "#FFFFFF",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  textDecoration: "none",
                  borderRadius: "24px",
                  border: "1px solid #CFBEAD",
                  color: "#261B13",
                }}
              >
                <span>Read Full Story</span>
                <span>→</span>
              </Link>

              <Link
                href="/contact"
                className="avsaraa-btn-primary btn-shine"
                style={{
                  height: "48px",
                  padding: "0 28px",
                  fontSize: "12.5px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  backgroundColor: "#261B13",
                  color: "#FAF7F2",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  textDecoration: "none",
                  borderRadius: "24px",
                }}
              >
                <span>Book Appointment</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* 7. Patron Reviews & Royal Testimonials */}
      <RevealSection
        as="section"
        className="reveal"
        style={{
          backgroundColor: "#FFFFFF",
          padding: "80px 24px",
          borderBottom: "1px solid #E8DED3",
        }}
      >
        <div style={{ maxWidth: "1140px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "44px" }}>
            <span className="luxury-badge" style={{ marginBottom: "12px" }}>
              ✦ TESTIMONIALS ✦
            </span>
            <h2
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "clamp(28px, 3.8vw, 42px)",
                fontWeight: 500,
                color: "#261B13",
                lineHeight: 1.15,
                marginBottom: "12px",
              }}
            >
              Cherished by Patrons Across India & Abroad
            </h2>
            <div className="section-divider" style={{ marginBottom: "16px" }} />
            <p style={{ fontSize: "14.5px", color: "#6E5B4E", maxWidth: "540px", margin: "0 auto" }}>
              Real bridal and festive experiences from families who chose Avsaraa for their defining moments.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "24px",
            }}
          >
            {PATRON_REVIEWS.map((review, i) => (
              <div
                key={i}
                className="trust-pillar-card"
                style={{
                  backgroundColor: "#FCFAF7",
                  border: "1px solid #EAE0D5",
                  borderRadius: "20px",
                  padding: "28px 24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ color: "#C5A059", fontSize: "16px", marginBottom: "14px" }}>
                    {"★".repeat(review.rating)}
                  </div>
                  <p
                    style={{
                      fontFamily: "var(--font-serif), Georgia, serif",
                      fontSize: "16px",
                      fontStyle: "italic",
                      color: "#3A2A1E",
                      lineHeight: 1.6,
                      marginBottom: "20px",
                    }}
                  >
                    “{review.quote}”
                  </p>
                </div>

                <div style={{ borderTop: "1px solid #EFE6DC", paddingTop: "14px" }}>
                  <div style={{ fontWeight: 600, fontSize: "14px", color: "#261B13" }}>
                    {review.author}
                  </div>
                  <div style={{ fontSize: "12px", color: "#8E7D70", display: "flex", justifyContent: "space-between" }}>
                    <span>{review.city}</span>
                    <span style={{ color: "#866951", fontWeight: 500 }}>{review.piece}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* 8. Bespoke Concierge Atelier Banner */}
      <RevealSection
        as="section"
        className="reveal dark-section"
        style={{
          color: "#FAF7F2",
          padding: "70px 24px",
          textAlign: "center",
          position: "relative",
        }}
      >
        <div style={{ maxWidth: "720px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <span
            className="luxury-badge"
            style={{
              marginBottom: "14px",
              backgroundColor: "rgba(197, 160, 89, 0.15)",
              color: "#E2BE72",
              border: "1px solid rgba(197, 160, 89, 0.35)",
            }}
          >
            ✦ BESPOKE STYLING & BRIDAL TROUSSEAU ✦
          </span>
          <h2
            style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontSize: "clamp(30px, 4.4vw, 44px)",
              fontWeight: 500,
              color: "#FAF7F2",
              marginBottom: "14px",
              lineHeight: 1.2,
            }}
          >
            Need Help Choosing Your Drape?
          </h2>
          <p
            style={{
              fontSize: "15px",
              color: "#D6C7B8",
              lineHeight: 1.75,
              marginBottom: "28px",
            }}
          >
            Connect directly with our Surat studio master drapers. We provide live video drape previews, bespoke blouse tailoring consultations, and expedited bridal dispatches.
          </p>
          <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/contact"
              className="btn-shine"
              style={{
                height: "50px",
                padding: "0 28px",
                fontSize: "13px",
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                backgroundColor: "#FAF7F2",
                color: "#261B13",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                borderRadius: "25px",
                boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
              }}
            >
              <span>Book Studio Consultation</span>
              <span>→</span>
            </Link>

            <Link
              href="/contact"
              className="avsaraa-btn-outline"
              style={{
                height: "50px",
                padding: "0 28px",
                fontSize: "13px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                borderColor: "rgba(226, 190, 114, 0.6)",
                color: "#FAF7F2",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                borderRadius: "25px",
              }}
            >
              <span>Contact Studio</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </RevealSection>

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
                  {selectedProduct.description}
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
                  <div>✦ <strong>Finishing:</strong> Fall & Pico Finishing Available</div>
                  <div>✦ <strong>Delivery:</strong> Express Insured Dispatch Across India</div>
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

      {/* 9. Grand Footer */}
      <Footer />
    </div>
  );
}
