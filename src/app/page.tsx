"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AboutSection from "@/components/AboutSection";
import ContactSection from "@/components/ContactSection";

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState("All Looks");

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

      {/* 2. Hero Section (matching Docs/WhatsApp Image 2026-10-13 at 11.56.08 AM.jpeg) */}
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
            padding: "32px 20px 48px 20px",
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
              AVSARAA STYLE
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
                fontSize: "14px",
                lineHeight: 1.6,
                color: "#6E5B4E",
                marginBottom: "28px",
                maxWidth: "460px",
              }}
            >
              Curated combinations of tops, bottoms and dupattas to create complete looks for every occasion.
            </p>

            {/* Core Action Buttons: Login, Register, My Account */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
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

      {/* 3. Three Pillars (Expertly Curated, Complete Looks, For Every Occasion) */}
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
            <p style={{ fontSize: "11.5px", color: "#6E5B4E" }}>Hand-selected styles</p>
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

      {/* 4. Filter Pills & Curated Looks Grid (matching Docs/WhatsApp Image 2026-10-13 at 11.56.08 AM.jpeg) */}
      <section style={{ padding: "40px 20px 50px 20px", maxWidth: "1100px", margin: "0 auto", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <span
            style={{
              fontSize: "10.5px",
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#866951",
              display: "block",
              marginBottom: "6px",
            }}
          >
            EXPLORE OUR CURATED LOOKS
          </span>
          <h2
            style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontSize: "30px",
              fontWeight: 500,
              color: "#261B13",
            }}
          >
            Ethnic Elegance for Every Moment
          </h2>
          <div style={{ width: "36px", height: "1px", backgroundColor: "#C4AB94", margin: "10px auto 0 auto" }} />
        </div>

        {/* Filter Pills */}
        <div
          className="no-scrollbar"
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "8px",
            overflowX: "auto",
            paddingBottom: "16px",
            marginBottom: "24px",
          }}
        >
          {["All Looks", "Everyday", "Festive", "Wedding", "Party"].map((tab) => {
            const isActive = activeCategory === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveCategory(tab)}
                style={{
                  padding: "8px 18px",
                  borderRadius: "20px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  border: isActive ? "1px solid #261B13" : "1px solid #CFBEAD",
                  backgroundColor: isActive ? "#261B13" : "#FFFFFF",
                  color: isActive ? "#FAF7F2" : "#543E2E",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Product Grid (2 columns on mobile, matching reference) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "20px",
          }}
        >
          {[
            {
              title: "Sage Serenity",
              desc: "TOP + BOTTOM + DUPATTA",
              price: "₹5,899",
            },
            {
              title: "Dusty Rose Elegance",
              desc: "TOP + BOTTOM + DUPATTA",
              price: "₹5,499",
            },
            {
              title: "Festive Grace",
              desc: "TOP + BOTTOM + DUPATTA",
              price: "₹6,299",
            },
            {
              title: "Ivory Dreams",
              desc: "TOP + BOTTOM + DUPATTA",
              price: "₹5,299",
            },
          ].map((look, i) => (
            <div
              key={i}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                border: "1px solid #E8DED3",
                overflow: "hidden",
                transition: "transform 0.2s ease",
              }}
            >
              <div style={{ position: "relative", height: "280px", width: "100%", backgroundColor: "#EDE5DB" }}>
                <Image
                  src="/images/saree_model_hero.jpg"
                  alt={look.title}
                  fill
                  sizes="(min-width: 600px) 280px, 50vw"
                  style={{ objectFit: "cover", objectPosition: i % 2 === 0 ? "center 15%" : "center 30%" }}
                />
                <button
                  aria-label="Save to Wishlist"
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(255,255,255,0.85)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#261B13",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
              </div>

              <div style={{ padding: "16px" }}>
                <h4
                  style={{
                    fontFamily: "var(--font-serif), Georgia, serif",
                    fontSize: "18px",
                    color: "#261B13",
                    marginBottom: "4px",
                  }}
                >
                  {look.title}
                </h4>
                <p style={{ fontSize: "10.5px", color: "#8E7D70", letterSpacing: "0.08em", marginBottom: "8px" }}>
                  {look.desc}
                </p>
                <div style={{ fontSize: "16px", fontWeight: 600, color: "#261B13", marginBottom: "14px" }}>
                  {look.price}
                </div>

                <Link
                  href="/account"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    width: "100%",
                    height: "40px",
                    backgroundColor: "#866951",
                    color: "#FFFFFF",
                    borderRadius: "8px",
                    fontSize: "11.5px",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  <span>VIEW LOOK</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Create Your Own Look Promo (matching reference) */}
      <section
        style={{
          padding: "30px 20px",
          maxWidth: "1100px",
          margin: "0 auto 40px auto",
          width: "100%",
        }}
      >
        <div
          style={{
            backgroundColor: "#FAF7F2",
            border: "1px solid #E6DACF",
            borderRadius: "20px",
            padding: "32px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "24px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ maxWidth: "480px", position: "relative", zIndex: 1 }}>
            <span
              style={{
                fontSize: "10.5px",
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#866951",
                display: "block",
                marginBottom: "6px",
              }}
            >
              COMING SOON
            </span>
            <h3
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "26px",
                color: "#261B13",
                marginBottom: "8px",
              }}
            >
              CREATE YOUR OWN LOOK
            </h3>
            <p style={{ fontSize: "13.5px", color: "#6E5B4E", lineHeight: 1.6, marginBottom: "20px" }}>
              Choose your favourite tops, bottoms and dupattas to craft a look that&apos;s uniquely yours.
            </p>
            <Link
              href="/register"
              className="avsaraa-btn-primary"
              style={{
                display: "inline-flex",
                width: "auto",
                padding: "0 26px",
                height: "44px",
                fontSize: "12px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Get Notified →
            </Link>
          </div>

          <div
            style={{
              position: "relative",
              width: "200px",
              height: "160px",
              borderRadius: "14px",
              overflow: "hidden",
            }}
          >
            <Image
              src="/images/saree_model_hero.jpg"
              alt="Avsaraa Atelier"
              fill
              sizes="200px"
              style={{ objectFit: "cover", objectPosition: "center 20%" }}
            />
          </div>
        </div>
      </section>

      {/* 6. About Us Section */}
      <AboutSection />

      {/* 7. Contact Section */}
      <ContactSection />

      {/* 8. Official Footer */}
      <Footer />
    </div>
  );
}
