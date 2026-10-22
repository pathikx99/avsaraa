"use client";

import React from "react";
import Image from "next/image";
import { LoomWeaveIcon, SilkSpoolIcon, NeedleThreadIcon } from "./Icons";

interface AboutSectionProps {
  showHeader?: boolean;
}

export default function AboutSection({ showHeader = true }: AboutSectionProps) {
  return (
    <section
      id="about"
      style={{
        backgroundColor: "#FAF7F2",
        padding: showHeader ? "80px 24px" : "60px 24px 80px 24px",
        position: "relative",
        borderBottom: "1px solid #E6DACF",
        overflow: "hidden",
      }}
    >
      {/* Subtle Botanical Accent */}
      <div
        style={{
          position: "absolute",
          right: "-30px",
          top: "-30px",
          width: "220px",
          height: "220px",
          pointerEvents: "none",
          opacity: 0.4,
          zIndex: 0,
        }}
      >
        <Image
          src="/images/botanical_flowers.jpg"
          alt=""
          fill
          sizes="220px"
          style={{ objectFit: "contain", mixBlendMode: "multiply" }}
        />
      </div>

      <div style={{ maxWidth: "1140px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Section Header */}
        {showHeader && (
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <span className="luxury-badge" style={{ marginBottom: "14px" }}>
              ✦ OUR STORY ✦
            </span>
            <h2
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "clamp(32px, 4.5vw, 48px)",
                fontWeight: 500,
                color: "#261B13",
                lineHeight: 1.15,
                marginBottom: "16px",
              }}
            >
              The Legacy of Avsaraa
            </h2>
            <div className="section-divider" style={{ marginBottom: "20px" }} />
            <p
              style={{
                fontSize: "15.5px",
                color: "#6E5B4E",
                maxWidth: "680px",
                margin: "0 auto",
                lineHeight: 1.8,
              }}
            >
              Avsaraa is rooted in Surat, the textile heart of India. We craft and curate authentic ethnic wear, festive ensembles, and handloom sarees, bringing timeless Indian craftsmanship directly to your doorstep with insured delivery across India.
            </p>
          </div>
        )}

        {/* Gilded Stats Bar */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "54px",
          }}
        >
          {[
            { stat: "64+ Hours", label: "Artisan Loom Time Per Drape" },
            { stat: "100%", label: "Certified Pure Silk Guarantee" },
            { stat: "3 Hubs", label: "Varanasi, Chanderi & Surat Clusters" },
            { stat: "12,000+", label: "Patrons Across India & Abroad" },
          ].map((item, idx) => (
            <div
              key={idx}
              className="trust-pillar-card"
              style={{
                textAlign: "center",
                padding: "20px 16px",
              }}
            >
              <span
                style={{
                  display: "block",
                  fontFamily: "var(--font-serif), Georgia, serif",
                  fontSize: "28px",
                  fontWeight: 600,
                  color: "#261B13",
                  marginBottom: "4px",
                }}
              >
                {item.stat}
              </span>
              <span style={{ fontSize: "11.5px", color: "#8E7D70", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* 2-Column Minimal Layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "52px",
            alignItems: "center",
          }}
        >
          {/* Left: Photo Frame */}
          <div
            style={{
              padding: "10px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E6DACF",
              borderRadius: "24px",
              boxShadow: "0 20px 45px -12px rgba(38,27,19,0.1)",
            }}
          >
            <div
              style={{
                position: "relative",
                height: "clamp(340px, 42vw, 440px)",
                borderRadius: "18px",
                overflow: "hidden",
              }}
            >
              <Image
                src="/images/account_hero.jpg"
                alt="Avsaraa Handloom Weaves"
                fill
                priority
                sizes="(min-width: 900px) 500px, 90vw"
                style={{ objectFit: "cover", objectPosition: "center 20%" }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "16px",
                  left: "16px",
                  backgroundColor: "rgba(38, 27, 19, 0.88)",
                  backdropFilter: "blur(6px)",
                  WebkitBackdropFilter: "blur(6px)",
                  color: "#FAF7F2",
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  border: "1px solid rgba(197, 160, 89, 0.35)",
                }}
              >
                ✦ Surat, India • Handloom Atelier
              </div>
            </div>
          </div>

          {/* Right: 3 Pillars */}
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            {[
              {
                icon: <LoomWeaveIcon size={22} color="#866951" />,
                title: "Master Weavers of India",
                desc: "We partner directly with multigenerational weaving families across Varanasi, Chanderi, and Bengal. No synthetic blends, no power-loom shortcuts.",
              },
              {
                icon: <SilkSpoolIcon size={22} color="#866951" />,
                title: "Artisanal Blouse & Drape Matching",
                desc: "Every drape comes with carefully coordinated blouse fabric and trims, ensuring effortless sophistication for weddings and festive pujas.",
              },
              {
                icon: <NeedleThreadIcon size={22} color="#866951" />,
                title: "Hand Inspection & Finishing in Surat",
                desc: "Each piece is hand-inspected in our Surat studio for zari consistency, finished with fall & pico, and dispatched in our signature protective keepsake box.",
              },
            ].map((pillar, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: "18px",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #CFBEAD",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: "0 4px 12px rgba(38,27,19,0.04)",
                  }}
                >
                  {pillar.icon}
                </div>
                <div>
                  <h3
                    style={{
                      fontFamily: "var(--font-serif), Georgia, serif",
                      fontSize: "20px",
                      fontWeight: 600,
                      color: "#261B13",
                      marginBottom: "6px",
                    }}
                  >
                    {pillar.title}
                  </h3>
                  <p style={{ fontSize: "14px", color: "#6E5B4E", lineHeight: 1.7 }}>
                    {pillar.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
