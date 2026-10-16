"use client";

import React from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AboutSection from "@/components/AboutSection";

export default function AboutPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#FAF7F2" }}>
      <Header />

      <main style={{ flex: 1 }}>
        {/* Editorial Breadcrumb & Header Banner */}
        <section
          style={{
            backgroundColor: "#261B13",
            color: "#FAF7F2",
            padding: "54px 24px 48px 24px",
            textAlign: "center",
            position: "relative",
            borderBottom: "1px solid #3E2D22",
          }}
        >
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
            <span style={{ color: "#FAF7F2", fontWeight: 600 }}>About Us</span>
          </nav>

          <span
            className="luxury-badge"
            style={{
              marginBottom: "12px",
              backgroundColor: "rgba(196, 171, 148, 0.15)",
              color: "#E2D7CC",
              border: "1px solid rgba(196, 171, 148, 0.3)",
            }}
          >
            ✦ OUR STORY & VALUES ✦
          </span>

          <h1
            style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontSize: "clamp(34px, 5vw, 52px)",
              fontWeight: 500,
              lineHeight: 1.15,
              marginBottom: "14px",
              color: "#FAF7F2",
            }}
          >
            About Avsaraa
          </h1>

          <p
            style={{
              fontSize: "15px",
              color: "#D6C7B8",
              maxWidth: "580px",
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            Wear The Moment. Handcrafted Indian silks and timeless festive drapes, crafted directly with authentic artisan clusters.
          </p>
        </section>

        {/* Core Narrative & Craftsmanship Pillars */}
        <AboutSection showHeader={false} />

        {/* Collection Call to Action Banner */}
        <section
          style={{
            backgroundColor: "#F7F2EE",
            padding: "60px 24px",
            textAlign: "center",
            borderTop: "1px solid #E6DACF",
            borderBottom: "1px solid #E6DACF",
          }}
        >
          <div style={{ maxWidth: "680px", margin: "0 auto" }}>
            <span
              style={{
                fontSize: "11px",
                color: "#866951",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontWeight: 600,
                display: "block",
                marginBottom: "8px",
              }}
            >
              EXPLORE OUR CREATIONS
            </span>
            <h2
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "28px",
                color: "#261B13",
                marginBottom: "14px",
                fontWeight: 500,
              }}
            >
              Discover Handcrafted Pieces
            </h2>
            <p style={{ fontSize: "14px", color: "#6E5B4E", lineHeight: 1.7, marginBottom: "26px" }}>
              Explore our curated handloom weaves and festive ensembles, thoughtfully designed for every celebration.
            </p>
            <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link
                href="/#products"
                className="avsaraa-btn-primary"
                style={{
                  height: "46px",
                  padding: "0 28px",
                  fontSize: "12.5px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  width: "auto",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>View Collection</span>
                <span>→</span>
              </Link>
              <Link
                href="/contact"
                className="avsaraa-btn-outline"
                style={{
                  height: "46px",
                  padding: "0 26px",
                  fontSize: "12.5px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  width: "auto",
                  display: "inline-flex",
                  alignItems: "center",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <span>Contact Studio</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
