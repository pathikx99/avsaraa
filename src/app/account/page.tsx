"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "addresses" | "measurements" | "concierge">("profile");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#F7F2EE",
      }}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#261B13",
            color: "#FAF6F0",
            padding: "10px 22px",
            borderRadius: "10px",
            fontSize: "13px",
            zIndex: 1000,
            textAlign: "center",
            boxShadow: "0 8px 24px rgba(38, 27, 19, 0.35)",
            animation: "fadeIn 0.25s ease",
            maxWidth: "90vw",
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Official Header & Announcement Bar */}
      <Header />

      <main style={{ flex: 1, paddingBottom: "60px" }}>
        {/* Profile Header Hero */}
        <div
          style={{
            backgroundColor: "#FAF7F2",
            borderBottom: "1px solid #E6DACF",
            position: "relative",
            overflow: "hidden",
            padding: "36px 20px 28px 20px",
          }}
        >
          {/* Decorative Corner Flowers */}
          <div
            style={{
              position: "absolute",
              right: "-25px",
              top: "-25px",
              width: "140px",
              height: "140px",
              pointerEvents: "none",
              opacity: 0.75,
            }}
          >
            <Image
              src="/images/botanical_flowers.jpg"
              alt=""
              fill
              sizes="140px"
              style={{ objectFit: "contain", mixBlendMode: "multiply" }}
            />
          </div>

          <div
            style={{
              maxWidth: "880px",
              margin: "0 auto",
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* Breadcrumb */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "12px",
                color: "#866951",
                marginBottom: "20px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              <Link href="/" style={{ opacity: 0.7 }}>
                Home
              </Link>
              <span>›</span>
              <span style={{ fontWeight: 600, color: "#261B13" }}>My Account</span>
            </div>

            {/* Profile Info Card */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: "20px",
                flexWrap: "wrap",
              }}
            >
              {/* User Avatar */}
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #C4AB94 0%, #866951 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  fontFamily: "var(--font-serif), Georgia, serif",
                  fontSize: "26px",
                  fontWeight: 600,
                  boxShadow: "0 6px 20px rgba(134, 105, 81, 0.25)",
                  flexShrink: 0,
                }}
              >
                AS
              </div>

              {/* Name & Membership */}
              <div style={{ flex: 1, minWidth: "220px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
                  <h1
                    style={{
                      fontFamily: "var(--font-serif), Georgia, serif",
                      fontSize: "26px",
                      fontWeight: 600,
                      color: "#261B13",
                    }}
                  >
                    Ananya Sharma
                  </h1>
                  <span
                    style={{
                      backgroundColor: "#EFE6DC",
                      color: "#866951",
                      border: "1px solid #CFBEAD",
                      borderRadius: "20px",
                      padding: "3px 10px",
                      fontSize: "10.5px",
                      fontWeight: 600,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span>✦</span> PRIVILEGE MEMBER
                  </span>
                </div>
                <p style={{ fontSize: "13.5px", color: "#6E5B4E", marginBottom: "2px" }}>
                  +91 98765 43210 • ananya.sharma@example.com
                </p>
                <p style={{ fontSize: "12px", color: "#AC9885" }}>
                  Avsaraa Patron since October 2026
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "8px" }}>
                <Link
                  href="/login"
                  style={{
                    padding: "8px 16px",
                    border: "1px solid #CFBEAD",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#543E2E",
                    backgroundColor: "#FFFFFF",
                    transition: "all 0.2s ease",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>Sign Out</span>
                  <span style={{ fontSize: "14px" }}>→</span>
                </Link>
              </div>
            </div>

            {/* Account Quick Metrics */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "12px",
                marginTop: "24px",
              }}
            >
              {[
                { label: "Account Status", value: "Verified Active" },
                { label: "Saved Addresses", value: "1 Primary" },
                { label: "Tailoring Profile", value: "Saved" },
                { label: "Styling Session", value: "1 Booked" },
              ].map((stat, i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E8DED3",
                    borderRadius: "12px",
                    padding: "12px 16px",
                  }}
                >
                  <span style={{ display: "block", fontSize: "11px", color: "#8E7D70", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {stat.label}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-serif), Georgia, serif",
                      fontSize: "17px",
                      fontWeight: 600,
                      color: "#261B13",
                    }}
                  >
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Navigation (Horizontal Scrollable for Mobile) */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderBottom: "1px solid #E8DED3",
            position: "sticky",
            top: "57px",
            zIndex: 40,
          }}
        >
          <div
            className="no-scrollbar"
            style={{
              maxWidth: "880px",
              margin: "0 auto",
              padding: "0 16px",
              display: "flex",
              gap: "24px",
              overflowX: "auto",
              whiteSpace: "nowrap",
            }}
          >
            {[
              { id: "profile", label: "Profile Details" },
              { id: "addresses", label: "Saved Addresses" },
              { id: "measurements", label: "Custom Sizing" },
              { id: "concierge", label: "Stylist Concierge" },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  style={{
                    padding: "16px 4px",
                    fontSize: "13.5px",
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? "#261B13" : "#8E7D70",
                    borderBottom: isActive ? "2px solid #866951" : "2px solid transparent",
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Panels */}
        <div style={{ maxWidth: "880px", margin: "28px auto 0 auto", padding: "0 20px" }}>
          {/* 1. PROFILE DETAILS TAB */}
          {activeTab === "profile" && (
            <div className="fade-in-up" style={{ maxWidth: "640px", margin: "0 auto" }}>
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E8DED3",
                  borderRadius: "18px",
                  padding: "28px 24px",
                  boxShadow: "0 6px 24px -6px rgba(38,27,19,0.04)",
                }}
              >
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "22px", color: "#261B13", marginBottom: "16px" }}>
                  Personal Information
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "#8E7D70", display: "block" }}>Full Name</span>
                    <span style={{ fontSize: "14.5px", fontWeight: 600, color: "#261B13" }}>Ananya Sharma</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "#8E7D70", display: "block" }}>Mobile Number</span>
                    <span style={{ fontSize: "14.5px", fontWeight: 600, color: "#261B13" }}>+91 98765 43210</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "#8E7D70", display: "block" }}>Email Address</span>
                    <span style={{ fontSize: "14.5px", fontWeight: 600, color: "#261B13" }}>ananya.sharma@example.com</span>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", color: "#8E7D70", display: "block" }}>Membership Tier</span>
                    <span style={{ fontSize: "14.5px", fontWeight: 600, color: "#866951" }}>✦ Privilege Member</span>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid #EFE6DC", paddingTop: "16px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <Link
                    href="/#about-us"
                    className="avsaraa-btn-outline"
                    style={{ flex: 1, height: "42px", fontSize: "13px" }}
                  >
                    Read About Us
                  </Link>
                  <Link
                    href="/#contact-us"
                    className="avsaraa-btn-primary"
                    style={{ flex: 1, height: "42px", fontSize: "13px" }}
                  >
                    Contact Concierge
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* 2. ADDRESSES TAB */}
          {activeTab === "addresses" && (
            <div className="fade-in-up" style={{ maxWidth: "600px", margin: "0 auto" }}>
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E8DED3",
                  borderRadius: "16px",
                  padding: "24px",
                  marginBottom: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontWeight: 600, fontSize: "14px", color: "#261B13" }}>Home (Primary)</span>
                    <span style={{ backgroundColor: "#EFE6DC", color: "#866951", fontSize: "10px", padding: "2px 8px", borderRadius: "10px", fontWeight: 600 }}>
                      DEFAULT
                    </span>
                  </div>
                  <button onClick={() => showToast("Edit address")} style={{ fontSize: "12px", color: "#866951", textDecoration: "underline" }}>
                    Edit
                  </button>
                </div>
                <p style={{ fontSize: "13.5px", color: "#4A3525", lineHeight: 1.6, marginBottom: "8px" }}>
                  Ananya Sharma<br />
                  Flat 402, Lotus Grand Residences, Linking Road, Bandra West<br />
                  Mumbai, Maharashtra - 400050<br />
                  Phone: +91 98765 43210
                </p>
              </div>

              <button
                onClick={() => showToast("Add new address dialog")}
                className="avsaraa-btn-outline"
                style={{ width: "100%", height: "48px", fontSize: "13.5px" }}
              >
                + Add New Address
              </button>
            </div>
          )}

          {/* 3. MEASUREMENTS TAB */}
          {activeTab === "measurements" && (
            <div className="fade-in-up" style={{ maxWidth: "600px", margin: "0 auto" }}>
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E8DED3",
                  borderRadius: "16px",
                  padding: "24px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                  <span style={{ fontSize: "20px" }}>✂️</span>
                  <div>
                    <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "20px", color: "#261B13" }}>
                      Atelier Tailoring Profile
                    </h3>
                    <p style={{ fontSize: "12px", color: "#8E7D70" }}>
                      Saved for bespoke blouse & drape customizations
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "14px",
                    marginBottom: "20px",
                  }}
                >
                  {[
                    { label: "Bust Size", value: "36 in" },
                    { label: "Waist Size", value: "30 in" },
                    { label: "Blouse Length", value: "14.5 in" },
                    { label: "Sleeve Length", value: "Elbow (11 in)" },
                    { label: "Front Neck Depth", value: "7.5 in" },
                    { label: "Height", value: "5 ft 6 in" },
                  ].map((measure, i) => (
                    <div key={i} style={{ backgroundColor: "#FAF7F2", padding: "12px 14px", borderRadius: "10px", border: "1px solid #EFE6DC" }}>
                      <span style={{ fontSize: "11px", color: "#8E7D70", display: "block" }}>{measure.label}</span>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "#261B13" }}>{measure.value}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => showToast("Tailoring preferences saved")}
                  className="avsaraa-btn-primary"
                  style={{ height: "46px", fontSize: "13px" }}
                >
                  Update Measurements
                </button>
              </div>
            </div>
          )}

          {/* 4. CONCIERGE TAB */}
          {activeTab === "concierge" && (
            <div className="fade-in-up" style={{ maxWidth: "600px", margin: "0 auto" }}>
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E8DED3",
                  borderRadius: "16px",
                  padding: "28px 24px",
                  textAlign: "center",
                }}
              >
                <span style={{ fontSize: "32px", display: "block", marginBottom: "12px" }}>👑</span>
                <h3
                  style={{
                    fontFamily: "var(--font-serif), Georgia, serif",
                    fontSize: "24px",
                    color: "#261B13",
                    marginBottom: "8px",
                  }}
                >
                  Avsaraa Private Concierge
                </h3>
                <p style={{ fontSize: "13.5px", color: "#6E5B4E", lineHeight: 1.6, marginBottom: "24px" }}>
                  Need personalized advice for bridal wear, wedding festivities, or bespoke color pairings? Our master stylists are available via WhatsApp and private video consultations.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <button
                    onClick={() => showToast("Opening Avsaraa WhatsApp Stylist Concierge...")}
                    className="avsaraa-btn-primary"
                    style={{ height: "48px", fontSize: "13.5px", backgroundColor: "#261B13" }}
                  >
                    💬 Chat with Stylist on WhatsApp
                  </button>
                  <button
                    onClick={() => showToast("Booking request submitted for Virtual Consultation")}
                    className="avsaraa-btn-outline"
                    style={{ height: "48px", fontSize: "13.5px" }}
                  >
                    📅 Schedule 1-on-1 Virtual Consultation
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Official Footer */}
      <Footer />
    </div>
  );
}
