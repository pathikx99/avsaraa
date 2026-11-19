"use client";

import React from "react";
import { RevealSection } from "@/components/RevealSection";

const BENEFITS = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="1" />
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
        <circle cx="5.5" cy="18.5" r="2.5" />
        <circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    title: "Free Express Shipping",
    subtitle: "Complimentary priority delivery on all prepaid orders across India.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
        <path d="M12 15h2" />
      </svg>
    ),
    title: "Cash on Delivery",
    subtitle: "Flexible COD payment available across 18,000+ verified PIN codes.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1 4 1 10 7 10" />
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
      </svg>
    ),
    title: "Easy 7-Day Returns",
    subtitle: "Hassle-free doorstep exchange and returns guarantee for complete peace of mind.",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
    title: "Archival Keepsake Box",
    subtitle: "Hand-wrapped in luxury tissue, rigid keepsake box, and aromatic cedar sachet.",
  },
];

export default function ShoppingBenefits() {
  return (
    <section
      id="shopping-benefits"
      style={{
        backgroundColor: "#F7F2EB",
        borderTop: "1px solid rgba(197, 160, 89, 0.25)",
        borderBottom: "1px solid rgba(197, 160, 89, 0.25)",
        padding: "54px 20px",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
            gap: "20px",
          }}
        >
          {BENEFITS.map((item, idx) => (
            <RevealSection key={item.title} delay={idx * 60}>
              <div
                className="luxury-hover-card"
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "16px",
                  padding: "18px 20px",
                  backgroundColor: "#FFFFFF",
                  borderRadius: "16px",
                  border: "1px solid rgba(230, 218, 207, 0.85)",
                  boxShadow: "0 4px 18px -4px rgba(38, 27, 19, 0.05)",
                  height: "100%",
                  transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease, border-color 0.3s ease",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, rgba(236, 200, 128, 0.22) 0%, rgba(197, 160, 89, 0.08) 100%)",
                    border: "1px solid rgba(197, 160, 89, 0.4)",
                    color: "#6D4E39",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: "0 2px 8px rgba(197, 160, 89, 0.12)",
                  }}
                >
                  {item.icon}
                </div>

                <div>
                  <h3
                    style={{
                      fontFamily: "var(--font-serif), Georgia, serif",
                      fontSize: "17px",
                      fontWeight: 600,
                      color: "#261B13",
                      marginBottom: "4px",
                      lineHeight: 1.3,
                    }}
                  >
                    {item.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "12.5px",
                      color: "#6E5B4E",
                      margin: 0,
                      lineHeight: 1.55,
                    }}
                  >
                    {item.subtitle}
                  </p>
                </div>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  );
}
