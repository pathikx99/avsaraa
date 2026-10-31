"use client";

import React from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AvsaraaStylesPage() {
  return (
    <div className="page-enter" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#FAF7F2" }}>
      <Header />

      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px 90px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto", backgroundColor: "#FFFFFF", padding: "50px 36px", borderRadius: "16px", border: "1px solid #E6DACF", boxShadow: "0 10px 30px rgba(38,27,19,0.06)" }}>
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            style={{
              fontSize: "12px",
              color: "#8E7D70",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            <Link href="/" style={{ color: "#8E7D70", textDecoration: "none" }}>
              Home
            </Link>
            <span>/</span>
            <Link href="/products" style={{ color: "#8E7D70", textDecoration: "none" }}>
              Products
            </Link>
            <span>/</span>
            <span style={{ color: "#261B13", fontWeight: 600 }}>Styles</span>
          </nav>

          <span
            className="luxury-badge"
            style={{
              marginBottom: "16px",
              backgroundColor: "rgba(196, 171, 148, 0.15)",
              color: "#6E5B4E",
              border: "1px solid rgba(196, 171, 148, 0.4)",
            }}
          >
            ✦ AVSARAA STYLE · COMBINATIONS STUDIO ✦
          </span>

          <h1
            style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontSize: "clamp(30px, 4.5vw, 42px)",
              fontWeight: 500,
              lineHeight: 1.2,
              marginBottom: "16px",
              color: "#261B13",
            }}
          >
            Curate Your Bespoke Look
          </h1>

          <div className="section-divider" style={{ margin: "0 auto 20px auto" }} />

          <p
            style={{
              fontSize: "15px",
              color: "#6E5B4E",
              lineHeight: 1.7,
              marginBottom: "32px",
            }}
          >
            Our interactive styling experience is currently being handcrafted. Soon you will be able to mix and match individual handcrafted tops, skirts, dupattas, and bottom silhouettes with live price calculation and coordinated color palettes.
          </p>

          <div style={{ display: "inline-block", padding: "12px 24px", backgroundColor: "#FAF7F2", borderRadius: "8px", border: "1px dashed #C4AB94", marginBottom: "32px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#8E7D70", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              ✦ Launching in Phase 2 · Coming Soon ✦
            </span>
          </div>

          <div>
            <Link
              href="/products"
              className="luxury-button"
              style={{
                display: "inline-block",
                backgroundColor: "#261B13",
                color: "#FAF7F2",
                padding: "14px 32px",
                borderRadius: "4px",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Explore Available Products →
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
