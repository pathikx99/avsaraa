"use client";

import React from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactSection from "@/components/ContactSection";

export default function ContactPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#F7F2EE" }}>
      <Header />

      <main style={{ flex: 1 }}>
        {/* Editorial Breadcrumb & Header Banner */}
        <section
          style={{
            backgroundColor: "#261B13",
            color: "#FAF7F2",
            padding: "54px 24px 48px 24px",
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
            <span style={{ color: "#FAF7F2", fontWeight: 600 }}>Contact Us</span>
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
            ✦ CONCIERGE & SUPPORT ✦
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
            Get in Touch
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
            Have a question about our handloom weaves, shipping, or need personal styling advice? We are here to assist you.
          </p>
        </section>

        {/* Contact Form & Studio Details */}
        <ContactSection showHeader={false} />
      </main>

      <Footer />
    </div>
  );
}
