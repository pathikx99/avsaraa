"use client";

import React from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { HeartIcon } from "@/components/Icons";

export default function WishlistPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#FAF7F2" }}>
      <Header />

      <main style={{ flex: 1 }}>
        {/* Editorial Breadcrumb & Header Banner */}
        <section
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
            <span style={{ color: "#FAF7F2", fontWeight: 600 }}>Wishlist</span>
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
            ✦ SAVED FOR CELEBRATIONS ✦
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
            My Wishlist
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
            Save your favorite handcrafted sarees and bridal ensembles as you curate your personal wardrobe.
          </p>
        </section>

        {/* Empty Wishlist State */}
        <section style={{ padding: "80px 24px", maxWidth: "680px", margin: "0 auto", textAlign: "center" }}>
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8DED3",
              borderRadius: "24px",
              padding: "50px 32px",
              boxShadow: "0 10px 30px rgba(38, 27, 19, 0.04)",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                backgroundColor: "#FAF7F2",
                border: "1px solid #E6DACF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px auto",
              }}
            >
              <HeartIcon size={26} color="#866951" />
            </div>

            <h3
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "24px",
                fontWeight: 600,
                color: "#261B13",
                marginBottom: "10px",
              }}
            >
              Your Wishlist is Empty
            </h3>

            <p
              style={{
                fontSize: "14px",
                color: "#6E5B4E",
                lineHeight: 1.7,
                maxWidth: "420px",
                margin: "0 auto 28px auto",
              }}
            >
              Discover our handcrafted pure silk drapes, organza sarees, and festive silhouettes to save your favorites.
            </p>

            <Link
              href="/collection"
              className="avsaraa-btn-primary"
              style={{
                height: "48px",
                padding: "0 32px",
                fontSize: "12.5px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                textDecoration: "none",
              }}
            >
              <span>Explore Collection</span>
              <span>→</span>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
