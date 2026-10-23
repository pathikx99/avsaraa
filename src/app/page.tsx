"use client";

import React, { useState, useEffect } from "react";
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
  CameraIcon,
  VideoCameraIcon,
  StarIcon,
  CloseIcon,
} from "@/components/Icons";
import { RevealSection } from "@/components/RevealSection";
import ReviewModal from "@/components/ReviewModal";
import { ProductReview } from "@/types/review";
import { DEFAULT_PATRON_REVIEWS } from "@/lib/defaultReviews";


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


export default function HomePage() {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>(DEFAULT_PATRON_REVIEWS);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [previewMediaModal, setPreviewMediaModal] = useState<{
    type: "photo" | "video";
    url: string;
    title?: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/reviews")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.reviews) && data.reviews.length > 0) {
          setReviews(data.reviews);
        }
      })
      .catch(() => {
        // Silently retain DEFAULT_PATRON_REVIEWS
      });
    return () => {
      isMounted = false;
    };
  }, []);

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
          }}
          className="hero-editorial-grid"
        >
          {/* Header Area (Top on Mobile, Top-Left on Desktop) */}
          <div className="hero-grid-header">
            {/* Gilded Heritage Badge */}
            <div style={{ marginBottom: "18px" }} className="hero-badge">
              <span
                className="luxury-badge"
                style={{
                  border: "1px solid rgba(197, 160, 89, 0.55)",
                  backgroundColor: "rgba(255, 255, 255, 0.85)",
                  boxShadow: "0 2px 12px rgba(197, 160, 89, 0.16)",
                  letterSpacing: "0.14em",
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
                fontSize: "clamp(46px, 6.8vw, 82px)",
                fontWeight: 500,
                color: "#261B13",
                lineHeight: 1.02,
                letterSpacing: "0.06em",
                marginBottom: "12px",
              }}
            >
              AVSARAA
            </h1>

            {/* Italic Poetry */}
            <p
              className="hero-subtitle"
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "clamp(20px, 3.2vw, 32px)",
                fontStyle: "italic",
                color: "#866951",
                lineHeight: 1.25,
                marginBottom: "18px",
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
                marginBottom: "18px",
              }}
            />
          </div>

          {/* Image Area (Right on Desktop, Middle on Mobile — visible above fold!) */}
          <div className="hero-grid-image">
            <div
              className="arch-top-frame"
              style={{
                position: "relative",
                width: "100%",
                maxWidth: "460px",
                height: "clamp(440px, 50vw, 560px)",
                backgroundColor: "#EFE6DC",
                boxShadow: "0 24px 60px -15px rgba(38, 27, 19, 0.22), 0 0 0 1px rgba(197, 160, 89, 0.35)",
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
                  top: "22px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: "rgba(38, 27, 19, 0.92)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  color: "#FAF7F2",
                  padding: "6px 18px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
                  whiteSpace: "nowrap",
                  zIndex: 2,
                  border: "1px solid rgba(226, 190, 114, 0.55)",
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
                      letterSpacing: "0.1em",
                      fontWeight: 600,
                    }}
                  >
                    HANDWOVEN TISSUE
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
                    Emerald Royal Organza
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

          {/* Actions Area (Bottom on Mobile, Bottom-Left on Desktop) */}
          <div className="hero-grid-actions">
            <p
              className="hero-body"
              style={{
                fontSize: "15.5px",
                lineHeight: 1.85,
                color: "#5C4A3E",
                marginBottom: "24px",
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
                marginBottom: "32px",
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
                marginTop: "32px",
                paddingTop: "18px",
                borderTop: "1px solid #EAE0D5",
                display: "flex",
                flexWrap: "wrap",
                gap: "20px",
                fontSize: "12px",
                color: "#8E7D70",
                width: "100%",
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
        </div>
      </section>

      {/* 3. The Atelier Heritage Ribbon (Gilded Vows of Handloom Authenticity) */}
      <section className="heritage-ribbon">
        <div className="heritage-ribbon-grid">
          <div className="heritage-ribbon-item">
            <div className="heritage-medallion">
              <LoomWeaveIcon size={24} color="#866951" />
            </div>
            <h4
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "18px",
                fontWeight: 600,
                color: "#261B13",
                marginBottom: "6px",
              }}
            >
              100% Handloom Certified
            </h4>
            <p style={{ fontSize: "12.5px", color: "#6E5B4E", lineHeight: 1.6, maxWidth: "250px", margin: 0 }}>
              Authentic weaves sourced directly from master craft clusters in Varanasi & Surat.
            </p>
          </div>

          <div className="heritage-ribbon-item">
            <div className="heritage-medallion">
              <NeedleThreadIcon size={24} color="#866951" />
            </div>
            <h4
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "18px",
                fontWeight: 600,
                color: "#261B13",
                marginBottom: "6px",
              }}
            >
              Bespoke Blouse Tailoring
            </h4>
            <p style={{ fontSize: "12.5px", color: "#6E5B4E", lineHeight: 1.6, maxWidth: "250px", margin: 0 }}>
              Custom designer blouse stitching and fall-pico finishing included on request.
            </p>
          </div>

          <div className="heritage-ribbon-item">
            <div className="heritage-medallion">
              <DiamondCrownIcon size={24} color="#866951" />
            </div>
            <h4
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "18px",
                fontWeight: 600,
                color: "#261B13",
                marginBottom: "6px",
              }}
            >
              Live Video Call Previews
            </h4>
            <p style={{ fontSize: "12.5px", color: "#6E5B4E", lineHeight: 1.6, maxWidth: "250px", margin: 0 }}>
              Schedule a private 1-on-1 drape consultation with our studio before you order.
            </p>
          </div>

          <div className="heritage-ribbon-item">
            <div className="heritage-medallion">
              <DeliveryVanIcon size={24} color="#866951" />
            </div>
            <h4
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "18px",
                fontWeight: 600,
                color: "#261B13",
                marginBottom: "6px",
              }}
            >
              Free Insured Delivery
            </h4>
            <p style={{ fontSize: "12.5px", color: "#6E5B4E", lineHeight: 1.6, maxWidth: "250px", margin: 0 }}>
              Express pan-India shipping in tamper-proof luxury presentation boxes.
            </p>
          </div>
        </div>
      </section>

      {/* 4. The Weaves of Avsaraa (Curated Regional Craft Portfolios) */}
      <RevealSection
        as="section"
        className="reveal"
        style={{
          backgroundColor: "#FAF7F2",
          padding: "80px 24px",
          borderBottom: "1px solid #E8DED3",
        }}
      >
        <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "44px" }}>
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

          <div className="category-editorial-grid">
            {WEAVE_CATEGORIES.map((craft) => (
              <Link
                key={craft.name}
                href={craft.href}
                className="editorial-craft-card"
              >
                <Image
                  src={craft.image}
                  alt={craft.name}
                  fill
                  sizes="(min-width: 900px) 25vw, 60vw"
                  style={{ objectFit: "cover", objectPosition: "center 20%" }}
                />

                {/* Dark Vignette Overlay */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(180deg, rgba(38,27,19,0.05) 30%, rgba(38,27,19,0.5) 65%, rgba(26,18,12,0.92) 100%)",
                    zIndex: 1,
                  }}
                />

                {/* Card Content Overlay */}
                <div
                  style={{
                    position: "relative",
                    zIndex: 2,
                    padding: "24px 20px",
                    color: "#FAF7F2",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "10px",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "#E2BE72",
                      fontWeight: 600,
                      marginBottom: "6px",
                    }}
                  >
                    ✦ {craft.origin}
                  </span>
                  <h3
                    style={{
                      fontFamily: "var(--font-serif), Georgia, serif",
                      fontSize: "24px",
                      fontWeight: 600,
                      color: "#FAF7F2",
                      margin: "0 0 6px 0",
                      lineHeight: 1.2,
                    }}
                  >
                    {craft.name}
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: "10px",
                      paddingTop: "10px",
                      borderTop: "1px solid rgba(226, 190, 114, 0.35)",
                    }}
                  >
                    <span style={{ fontSize: "12px", color: "#E2D7CC", fontWeight: 500 }}>
                      {craft.tag}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: "#E2BE72",
                        fontWeight: 700,
                      }}
                    >
                      Explore →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </RevealSection>

      {/* 5. Royal Festive Trousseau Edition (Masterpiece Editorial Lookbook Spread) */}
      <RevealSection
        as="section"
        className="reveal lookbook-spread"
      >
        <div className="lookbook-container">
          {/* Visual Column: Royal Arch Model Portrait */}
          <div>
            <div className="lookbook-arch-portrait">
              <Image
                src="/images/saree_model_hero.jpg"
                alt="Avsaraa Royal Festive Trousseau Saree"
                fill
                sizes="(min-width: 900px) 480px, 90vw"
                style={{ objectFit: "cover", objectPosition: "center 20%" }}
              />

              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(180deg, rgba(0,0,0,0) 65%, rgba(20, 14, 9, 0.85) 100%)",
                }}
              />

              {/* Floating Atelier Seal */}
              <div
                style={{
                  position: "absolute",
                  bottom: "20px",
                  left: "20px",
                  right: "20px",
                  backgroundColor: "rgba(36, 25, 17, 0.92)",
                  backdropFilter: "blur(12px)",
                  WebkitBackdropFilter: "blur(12px)",
                  border: "1px solid rgba(226, 190, 114, 0.5)",
                  borderRadius: "16px",
                  padding: "12px 18px",
                  color: "#FAF7F2",
                  textAlign: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "10.5px",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "#E2BE72",
                    fontWeight: 600,
                    display: "block",
                    marginBottom: "3px",
                  }}
                >
                  ✦ ATELIER HEIRLOOM № 1848 ✦
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-serif), Georgia, serif",
                    fontSize: "16px",
                    fontWeight: 500,
                    color: "#FAF7F2",
                  }}
                >
                  Pure Mulberry Silk & Authentic Silver-Gilt Zari
                </span>
              </div>
            </div>
          </div>

          {/* Narrative Column: Couture Heritage & Royal Seals */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left" }}>
            <span
              className="luxury-badge"
              style={{
                marginBottom: "16px",
                backgroundColor: "rgba(226, 190, 114, 0.15)",
                color: "#E2BE72",
                border: "1px solid rgba(226, 190, 114, 0.4)",
              }}
            >
              ✦ THE ATELIER ARCHIVE • TROUSSEAU 2026 ✦
            </span>

            <h2
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "clamp(32px, 4.4vw, 48px)",
                fontWeight: 500,
                color: "#FAF7F2",
                lineHeight: 1.15,
                marginBottom: "16px",
              }}
            >
              Woven for Moments That Turn Into Heirlooms
            </h2>

            <p
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "19px",
                fontStyle: "italic",
                color: "#D4B99F",
                lineHeight: 1.5,
                marginBottom: "20px",
              }}
            >
              “A handwoven saree is not merely attire; it is the quiet devotion of the weaver, the heritage of generations, and the soul of royal India.”
            </p>

            <div
              style={{
                width: "56px",
                height: "1.5px",
                background: "linear-gradient(90deg, #E2BE72, transparent)",
                marginBottom: "24px",
              }}
            />

            {/* 3 Royal Seal Badges */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px", width: "100%" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(226, 190, 114, 0.15)",
                    border: "1px solid rgba(226, 190, 114, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: "2px",
                  }}
                >
                  <DiamondCrownIcon size={18} color="#E2BE72" />
                </div>
                <div>
                  <h4 style={{ fontSize: "15px", fontWeight: 600, color: "#FAF7F2", margin: "0 0 2px 0" }}>
                    Silk Mark Certified Pure Filament
                  </h4>
                  <p style={{ fontSize: "13px", color: "#B8A393", margin: 0, lineHeight: 1.5 }}>
                    100% natural mulberry and katan silk tested and certified for lifelong lustre and drape.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(226, 190, 114, 0.15)",
                    border: "1px solid rgba(226, 190, 114, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: "2px",
                  }}
                >
                  <LoomWeaveIcon size={18} color="#E2BE72" />
                </div>
                <div>
                  <h4 style={{ fontSize: "15px", fontWeight: 600, color: "#FAF7F2", margin: "0 0 2px 0" }}>
                    Authentic Silver-Gilt Zari
                  </h4>
                  <p style={{ fontSize: "13px", color: "#B8A393", margin: 0, lineHeight: 1.5 }}>
                    Real metallic threadwork hand-interlocked into heritage floral jaal and meenakari motifs.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(226, 190, 114, 0.15)",
                    border: "1px solid rgba(226, 190, 114, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: "2px",
                  }}
                >
                  <NeedleThreadIcon size={18} color="#E2BE72" />
                </div>
                <div>
                  <h4 style={{ fontSize: "15px", fontWeight: 600, color: "#FAF7F2", margin: "0 0 2px 0" }}>
                    Complimentary Fall, Pico & Blouse Tailoring
                  </h4>
                  <p style={{ fontSize: "13px", color: "#B8A393", margin: 0, lineHeight: 1.5 }}>
                    Every heirloom arrives celebration-ready with handcrafted fall, edge pico, and optional blouse styling.
                  </p>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", width: "100%" }}>
              <Link
                href="/collection?category=Sarees"
                className="gold-foil-bg btn-shine"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  padding: "0 32px",
                  height: "50px",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  borderRadius: "25px",
                  textDecoration: "none",
                }}
              >
                <span>Explore Trousseau Sarees</span>
                <span>→</span>
              </Link>

              <a
                href="https://wa.me/919876543210?text=Hello%20Avsaraa%20Atelier,%20I%20would%20like%20to%20schedule%20a%20private%20video%20drape%20consultation%20for%20the%20Festive%20Trousseau%20collection."
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "0 26px",
                  height: "50px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  borderRadius: "25px",
                  textDecoration: "none",
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(226, 190, 114, 0.5)",
                  color: "#FAF7F2",
                  transition: "all 0.25s ease",
                }}
              >
                <WhatsAppIcon size={16} color="#25D366" />
                <span>Video Drape Call</span>
              </a>
            </div>
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

      {/* 7. Patron Reviews & Royal Testimonials with Real Photos and Videos */}
      <RevealSection
        as="section"
        className="reveal"
        style={{
          backgroundColor: "#FFFFFF",
          padding: "80px 24px",
          borderBottom: "1px solid #E8DED3",
        }}
      >
        <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <span className="luxury-badge" style={{ marginBottom: "12px" }}>
              ✦ PATRON REVIEWS & REAL DRAPES ✦
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
            <p style={{ fontSize: "14.5px", color: "#6E5B4E", maxWidth: "600px", margin: "0 auto 20px" }}>
              Authentic bridal moments, heirloom drapes, and video testimonials from patrons who chose Avsaraa for their defining celebrations.
            </p>
            <button
              type="button"
              onClick={() => setShowReviewModal(true)}
              className="avsaraa-btn-outline"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 22px",
                borderRadius: "22px",
                backgroundColor: "#FCFAF7",
                border: "1px solid #C5A059",
                color: "#261B13",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(197, 160, 89, 0.15)",
                transition: "all 0.2s ease",
              }}
            >
              <CameraIcon size={15} color="#C5A059" />
              <span>✦ Share Your Drape Review & Photos</span>
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "24px",
            }}
          >
            {reviews.map((review) => (
              <div
                key={review.id}
                className="trust-pillar-card"
                style={{
                  backgroundColor: "#FCFAF7",
                  border: "1px solid #EAE0D5",
                  borderRadius: "22px",
                  padding: "28px 24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative",
                  boxShadow: "0 8px 24px -10px rgba(38, 27, 19, 0.06)",
                }}
              >
                <div>
                  {/* Rating & Verified Badge */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                    <div style={{ display: "flex", gap: "3px" }}>
                      {[...Array(review.rating || 5)].map((_, idx) => (
                        <StarIcon key={idx} size={16} color="#C5A059" filled />
                      ))}
                    </div>
                    <span
                      style={{
                        fontSize: "10.5px",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "#866951",
                        fontWeight: 600,
                        backgroundColor: "rgba(197, 160, 89, 0.12)",
                        padding: "3px 10px",
                        borderRadius: "12px",
                        border: "1px solid rgba(197, 160, 89, 0.25)",
                      }}
                    >
                      ✦ Verified Patron
                    </span>
                  </div>

                  {/* Review Title */}
                  {review.title && (
                    <h4
                      style={{
                        fontFamily: "var(--font-serif), Georgia, serif",
                        fontSize: "16px",
                        fontWeight: 600,
                        color: "#261B13",
                        marginBottom: "10px",
                        lineHeight: 1.35,
                      }}
                    >
                      {review.title}
                    </h4>
                  )}

                  {/* Review Comment */}
                  <p
                    style={{
                      fontFamily: "var(--font-serif), Georgia, serif",
                      fontSize: "14.5px",
                      fontStyle: "italic",
                      color: "#3B2B20",
                      lineHeight: 1.65,
                      marginBottom: "18px",
                    }}
                  >
                    “{review.comment}”
                  </p>

                  {/* Patron Photos Gallery */}
                  {review.photos && review.photos.length > 0 && (
                    <div style={{ marginBottom: "16px" }}>
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          color: "#866951",
                          letterSpacing: "0.05em",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          marginBottom: "8px",
                        }}
                      >
                        <CameraIcon size={12} color="#866951" />
                        <span>Patron Drape Photos:</span>
                      </div>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {review.photos.map((photo, pIdx) => (
                          <div
                            key={pIdx}
                            onClick={() =>
                              setPreviewMediaModal({
                                type: "photo",
                                url: photo,
                                title: `${review.customer_name}’s Drape Photo`,
                              })
                            }
                            style={{
                              position: "relative",
                              width: "72px",
                              height: "72px",
                              borderRadius: "10px",
                              overflow: "hidden",
                              border: "1px solid #CFBEAD",
                              cursor: "pointer",
                              transition: "transform 0.2s ease, box-shadow 0.2s ease",
                            }}
                            title="Click to view full photo"
                          >
                            <Image
                              src={photo}
                              alt="Patron Drape"
                              fill
                              sizes="72px"
                              unoptimized
                              style={{ objectFit: "cover" }}
                            />
                            <div
                              style={{
                                position: "absolute",
                                inset: 0,
                                backgroundColor: "rgba(0,0,0,0.15)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                opacity: 0.9,
                              }}
                            >
                              <span style={{ fontSize: "10px", color: "#FFF", backgroundColor: "rgba(0,0,0,0.5)", padding: "1px 4px", borderRadius: "4px" }}>
                                🔍
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Patron Video Drape */}
                  {review.videos && review.videos.length > 0 && (
                    <div style={{ marginBottom: "16px" }}>
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewMediaModal({
                            type: "video",
                            url: review.videos![0],
                            title: `${review.customer_name}’s Video Drape`,
                          })
                        }
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "6px 12px",
                          borderRadius: "14px",
                          backgroundColor: "#F4ECE1",
                          border: "1px solid #D8C5B2",
                          color: "#5A422D",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        <VideoCameraIcon size={14} color="#C5A059" />
                        <span>▶ Watch Real Drape Clip</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Author Info */}
                <div style={{ borderTop: "1px solid #EFE6DC", paddingTop: "14px", marginTop: "12px" }}>
                  <div style={{ fontWeight: 600, fontSize: "14px", color: "#261B13", marginBottom: "2px" }}>
                    {review.customer_name}
                  </div>
                  <div style={{ fontSize: "12px", color: "#8E7D70", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>{review.customer_city || "India"}</span>
                    <span style={{ color: "#C5A059", fontWeight: 600, fontSize: "11.5px" }}>
                      ✦ {review.product_name || "Avsaraa Heirloom"}
                    </span>
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
          padding: "76px 24px",
          textAlign: "center",
          position: "relative",
        }}
      >
        <div style={{ maxWidth: "720px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <span
            className="luxury-badge"
            style={{
              marginBottom: "16px",
              backgroundColor: "rgba(197, 160, 89, 0.15)",
              color: "#E2BE72",
              border: "1px solid rgba(197, 160, 89, 0.35)",
              letterSpacing: "0.14em",
            }}
          >
            ✦ BESPOKE STYLING & BRIDAL TROUSSEAU ✦
          </span>
          <h2
            style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontSize: "clamp(30px, 4.4vw, 46px)",
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
              marginBottom: "32px",
            }}
          >
            Connect directly with our Surat studio master drapers. We provide live video drape previews, bespoke blouse tailoring consultations, and expedited bridal dispatches.
          </p>
          <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/contact"
              className="btn-shine"
              style={{
                height: "52px",
                padding: "0 30px",
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
                borderRadius: "26px",
                boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
              }}
            >
              <span>Book Studio Consultation</span>
              <span>→</span>
            </Link>

            <a
              href="https://wa.me/919876543210?text=Hello%20Avsaraa%20Atelier,%20I%20would%20like%20to%20connect%20with%20a%20master%20draper."
              target="_blank"
              rel="noopener noreferrer"
              style={{
                height: "52px",
                padding: "0 28px",
                fontSize: "13px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(226, 190, 114, 0.6)",
                color: "#FAF7F2",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                borderRadius: "26px",
                transition: "all 0.25s ease",
              }}
            >
              <WhatsAppIcon size={16} color="#25D366" />
              <span>WhatsApp Studio</span>
            </a>
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

      {/* Review Modal for Submitting Real Customer Reviews with Photos & Videos */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onReviewSubmitted={(newRev) => {
          setReviews((prev) => [newRev, ...prev]);
        }}
      />

      {/* Media Lightbox Modal for Real Patron Photos & Video Drapes */}
      {previewMediaModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            backgroundColor: "rgba(18, 12, 8, 0.88)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewMediaModal(null);
          }}
        >
          <div
            style={{
              position: "relative",
              maxWidth: "850px",
              width: "100%",
              backgroundColor: "#261B13",
              borderRadius: "20px",
              overflow: "hidden",
              border: "1px solid #4A3525",
              boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: "1px solid #3A2A1E",
                backgroundColor: "#1F150F",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {previewMediaModal.type === "photo" ? (
                  <CameraIcon size={16} color="#C5A059" />
                ) : (
                  <VideoCameraIcon size={16} color="#C5A059" />
                )}
                <span style={{ color: "#FAF7F2", fontSize: "13.5px", fontWeight: 600 }}>
                  {previewMediaModal.title || "Real Patron Drape"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewMediaModal(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#FAF7F2",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                <CloseIcon size={20} color="#FAF7F2" />
              </button>
            </div>

            <div
              style={{
                padding: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#120C08",
              }}
            >
              {previewMediaModal.type === "photo" ? (
                <Image
                  src={previewMediaModal.url}
                  alt={previewMediaModal.title || "Patron Drape Photo"}
                  width={1200}
                  height={900}
                  unoptimized
                  style={{
                    maxHeight: "75vh",
                    maxWidth: "100%",
                    width: "auto",
                    height: "auto",
                    objectFit: "contain",
                    borderRadius: "10px",
                  }}
                />
              ) : (
                <video
                  src={previewMediaModal.url}
                  controls
                  autoPlay
                  playsInline
                  style={{
                    maxHeight: "75vh",
                    maxWidth: "100%",
                    borderRadius: "10px",
                    outline: "none",
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* 9. Grand Footer */}
      <Footer />
    </div>
  );
}
