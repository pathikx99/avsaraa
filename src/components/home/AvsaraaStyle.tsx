"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { RevealSection } from "@/components/RevealSection";

export default function AvsaraaStyle() {
  return (
    <section
      id="avsaraa-style"
      style={{
        backgroundColor: "#261B13",
        color: "#FAF7F2",
        padding: "90px 24px 100px 24px",
        position: "relative",
        overflow: "hidden",
        borderBottom: "1px solid #3E2D22",
      }}
    >
      {/* Subtle background ambient gold glow */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          right: "-10%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(226, 190, 114, 0.12) 0%, rgba(38, 27, 19, 0) 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "48px",
            alignItems: "center",
          }}
        >
          {/* Left: Editorial Narrative */}
          <RevealSection>
            <div>
              <span
                className="luxury-badge"
                style={{
                  marginBottom: "16px",
                  backgroundColor: "rgba(226, 190, 114, 0.15)",
                  color: "#E2BE72",
                  border: "1px solid rgba(226, 190, 114, 0.35)",
                }}
              >
                ✦ AVSARAA STYLE · COMBINATIONS STUDIO ✦
              </span>

              <h2
                style={{
                  fontFamily: "var(--font-serif), Georgia, serif",
                  fontSize: "clamp(34px, 4.5vw, 54px)",
                  fontWeight: 500,
                  lineHeight: 1.15,
                  marginBottom: "20px",
                  color: "#FAF7F2",
                }}
              >
                Pair &amp; Style Your Bespoke Look
              </h2>

              <p
                style={{
                  fontSize: "16px",
                  color: "#D6C7B8",
                  lineHeight: 1.7,
                  marginBottom: "28px",
                  maxWidth: "520px",
                }}
              >
                Create your own signature ensemble. Mix and match hand-embroidered short kurtis, silk brocade tops, and flowing palazzos with gossamer Chanderi dupattas — curated to complement every skin tone and celebration.
              </p>

              {/* Feature Highlights */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "18px",
                  marginBottom: "36px",
                }}
              >
                <div
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    padding: "16px",
                    borderRadius: "10px",
                    border: "1px solid rgba(196, 171, 148, 0.15)",
                  }}
                >
                  <span style={{ color: "#E2BE72", fontSize: "16px", display: "block", marginBottom: "6px" }}>✦</span>
                  <h4 style={{ fontSize: "13.5px", fontWeight: 600, color: "#FAF7F2", margin: "0 0 4px 0" }}>
                    Mix &amp; Match
                  </h4>
                  <p style={{ fontSize: "12px", color: "#B8A393", margin: 0, lineHeight: 1.5 }}>
                    Pair separate tops, skirts, and dupattas effortlessly.
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    padding: "16px",
                    borderRadius: "10px",
                    border: "1px solid rgba(196, 171, 148, 0.15)",
                  }}
                >
                  <span style={{ color: "#E2BE72", fontSize: "16px", display: "block", marginBottom: "6px" }}>✦</span>
                  <h4 style={{ fontSize: "13.5px", fontWeight: 600, color: "#FAF7F2", margin: "0 0 4px 0" }}>
                    Live Price Total
                  </h4>
                  <p style={{ fontSize: "12px", color: "#B8A393", margin: 0, lineHeight: 1.5 }}>
                    Real-time combination savings and bundle pricing.
                  </p>
                </div>
              </div>

              {/* CTA linking to /products/styles */}
              <Link
                href="/products/styles"
                className="gold-foil-bg btn-shine"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "16px 36px",
                  borderRadius: "30px",
                  color: "#261B13",
                  fontSize: "13px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  boxShadow: "0 6px 24px rgba(226, 190, 114, 0.25)",
                }}
              >
                <span>EXPLORE AVSARAA STYLE</span>
                <span>→</span>
              </Link>
            </div>
          </RevealSection>

          {/* Right: Visual Lookbook Spread */}
          <RevealSection delay={120}>
            <div
              style={{
                position: "relative",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div
                style={{
                  position: "relative",
                  height: "380px",
                  borderRadius: "16px",
                  overflow: "hidden",
                  boxShadow: "0 12px 30px rgba(0,0,0,0.3)",
                }}
              >
                <Image
                  src="/images/occasion_festive.jpg"
                  alt="Avsaraa Style Combination 1"
                  fill
                  sizes="280px"
                  style={{ objectFit: "cover" }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: "12px",
                    left: "12px",
                    padding: "4px 10px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(38,27,19,0.85)",
                    fontSize: "10px",
                    fontWeight: 600,
                    color: "#E2BE72",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Pairing 01
                </div>
              </div>

              <div
                style={{
                  position: "relative",
                  height: "380px",
                  borderRadius: "16px",
                  overflow: "hidden",
                  marginTop: "30px",
                  boxShadow: "0 12px 30px rgba(0,0,0,0.3)",
                }}
              >
                <Image
                  src="/images/product_suit_under1299.jpg"
                  alt="Avsaraa Style Combination 2"
                  fill
                  sizes="280px"
                  style={{ objectFit: "cover" }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: "12px",
                    left: "12px",
                    padding: "4px 10px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(38,27,19,0.85)",
                    fontSize: "10px",
                    fontWeight: 600,
                    color: "#E2BE72",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Pairing 02
                </div>
              </div>
            </div>
          </RevealSection>
        </div>
      </div>
    </section>
  );
}
