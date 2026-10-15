"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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

      {/* 2. Hero Section (from Docs/WhatsApp Image 2026-10-13 at 11.56.08 AM.jpeg) */}
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
            padding: "40px 24px 60px 24px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            alignItems: "center",
            gap: "40px",
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
                fontSize: "clamp(36px, 5vw, 56px)",
                fontWeight: 500,
                color: "#261B13",
                lineHeight: 1.1,
                letterSpacing: "0.02em",
                marginBottom: "16px",
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
                fontSize: "14.5px",
                lineHeight: 1.6,
                color: "#6E5B4E",
                marginBottom: "32px",
                maxWidth: "460px",
              }}
            >
              Curated combinations of sarees, tops, bottoms and dupattas to create complete looks for every occasion.
            </p>

            {/* Quick Action Buttons for Login & Register */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px" }}>
              <Link
                href="/login"
                className="avsaraa-btn-primary"
                style={{
                  display: "inline-flex",
                  width: "auto",
                  padding: "0 32px",
                  height: "50px",
                  fontSize: "14px",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Sign In to Account →
              </Link>

              <Link
                href="/register"
                className="avsaraa-btn-outline"
                style={{
                  display: "inline-flex",
                  width: "auto",
                  padding: "0 28px",
                  height: "50px",
                  fontSize: "14px",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Join Avsaraa
              </Link>
            </div>
          </div>

          {/* Right Hero Image */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "clamp(380px, 50vw, 540px)",
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
              style={{ objectFit: "cover", objectPosition: "center 20%" }}
              priority
            />
            {/* Soft decorative flower in corner */}
            <div
              style={{
                position: "absolute",
                right: "-20px",
                bottom: "-20px",
                width: "160px",
                height: "160px",
                pointerEvents: "none",
                opacity: 0.85,
              }}
            >
              <Image
                src="/images/botanical_flowers.jpg"
                alt=""
                fill
                style={{ objectFit: "contain" }}
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
          padding: "36px 24px",
        }}
      >
        <div
          style={{
            maxWidth: "1000px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "24px",
            textAlign: "center",
          }}
        >
          <div>
            <span style={{ fontSize: "28px", display: "block", marginBottom: "8px" }}>👗</span>
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#261B13", marginBottom: "4px", fontFamily: "var(--font-sans)" }}>
              Expertly Curated
            </h3>
            <p style={{ fontSize: "12.5px", color: "#6E5B4E" }}>Hand-selected silhouettes by master stylists</p>
          </div>
          <div>
            <span style={{ fontSize: "28px", display: "block", marginBottom: "8px" }}>✨</span>
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#261B13", marginBottom: "4px", fontFamily: "var(--font-sans)" }}>
              Complete Looks
            </h3>
            <p style={{ fontSize: "12.5px", color: "#6E5B4E" }}>Effortless head-to-toe coordination</p>
          </div>
          <div>
            <span style={{ fontSize: "28px", display: "block", marginBottom: "8px" }}>💎</span>
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#261B13", marginBottom: "4px", fontFamily: "var(--font-sans)" }}>
              For Every Occasion
            </h3>
            <p style={{ fontSize: "12.5px", color: "#6E5B4E" }}>From intimate celebrations to grand weddings</p>
          </div>
        </div>
      </section>

      {/* 4. Ethnic Elegance Categories (Festive, Everyday, Wedding, Party) */}
      <section style={{ padding: "50px 24px 60px 24px", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#866951",
              display: "block",
              marginBottom: "8px",
            }}
          >
            ETHNIC ELEGANCE
          </span>
          <h2
            style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontSize: "32px",
              fontWeight: 500,
              color: "#261B13",
            }}
          >
            FOR EVERY MOMENT
          </h2>
          <div style={{ width: "36px", height: "1px", backgroundColor: "#C4AB94", margin: "12px auto 0 auto" }} />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
          }}
        >
          {[
            { name: "Festive", desc: "Zari & Gota Work" },
            { name: "Everyday", desc: "Breezy Chanderi & Linens" },
            { name: "Wedding", desc: "Royal Bridal Couture" },
            { name: "Party", desc: "Contemporary Weaves" },
          ].map((cat) => (
            <div
              key={cat.name}
              style={{
                backgroundColor: "#FAF7F2",
                border: "1px solid #E6DACF",
                borderRadius: "16px",
                padding: "24px 20px",
                textAlign: "center",
                transition: "all 0.25s ease",
              }}
            >
              <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "22px", color: "#261B13", marginBottom: "6px" }}>
                {cat.name}
              </h3>
              <p style={{ fontSize: "12.5px", color: "#6E5B4E", marginBottom: "16px" }}>
                {cat.desc}
              </p>
              <Link
                href="/login"
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#866951",
                  textDecoration: "underline",
                  textUnderlineOffset: "3px",
                }}
              >
                Explore →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Official Footer */}
      <Footer />
    </div>
  );
}
