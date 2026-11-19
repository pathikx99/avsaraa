"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { MailIcon, LocationPinIcon, ShieldCheckIcon, DeliveryVanIcon, ReturnBoxIcon, FlourishDivider } from "@/components/Icons";

export interface TocItem {
  id: string;
  label: string;
}

interface PolicyPageLayoutProps {
  activePolicy: "privacy" | "terms" | "shipping" | "returns";
  title: string;
  badge?: string;
  description?: string;
  tableOfContents?: TocItem[];
  children: React.ReactNode;
}

const POLICY_TABS = [
  { key: "privacy", label: "Privacy Policy", href: "/privacy", icon: <ShieldCheckIcon size={14} color="currentColor" /> },
  { key: "terms", label: "Terms & Conditions", href: "/terms", icon: <ShieldCheckIcon size={14} color="currentColor" /> },
  { key: "shipping", label: "Shipping & Delivery", href: "/shipping", icon: <DeliveryVanIcon size={14} color="currentColor" /> },
  { key: "returns", label: "Return & Exchange", href: "/returns", icon: <ReturnBoxIcon size={14} color="currentColor" /> },
];

export default function PolicyPageLayout({
  activePolicy,
  title,
  badge = "LEGAL & POLICIES",
  description = "Official guidelines and consumer policies for shopping at AVSARAA.",
  tableOfContents = [],
  children,
}: PolicyPageLayoutProps) {
  const [activeSection, setActiveSection] = useState<string>("");

  useEffect(() => {
    if (tableOfContents.length === 0) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 180;
      for (let i = tableOfContents.length - 1; i >= 0; i--) {
        const el = document.getElementById(tableOfContents[i].id);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSection(tableOfContents[i].id);
          return;
        }
      }
      if (tableOfContents[0]) {
        setActiveSection(tableOfContents[0].id);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [tableOfContents]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#FAF7F2" }}>
      <Header />

      <main style={{ flex: 1 }}>
        {/* Editorial Hero Banner */}
        <section
          style={{
            backgroundColor: "#261B13",
            color: "#FAF7F2",
            padding: "54px 24px 44px 24px",
            textAlign: "center",
            position: "relative",
            borderBottom: "1px solid #3E2D22",
          }}
        >
          {/* Breadcrumb Navigation */}
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
            <Link href="/policies" style={{ color: "#C4AB94", textDecoration: "none" }}>
              Policies
            </Link>
            <span>/</span>
            <span style={{ color: "#FAF7F2", fontWeight: 600 }}>{title}</span>
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
            ✦ {badge} ✦
          </span>

          <h1
            style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontSize: "clamp(30px, 4.5vw, 48px)",
              fontWeight: 500,
              lineHeight: 1.2,
              marginBottom: "12px",
              color: "#FAF7F2",
            }}
          >
            {title}
          </h1>

          <p
            style={{
              fontSize: "14.5px",
              color: "#D6C7B8",
              maxWidth: "600px",
              margin: "0 auto 16px auto",
              lineHeight: 1.6,
            }}
          >
            {description}
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

        {/* Policy Switcher Tabs */}
        <section
          style={{
            backgroundColor: "#F2EBE3",
            borderBottom: "1px solid #E6DACF",
            position: "sticky",
            top: "60px",
            zIndex: 30,
            boxShadow: "0 2px 10px rgba(38,27,19,0.03)",
          }}
        >
          <div
            style={{
              maxWidth: "1140px",
              margin: "0 auto",
              padding: "0 16px",
              display: "flex",
              gap: "8px",
              overflowX: "auto",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {POLICY_TABS.map((tab) => {
              const isActive = tab.key === activePolicy;
              return (
                <Link
                  key={tab.key}
                  href={tab.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "14px 18px",
                    fontSize: "13px",
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? "#261B13" : "#6E5B4E",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    borderBottom: isActive ? "2.5px solid #866951" : "2.5px solid transparent",
                    backgroundColor: isActive ? "#FAF7F2" : "transparent",
                    transition: "all 0.2s ease",
                  }}
                >
                  <span style={{ color: isActive ? "#866951" : "#AC9885" }}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Content Layout with Table of Contents Sidebar */}
        <div
          style={{
            maxWidth: "1140px",
            margin: "0 auto",
            padding: "48px 24px 64px 24px",
            display: "grid",
            gridTemplateColumns: tableOfContents.length > 0 ? "260px 1fr" : "1fr",
            gap: "48px",
            alignItems: "start",
          }}
          className="policy-container-grid"
        >
          {/* Table of Contents Sticky Aside (Hidden on small screens via CSS) */}
          {tableOfContents.length > 0 && (
            <aside
              style={{
                position: "sticky",
                top: "128px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E6DACF",
                borderRadius: "14px",
                padding: "20px",
                boxShadow: "0 4px 18px rgba(38,27,19,0.03)",
                maxHeight: "calc(100vh - 160px)",
                overflowY: "auto",
              }}
              className="policy-toc-sidebar"
            >
              <h3
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#866951",
                  marginBottom: "14px",
                  paddingBottom: "8px",
                  borderBottom: "1px solid #F0E6DE",
                }}
              >
                Table of Contents
              </h3>
              <nav aria-label="Table of contents">
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "6px", margin: 0, padding: 0 }}>
                  {tableOfContents.map((item, idx) => {
                    const isCurrent = activeSection === item.id;
                    return (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            const target = document.getElementById(item.id);
                            if (target) {
                              const y = target.getBoundingClientRect().top + window.scrollY - 130;
                              window.scrollTo({ top: y, behavior: "smooth" });
                            }
                          }}
                          style={{
                            display: "block",
                            fontSize: "12.5px",
                            lineHeight: 1.45,
                            color: isCurrent ? "#866951" : "#543E2E",
                            fontWeight: isCurrent ? 600 : 400,
                            padding: "5px 8px",
                            borderRadius: "6px",
                            backgroundColor: isCurrent ? "#F7F2EE" : "transparent",
                            textDecoration: "none",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <span style={{ color: "#AC9885", marginRight: "6px", fontSize: "11px" }}>{idx + 1}.</span>
                          {item.label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </aside>
          )}

          {/* Main Document Content */}
          <article
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E6DACF",
              borderRadius: "16px",
              padding: "40px clamp(20px, 4vw, 48px)",
              boxShadow: "0 6px 24px rgba(38,27,19,0.03)",
              lineHeight: 1.7,
              color: "#38291F",
            }}
          >
            {children}

            {/* Official Brand Sign-off & Concierge Redressal Box */}
            <div
              style={{
                marginTop: "48px",
                padding: "28px 24px",
                backgroundColor: "#F7F2EE",
                border: "1px solid #E6DACF",
                borderRadius: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#866951" }}>
                    SUPPORT &amp; GRIEVANCE CONTACT
                  </span>
                  <h4 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "20px", color: "#261B13", marginTop: "2px" }}>
                    AVSARAA Concierge
                  </h4>
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
                    Surat, Gujarat, India
                  </div>
                </div>
              </div>

              <p style={{ fontSize: "12.5px", color: "#6E5B4E", margin: 0, lineHeight: 1.6 }}>
                Please include your order reference number, contact details, and relevant specifics so our team can assist you promptly within the timelines required by applicable law.
              </p>

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
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
