"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { OCCASIONS_LIST } from "@/types/product";
import { RevealSection } from "@/components/RevealSection";

export default function ShopByOccasion() {
  return (
    <section
      id="shop-by-occasion"
      style={{
        backgroundColor: "#FAF7F2",
        padding: "80px 24px 90px 24px",
        position: "relative",
        borderBottom: "1px solid #E6DACF",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        {/* Section Header */}
        <RevealSection>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <span
              className="luxury-badge"
              style={{
                marginBottom: "14px",
                backgroundColor: "rgba(196, 171, 148, 0.15)",
                color: "#6E5B4E",
                border: "1px solid rgba(196, 171, 148, 0.35)",
              }}
            >
              ✦ CURATED CELEBRATIONS ✦
            </span>
            <h2
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "clamp(32px, 4.5vw, 48px)",
                fontWeight: 500,
                color: "#261B13",
                lineHeight: 1.15,
                marginBottom: "14px",
              }}
            >
              Shop by Occasion
            </h2>
            <div className="section-divider" style={{ margin: "0 auto 16px auto" }} />
            <p
              style={{
                fontSize: "15px",
                color: "#6E5B4E",
                maxWidth: "600px",
                margin: "0 auto",
                lineHeight: 1.7,
              }}
            >
              From sunlit daytime rituals to regal evening receptions, discover pieces meticulously styled for every moment of your celebration.
            </p>
          </div>
        </RevealSection>

        {/* Occasions Grid: 2 columns on mobile, 3 columns on desktop */}
        <RevealSection>
          <div className="occasion-card-grid">
            {OCCASIONS_LIST.map((item) => (
              <Link
                key={item.id}
                href={`/products?occasion=${item.slug}`}
                className="occasion-card-link luxury-hover-card"
                style={{
                  display: "block",
                  position: "relative",
                  borderRadius: "16px",
                  overflow: "hidden",
                  textDecoration: "none",
                  backgroundColor: "#261B13",
                  aspectRatio: "4 / 5",
                  boxShadow: "0 8px 24px -10px rgba(38, 27, 19, 0.12)",
                }}
              >
                {/* Background Image */}
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(min-width: 1024px) 33vw, 50vw"
                  style={{
                    objectFit: "cover",
                    objectPosition: "center 20%",
                    transition: "transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)",
                  }}
                  className="occasion-card-image"
                />

                {/* Rich Gradient Scrim */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to top, rgba(26, 18, 12, 0.92) 0%, rgba(26, 18, 12, 0.45) 45%, rgba(26, 18, 12, 0.1) 100%)",
                    transition: "background 0.3s ease",
                  }}
                  className="occasion-card-overlay"
                />

                {/* Card Content Overlay */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "24px 20px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    zIndex: 2,
                  }}
                >
                  <span
                    style={{
                      fontSize: "10.5px",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "#E2BE72",
                      fontWeight: 600,
                      marginBottom: "6px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span>✦</span>
                    <span>{item.subtitle}</span>
                  </span>

                  <h3
                    style={{
                      fontFamily: "var(--font-serif), Georgia, serif",
                      fontSize: "clamp(20px, 2.2vw, 26px)",
                      fontWeight: 500,
                      color: "#FAF7F2",
                      lineHeight: 1.25,
                      marginBottom: "10px",
                    }}
                  >
                    {item.title}
                  </h3>

                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "12px",
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#E8DED3",
                    }}
                    className="occasion-card-cta"
                  >
                    <span>Explore Edit</span>
                    <span style={{ transition: "transform 0.2s ease" }}>→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </RevealSection>
      </div>
    </section>
  );
}
