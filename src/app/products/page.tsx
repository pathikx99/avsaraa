"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductsSection from "@/components/ProductsSection";
import { getOccasionTitleBySlug } from "@/lib/productUtils";

function ProductsContent() {
  const searchParams = useSearchParams();
  const occasion = searchParams?.get("occasion");
  const maxPrice = searchParams?.get("maxPrice");
  const category = searchParams?.get("category");

  let bannerTitle = "The Complete Collection";
  let bannerSubtitle = "Explore handloom sarees, designer silhouettes, and curated festive ensembles.";
  let badgeText = "✦ ALL PIECES ✦";

  if (maxPrice && Number(maxPrice) <= 1299) {
    bannerTitle = "The Up to ₹1,299 Edit";
    bannerSubtitle = "Thoughtfully priced daily wear kurtas, handcrafted stoles, and festive essentials.";
    badgeText = "✦ VALUE EDIT · UNDER & UP TO ₹1,299 ✦";
  } else if (occasion) {
    const occasionTitle = getOccasionTitleBySlug(occasion);
    bannerTitle = occasionTitle;
    bannerSubtitle = `Curated festive, wedding, and celebration wear styled for ${occasionTitle}.`;
    badgeText = `✦ SHOP BY OCCASION ✦`;
  } else if (category) {
    bannerTitle = category;
    bannerSubtitle = `Discover our artisanal creations in ${category}.`;
    badgeText = `✦ ${category.toUpperCase()} ✦`;
  }

  return (
    <div className="page-enter" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#FAF7F2" }}>
      <Header />

      <main style={{ flex: 1 }}>
        {/* Editorial Products Hero Banner */}
        <section
          className="collection-hero-pattern"
          style={{
            backgroundColor: "#261B13",
            color: "#FAF7F2",
            padding: "54px 24px 44px 24px",
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
            <Link href="/products" style={{ color: "#C4AB94", textDecoration: "none" }}>
              Products
            </Link>
            {occasion && (
              <>
                <span>/</span>
                <span style={{ color: "#FAF7F2", fontWeight: 600 }}>{getOccasionTitleBySlug(occasion)}</span>
              </>
            )}
            {maxPrice && (
              <>
                <span>/</span>
                <span style={{ color: "#FAF7F2", fontWeight: 600 }}>Up to ₹{maxPrice}</span>
              </>
            )}
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
            {badgeText}
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
            {bannerTitle}
          </h1>

          <p
            style={{
              fontSize: "15px",
              color: "#D6C7B8",
              maxWidth: "620px",
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            {bannerSubtitle}
          </p>
        </section>

        {/* The Catalog with Category Filters and Gated Add to Bag */}
        <ProductsSection showHeader={false} />
      </main>

      <Footer />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#FAF7F2" }}>
          <p style={{ color: "#8E7D70", fontSize: "14px" }}>Loading Avsaraa Collection...</p>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
