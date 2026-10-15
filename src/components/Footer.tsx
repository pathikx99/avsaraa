"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AvsaraaLogo from "./AvsaraaLogo";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setEmail("");
    }
  };

  return (
    <footer style={{ backgroundColor: "#F7F2EE", borderTop: "1px solid #E6DACF", marginTop: "auto" }}>
      {/* 1. Newsletter Section (from Docs/WhatsApp Image 2026-10-13 at 11.40.33 AM.jpeg) */}
      <div
        style={{
          position: "relative",
          backgroundColor: "#F2EBE3",
          padding: "50px 24px 60px 24px",
          borderBottom: "1px solid #E6DACF",
          overflow: "hidden",
        }}
      >
        {/* Background botanical illustration */}
        <div
          style={{
            position: "absolute",
            right: "-40px",
            top: "-30px",
            width: "300px",
            height: "300px",
            pointerEvents: "none",
            opacity: 0.8,
            zIndex: 0,
          }}
        >
          <Image
            src="/images/botanical_flowers.jpg"
            alt=""
            fill
            sizes="300px"
            style={{ objectFit: "contain", mixBlendMode: "multiply" }}
          />
        </div>

        <div style={{ maxWidth: "800px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#866951",
              display: "block",
              marginBottom: "8px",
            }}
          >
            STAY IN THE LOOP
          </span>
          <h2
            style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontSize: "36px",
              fontWeight: 500,
              color: "#261B13",
              marginBottom: "10px",
            }}
          >
            Be the first to know
          </h2>
          <p style={{ fontSize: "14.5px", color: "#6E5B4E", marginBottom: "24px", maxWidth: "480px" }}>
            Get exclusive updates, new arrivals and special offers from Avsaraa.
          </p>

          <form
            onSubmit={handleSubscribe}
            style={{
              display: "flex",
              maxWidth: "520px",
              background: "#FFFFFF",
              border: "1px solid #CFBEAD",
              borderRadius: "8px",
              overflow: "hidden",
              boxShadow: "0 4px 15px rgba(38,27,19,0.04)",
            }}
          >
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                flex: 1,
                padding: "14px 18px",
                fontSize: "14px",
                color: "#261B13",
              }}
              required
            />
            <button
              type="submit"
              style={{
                backgroundColor: "#866951",
                color: "#FFFFFF",
                padding: "0 24px",
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {subscribed ? "Subscribed!" : "SUBSCRIBE →"}
            </button>
          </form>
        </div>
      </div>

      {/* 2. Main Footer Directory */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "60px 24px 40px 24px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "40px",
            marginBottom: "50px",
          }}
        >
          {/* Brand Column */}
          <div style={{ maxWidth: "300px" }}>
            <AvsaraaLogo size="md" width={175} />
            <p style={{ marginTop: "16px", fontSize: "13.5px", lineHeight: 1.6, color: "#6E5B4E" }}>
              Thoughtfully designed ethnic and western wear for every moment that matters.
            </p>

            {/* Social Icons */}
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              {["Instagram", "Pinterest", "Facebook", "YouTube"].map((network) => (
                <div
                  key={network}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    border: "1px solid #CFBEAD",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#261B13",
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  {network[0]}
                </div>
              ))}
            </div>
          </div>

          {/* NAVIGATION Column */}
          <div>
            <h3 style={{ fontSize: "12px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#866951", marginBottom: "16px", fontFamily: "var(--font-sans)", fontWeight: 600 }}>
              PAGES
            </h3>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px", color: "#4A3525" }}>
              <li><Link href="/">Home</Link></li>
              <li><Link href="/account">My Account</Link></li>
              <li><Link href="/login">Sign In</Link></li>
              <li><Link href="/register">Join Avsaraa</Link></li>
            </ul>
          </div>

          {/* ATELIER Column */}
          <div>
            <h3 style={{ fontSize: "12px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#866951", marginBottom: "16px", fontFamily: "var(--font-sans)", fontWeight: 600 }}>
              ATELIER
            </h3>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px", color: "#4A3525" }}>
              <li><Link href="/#about-us">About Us</Link></li>
              <li><Link href="/#about-us">Our Heritage</Link></li>
              <li><Link href="/#about-us">Artisanal Weaves</Link></li>
              <li><Link href="/account">Custom Tailoring</Link></li>
            </ul>
          </div>

          {/* CONCIERGE Column */}
          <div>
            <h3 style={{ fontSize: "12px", letterSpacing: "0.15em", textTransform: "uppercase", color: "#866951", marginBottom: "16px", fontFamily: "var(--font-sans)", fontWeight: 600 }}>
              CONCIERGE
            </h3>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px", color: "#4A3525" }}>
              <li><Link href="/#contact-us">Contact Us</Link></li>
              <li><Link href="/#contact-us">WhatsApp Stylist</Link></li>
              <li><Link href="/#contact-us">Atelier Visit</Link></li>
              <li><Link href="mailto:concierge@avsaraa.in">concierge@avsaraa.in</Link></li>
            </ul>
          </div>
        </div>

        {/* 3. Four Value Pillars from Docs/WhatsApp Image 2026-10-13 at 11.40.33 AM.jpeg */}
        <div
          style={{
            borderTop: "1px solid #E6DACF",
            borderBottom: "1px solid #E6DACF",
            padding: "36px 0",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "24px",
            textAlign: "center",
          }}
        >
          <div>
            <span style={{ fontSize: "24px", display: "block", marginBottom: "8px" }}>🚚</span>
            <h4 style={{ fontSize: "14px", fontWeight: 600, color: "#261B13", marginBottom: "4px", fontFamily: "var(--font-sans)" }}>Free Shipping</h4>
            <p style={{ fontSize: "12.5px", color: "#6E5B4E" }}>On all orders above ₹2,999</p>
          </div>
          <div>
            <span style={{ fontSize: "24px", display: "block", marginBottom: "8px" }}>📦</span>
            <h4 style={{ fontSize: "14px", fontWeight: 600, color: "#261B13", marginBottom: "4px", fontFamily: "var(--font-sans)" }}>Easy Returns</h4>
            <p style={{ fontSize: "12.5px", color: "#6E5B4E" }}>Within 7 days</p>
          </div>
          <div>
            <span style={{ fontSize: "24px", display: "block", marginBottom: "8px" }}>🛡️</span>
            <h4 style={{ fontSize: "14px", fontWeight: 600, color: "#261B13", marginBottom: "4px", fontFamily: "var(--font-sans)" }}>Secure Payments</h4>
            <p style={{ fontSize: "12.5px", color: "#6E5B4E" }}>100% safe & secure</p>
          </div>
          <div>
            <span style={{ fontSize: "24px", display: "block", marginBottom: "8px" }}>💎</span>
            <h4 style={{ fontSize: "14px", fontWeight: 600, color: "#261B13", marginBottom: "4px", fontFamily: "var(--font-sans)" }}>Premium Quality</h4>
            <p style={{ fontSize: "12.5px", color: "#6E5B4E" }}>Thoughtfully curated styles</p>
          </div>
        </div>

        {/* 4. Signature Calligraphy & Bottom Bar */}
        <div style={{ textAlign: "center", padding: "40px 0 20px 0" }}>
          <p
            style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontSize: "38px",
              fontStyle: "italic",
              color: "#543E2E",
              marginBottom: "8px",
            }}
          >
            Wear the moment.
          </p>
          <div style={{ width: "40px", height: "1px", backgroundColor: "#C4AB94", margin: "0 auto 30px auto" }} />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px",
              fontSize: "12.5px",
              color: "#7E6E62",
            }}
          >
            <span>© 2026 Avsaraa. All rights reserved.</span>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", fontWeight: 600, fontSize: "11px", letterSpacing: "0.05em", color: "#4A3525" }}>
              <span>VISA</span>
              <span>•</span>
              <span>MASTERCARD</span>
              <span>•</span>
              <span>RUPAY</span>
              <span>•</span>
              <span>UPI</span>
              <span>•</span>
              <span>PAYTM</span>
              <span>•</span>
              <span>APPLE PAY</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
