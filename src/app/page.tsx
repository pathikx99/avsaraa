"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductsSection from "@/components/ProductsSection";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
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

      {/* 2. Home Section (Luxury Editorial Showcase) */}
      <section
        id="home"
        style={{
          position: "relative",
          backgroundColor: "#FAF7F2",
          borderBottom: "1px solid #E6DACF",
          overflow: "hidden",
          padding: "70px 24px 80px 24px",
        }}
      >
        {/* Subtle Luxury Corner Flourish */}
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
          {/* Left Column: Editorial Brand Essence */}
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
                ✦ PURE HANDLOOM SILKS • MUMBAI STUDIO ✦
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

            {/* Core Action Buttons */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", width: "100%" }}>
              <Link
                href="#products"
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
                }}
              >
                <span>Explore Collection</span>
                <span>↓</span>
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

              {/* Top Season Pill - Centered at the apex of the arch so it is NEVER cut off */}
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

              {/* Floating Bottom Glass Atelier Card */}
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
                  href="#products"
                  style={{
                    backgroundColor: "#261B13",
                    color: "#FAF7F2",
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    padding: "8px 14px",
                    borderRadius: "20px",
                    transition: "all 0.2s ease",
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

      {/* 3. Products Section with 4 Categories from reference image */}
      <ProductsSection />

      {/* 4. Footer */}
      <Footer />
    </div>
  );
}
