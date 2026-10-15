"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AboutSection from "@/components/AboutSection";
import ContactSection from "@/components/ContactSection";

export default function HomePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#F7F2EE",
      }}
    >
      {/* 1. Official Header & Announcement Bar */}
      <Header />

      {/* 2. Hero Section */}
      <section
        style={{
          position: "relative",
          backgroundColor: "#FAF7F2",
          borderBottom: "1px solid #E6DACF",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "36px 20px 52px 20px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            alignItems: "center",
            gap: "36px",
          }}
        >
          {/* Left Text / Actions */}
          <div style={{ maxWidth: "560px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#866951",
                display: "block",
                marginBottom: "12px",
              }}
            >
              INTRODUCING
            </span>

            <h1
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "clamp(34px, 5vw, 54px)",
                fontWeight: 500,
                color: "#261B13",
                lineHeight: 1.1,
                letterSpacing: "0.02em",
                marginBottom: "14px",
              }}
            >
              AVSARAA
            </h1>

            <p
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "clamp(22px, 3vw, 28px)",
                fontStyle: "italic",
                color: "#543E2E",
                lineHeight: 1.3,
                marginBottom: "16px",
              }}
            >
              Thoughtfully paired. <br />
              Beautifully yours.
            </p>

            <p
              style={{
                fontSize: "14.5px",
                lineHeight: 1.6,
                color: "#6E5B4E",
                marginBottom: "28px",
                maxWidth: "460px",
              }}
            >
              Born from a reverent celebration of Indian heritage handlooms. Explore bespoke styling, custom tailored silhouettes, and effortless grace.
            </p>

            {/* Core Action Buttons */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
              <Link
                href="/login"
                className="avsaraa-btn-primary"
                style={{
                  display: "inline-flex",
                  width: "auto",
                  padding: "0 28px",
                  height: "48px",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Sign In →
              </Link>

              <Link
                href="/register"
                className="avsaraa-btn-outline"
                style={{
                  display: "inline-flex",
                  width: "auto",
                  padding: "0 24px",
                  height: "48px",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  backgroundColor: "#FFFFFF",
                }}
              >
                Join Free
              </Link>

              <Link
                href="/account"
                className="avsaraa-btn-outline"
                style={{
                  display: "inline-flex",
                  width: "auto",
                  padding: "0 20px",
                  height: "48px",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  backgroundColor: "#FAF7F2",
                  color: "#866951",
                  border: "1px solid #CFBEAD",
                }}
              >
                <span>👤</span>
                <span>My Account</span>
              </Link>
            </div>

            {/* Quick Links to About & Contact */}
            <div style={{ display: "flex", gap: "16px", fontSize: "13px" }}>
              <Link href="#about-us" style={{ color: "#866951", textDecoration: "underline", textUnderlineOffset: "3px", fontWeight: 500 }}>
                Our Heritage & Story ↓
              </Link>
              <span style={{ color: "#CFBEAD" }}>•</span>
              <Link href="#contact-us" style={{ color: "#866951", textDecoration: "underline", textUnderlineOffset: "3px", fontWeight: 500 }}>
                Atelier Concierge & Contact ↓
              </Link>
            </div>
          </div>

          {/* Right Hero Image */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "clamp(340px, 45vw, 500px)",
              borderRadius: "24px",
              overflow: "hidden",
              boxShadow: "0 15px 40px -10px rgba(38,27,19,0.12)",
            }}
          >
            <Image
              src="/images/saree_model_hero.jpg"
              alt="Avsaraa Style Couture"
              fill
              sizes="(min-width: 900px) 50vw, 100vw"
              style={{ objectFit: "cover", objectPosition: "center 18%" }}
              priority
            />
            {/* Soft decorative flower in corner */}
            <div
              style={{
                position: "absolute",
                right: "-20px",
                bottom: "-20px",
                width: "150px",
                height: "150px",
                pointerEvents: "none",
                opacity: 0.85,
              }}
            >
              <Image
                src="/images/botanical_flowers.jpg"
                alt=""
                fill
                sizes="150px"
                style={{ objectFit: "contain", mixBlendMode: "multiply" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Three Pillars */}
      <section
        style={{
          backgroundColor: "#F7F2EE",
          borderBottom: "1px solid #E6DACF",
          padding: "30px 20px",
        }}
      >
        <div
          style={{
            maxWidth: "960px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px",
            textAlign: "center",
          }}
        >
          <div>
            <span style={{ fontSize: "24px", display: "block", marginBottom: "6px" }}>🎨</span>
            <h3 style={{ fontSize: "13px", fontWeight: 600, color: "#261B13", marginBottom: "3px" }}>
              Curated by Avsaraa
            </h3>
            <p style={{ fontSize: "11.5px", color: "#6E5B4E" }}>Hand-selected silhouettes</p>
          </div>
          <div>
            <span style={{ fontSize: "24px", display: "block", marginBottom: "6px" }}>👗</span>
            <h3 style={{ fontSize: "13px", fontWeight: 600, color: "#261B13", marginBottom: "3px" }}>
              Perfect Combinations
            </h3>
            <p style={{ fontSize: "11.5px", color: "#6E5B4E" }}>Head-to-toe grace</p>
          </div>
          <div>
            <span style={{ fontSize: "24px", display: "block", marginBottom: "6px" }}>✨</span>
            <h3 style={{ fontSize: "13px", fontWeight: 600, color: "#261B13", marginBottom: "3px" }}>
              Effortless Looks
            </h3>
            <p style={{ fontSize: "11.5px", color: "#6E5B4E" }}>Ready for every moment</p>
          </div>
        </div>
      </section>

      {/* 4. About Us Section */}
      <AboutSection />

      {/* 5. Contact Section */}
      <ContactSection />

      {/* 6. Official Footer */}
      <Footer />
    </div>
  );
}
