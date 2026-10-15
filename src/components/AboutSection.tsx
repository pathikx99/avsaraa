"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function AboutSection() {
  return (
    <section
      id="about-us"
      style={{
        backgroundColor: "#FAF7F2",
        borderTop: "1px solid #E6DACF",
        borderBottom: "1px solid #E6DACF",
        padding: "60px 20px 70px 20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative Botanical Flourish */}
      <div
        style={{
          position: "absolute",
          right: "-30px",
          top: "-30px",
          width: "220px",
          height: "220px",
          pointerEvents: "none",
          opacity: 0.7,
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

      <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Section Header */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#866951",
              display: "block",
              marginBottom: "8px",
            }}
          >
            OUR HERITAGE & VISION
          </span>
          <h2
            style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontSize: "clamp(30px, 4.5vw, 44px)",
              fontWeight: 500,
              color: "#261B13",
              lineHeight: 1.2,
              marginBottom: "12px",
            }}
          >
            The Avsaraa Story
          </h2>
          <div style={{ width: "40px", height: "1px", backgroundColor: "#C4AB94", margin: "0 auto 16px auto" }} />
          <p
            style={{
              fontSize: "15px",
              color: "#6E5B4E",
              maxWidth: "680px",
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            Rooted in the Sanskrit word for <em>auspicious moment</em>, Avsaraa was born to celebrate the poetry of Indian handlooms — pairing timeless artisanal craftsmanship with effortless contemporary silhouettes.
          </p>
        </div>

        {/* 2-Column Editorial Story */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "40px",
            alignItems: "center",
            marginBottom: "50px",
          }}
        >
          {/* Editorial Visual */}
          <div
            style={{
              position: "relative",
              height: "clamp(340px, 45vw, 440px)",
              borderRadius: "24px",
              overflow: "hidden",
              boxShadow: "0 15px 40px -10px rgba(38,27,19,0.12)",
              backgroundColor: "#261B13",
            }}
          >
            <Image
              src="/images/saree_model_hero.jpg"
              alt="Avsaraa Master Craftsman Saree"
              fill
              sizes="(min-width: 900px) 500px, 100vw"
              style={{ objectFit: "cover", objectPosition: "center 20%" }}
            />
            {/* Subtle Gradient & Quote Overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to top, rgba(38,27,19,0.85) 0%, transparent 60%)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                padding: "24px",
                color: "#FFFFFF",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-serif), Georgia, serif",
                  fontSize: "20px",
                  fontStyle: "italic",
                  lineHeight: 1.3,
                  marginBottom: "4px",
                }}
              >
                &ldquo;Every drape tells a story of hands that weave devotion.&rdquo;
              </p>
              <span style={{ fontSize: "12px", color: "#C4AB94", letterSpacing: "0.08em" }}>
                AVSARAA WEAVING GUILD, BANARAS & CHANDERI
              </span>
            </div>
          </div>

          {/* Narrative Story */}
          <div>
            <h3
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "28px",
                fontWeight: 500,
                color: "#261B13",
                marginBottom: "14px",
                lineHeight: 1.3,
              }}
            >
              Where Ancient Weaves Meet Modern Ease
            </h3>
            <p
              style={{
                fontSize: "14.5px",
                lineHeight: 1.7,
                color: "#543E2E",
                marginBottom: "16px",
              }}
            >
              We believe getting dressed for weddings, festivities, or intimate gatherings should feel as serene as it is stunning. Too often, styling traditional Indian ethnic wear feels overwhelming — matching blouse cuts, selecting dupattas, and coordinating fabrics.
            </p>
            <p
              style={{
                fontSize: "14.5px",
                lineHeight: 1.7,
                color: "#543E2E",
                marginBottom: "24px",
              }}
            >
              Avsaraa curates harmonious, complete looks where every piece is thoughtfully paired by our master stylists. From pure mulberry silks to ethereal Chanderi cottons, each garment honors ethical artisan livelihoods while delivering an impeccable fit tailored to you.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
              <Link
                href="/register"
                className="avsaraa-btn-primary"
                style={{
                  display: "inline-flex",
                  width: "auto",
                  padding: "0 28px",
                  height: "46px",
                  fontSize: "13px",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Join the Atelier Circle →
              </Link>
              <Link
                href="/#contact-us"
                className="avsaraa-btn-outline"
                style={{
                  display: "inline-flex",
                  width: "auto",
                  padding: "0 24px",
                  height: "46px",
                  fontSize: "13px",
                  backgroundColor: "#FFFFFF",
                }}
              >
                Contact Our Stylists
              </Link>
            </div>
          </div>
        </div>

        {/* Three Brand Pillars */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "24px",
          }}
        >
          {[
            {
              icon: "🪡",
              title: "Artisanal Integrity",
              desc: "Collaborating directly with generational weaving clusters in Varanasi, Bengal, and Rajasthan to safeguard living heritage.",
            },
            {
              icon: "✨",
              title: "Effortless Coordination",
              desc: "Complete pre-styled ensembles uniting tops, bottoms, and dupattas with flawless color theory and drape perfection.",
            },
            {
              icon: "🌿",
              title: "Bespoke Tailoring",
              desc: "Every silhouette is tailored to individual measurements at our Mumbai atelier, ensuring elegance without compromise.",
            },
          ].map((pillar, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E8DED3",
                borderRadius: "18px",
                padding: "28px 24px",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
            >
              <span style={{ fontSize: "28px", display: "block", marginBottom: "12px" }}>{pillar.icon}</span>
              <h4
                style={{
                  fontFamily: "var(--font-serif), Georgia, serif",
                  fontSize: "20px",
                  color: "#261B13",
                  marginBottom: "8px",
                }}
              >
                {pillar.title}
              </h4>
              <p style={{ fontSize: "13.5px", color: "#6E5B4E", lineHeight: 1.6 }}>
                {pillar.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
