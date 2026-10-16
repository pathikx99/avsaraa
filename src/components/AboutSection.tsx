"use client";

import React from "react";
import Image from "next/image";
import { LoomWeaveIcon, SilkSpoolIcon, NeedleThreadIcon } from "./Icons";

export default function AboutSection() {
  return (
    <section
      id="about"
      style={{
        backgroundColor: "#FAF7F2",
        padding: "80px 24px",
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
          opacity: 0.5,
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
            About Avsaraa
          </h2>
          <div style={{ width: "48px", height: "1.5px", backgroundColor: "#C4AB94", margin: "0 auto 20px auto" }} />
          <p
            style={{
              fontSize: "15px",
              color: "#6E5B4E",
              maxWidth: "680px",
              margin: "0 auto",
              lineHeight: 1.8,
            }}
          >
            Avsaraa is inspired by special moments and family celebrations. We bring you authentic Indian handloom sarees and sets that are comfortable, timeless, and made to last.
          </p>
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
                height: "clamp(320px, 40vw, 420px)",
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
                  color: "#FAF7F2",
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                ✦ Handcrafted in India
              </div>
            </div>
          </div>

          {/* Right: 3 Simple Points */}
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            {[
              {
                icon: <LoomWeaveIcon size={22} color="#866951" />,
                title: "Master Weavers",
                desc: "We work directly with traditional weaving families in Varanasi, Chanderi, and Bengal to bring you pure, authentic silks.",
              },
              {
                icon: <SilkSpoolIcon size={22} color="#866951" />,
                title: "Matching Sets",
                desc: "We thoughtfully pair blouses, sarees, and dupattas so your festive outfit is complete and easy to wear.",
              },
              {
                icon: <NeedleThreadIcon size={22} color="#866951" />,
                title: "Finishing & Quality",
                desc: "Every drape is checked and finished by hand at our Mumbai studio so it feels perfect when you wear it.",
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
