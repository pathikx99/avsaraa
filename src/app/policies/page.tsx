import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ShieldCheckIcon, DeliveryVanIcon, ReturnBoxIcon, MailIcon, LocationPinIcon, FlourishDivider } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Policies & Legal Hub | AVSARAA",
  description: "Browse AVSARAA's official consumer policies: Privacy Policy, Terms & Conditions, Shipping & Delivery, and Return, Exchange & Refund Policy.",
};

const POLICIES = [
  {
    title: "Privacy Policy",
    href: "/privacy",
    badge: "DATA PROTECTION",
    description: "Learn how AVSARAA collects, uses, protects, and stores your personal information, WhatsApp messaging, and Razorpay payment details.",
    icon: <ShieldCheckIcon size={24} color="#866951" />,
    features: ["WhatsApp & Email Communications", "Razorpay Payment Handling", "User Privacy Rights & Choices"],
  },
  {
    title: "Terms & Conditions",
    href: "/terms",
    badge: "LEGAL AGREEMENT",
    description: "The official terms governing website browsing, ordering authentic handloom apparel, pricing, user eligibility, and governing jurisdiction.",
    icon: <ShieldCheckIcon size={24} color="#866951" />,
    features: ["Account & Order Acceptance", "Payment & Pricing Terms", "Governing Law (Gujarat, India)"],
  },
  {
    title: "Shipping & Delivery Policy",
    href: "/shipping",
    badge: "LOGISTICS & DISPATCH",
    description: "Information regarding Shiprocket courier logistics, free shipping on prepaid orders, ₹20 COD handling charge, and tracking procedures.",
    icon: <DeliveryVanIcon size={24} color="#866951" />,
    features: ["Free Pan-India Prepaid Delivery ₹799+", "₹20 Cash on Delivery Charge", "Real-Time Courier Tracking"],
  },
  {
    title: "Return, Exchange & Refund Policy",
    href: "/returns",
    badge: "CUSTOMER SATISFACTION",
    description: "Our policy on size exchanges, design changes, price differences, and refund claims strictly for verified damaged shipments.",
    icon: <ReturnBoxIcon size={24} color="#866951" />,
    features: ["Hassle-Free Size/Design Exchange", "Price Difference Adjustments", "Damaged Product Claim Protocol"],
  },
];

export default function PoliciesHubPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#FAF7F2" }}>
      <Header />

      <main style={{ flex: 1 }}>
        {/* Editorial Header */}
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
            <span style={{ color: "#FAF7F2", fontWeight: 600 }}>Policies</span>
          </nav>

          <span
            className="luxury-badge"
            style={{
              marginBottom: "14px",
              backgroundColor: "rgba(196, 171, 148, 0.15)",
              color: "#E2D7CC",
              border: "1px solid rgba(196, 171, 148, 0.3)",
            }}
          >
            ✦ OFFICIAL CONSUMER GUIDELINES ✦
          </span>

          <h1
            style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontSize: "clamp(32px, 5vw, 50px)",
              fontWeight: 500,
              lineHeight: 1.15,
              marginBottom: "14px",
              color: "#FAF7F2",
            }}
          >
            Policies &amp; Legal
          </h1>

          <p
            style={{
              fontSize: "15px",
              color: "#D6C7B8",
              maxWidth: "600px",
              margin: "0 auto 16px auto",
              lineHeight: 1.65,
            }}
          >
            Explore our policies covering customer privacy, order fulfillment, return &amp; exchange processes, and terms of service.
          </p>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "12px",
              padding: "4px 14px",
              borderRadius: "20px",
              backgroundColor: "rgba(196, 171, 148, 0.12)",
              color: "#E6DACF",
              border: "1px solid rgba(196, 171, 148, 0.25)",
            }}
          >
            <span>Effective Date: 15 November 2026</span>
          </div>
        </section>

        {/* 4-Card Luxury Directory Grid */}
        <section style={{ maxWidth: "1140px", margin: "0 auto", padding: "54px 24px 64px 24px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "28px",
            }}
          >
            {POLICIES.map((pol) => (
              <div
                key={pol.href}
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E6DACF",
                  borderRadius: "14px",
                  padding: "32px 26px",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "0 4px 20px rgba(38,27,19,0.03)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      border: "1px solid #CFBEAD",
                      backgroundColor: "#FAF7F2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {pol.icon}
                  </div>
                  <span
                    style={{
                      fontSize: "10.5px",
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "#866951",
                      backgroundColor: "#F7F2EE",
                      padding: "4px 10px",
                      borderRadius: "6px",
                    }}
                  >
                    {pol.badge}
                  </span>
                </div>

                <h2
                  style={{
                    fontFamily: "var(--font-serif), Georgia, serif",
                    fontSize: "22px",
                    color: "#261B13",
                    marginBottom: "10px",
                    fontWeight: 600,
                  }}
                >
                  {pol.title}
                </h2>

                <p style={{ fontSize: "13.5px", color: "#6E5B4E", lineHeight: 1.6, marginBottom: "20px", flex: 1 }}>
                  {pol.description}
                </p>

                <ul style={{ listStyle: "none", margin: "0 0 24px 0", padding: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
                  {pol.features.map((feat) => (
                    <li key={feat} style={{ fontSize: "12px", color: "#543E2E", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ color: "#866951" }}>✦</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={pol.href}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "12px 18px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#FFFFFF",
                    backgroundColor: "#261B13",
                    borderRadius: "8px",
                    textDecoration: "none",
                    textAlign: "center",
                    transition: "background-color 0.2s ease",
                  }}
                >
                  <span>Read Complete Policy</span>
                  <span>→</span>
                </Link>
              </div>
            ))}
          </div>

          {/* Grievance & Concierge Redressal Box */}
          <div
            style={{
              marginTop: "48px",
              padding: "28px 24px",
              backgroundColor: "#F7F2EE",
              border: "1px solid #E6DACF",
              borderRadius: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#866951" }}>
                  QUESTIONS OR GRIEVANCES
                </span>
                <h3 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "20px", color: "#261B13", marginTop: "2px" }}>
                  AVSARAA Concierge Support
                </h3>
              </div>
              <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                <a
                  href="mailto:info.avsaraa@gmail.com"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#261B13",
                    backgroundColor: "#FAF7F2",
                    border: "1px solid #CFBEAD",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    textDecoration: "none",
                  }}
                >
                  <MailIcon size={15} color="#866951" />
                  info.avsaraa@gmail.com
                </a>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                    color: "#6E5B4E",
                    padding: "8px 14px",
                  }}
                >
                  <LocationPinIcon size={15} color="#866951" />
                  Gujarat, India
                </div>
              </div>
            </div>

            <FlourishDivider color="#C4AB94" />

            <p
              style={{
                textAlign: "center",
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "17px",
                fontStyle: "italic",
                color: "#543E2E",
                margin: 0,
              }}
            >
              AVSARAA — WEAR THE MOMENT.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
