"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import AvsaraaLogo from "./AvsaraaLogo";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import {
  DeliveryVanIcon,
  ReturnBoxIcon,
  ShieldCheckIcon,
  DiamondCrownIcon,
  InstagramIcon,
  PinterestIcon,
  FacebookIcon,
  YoutubeIcon,
} from "./Icons";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const { error } = await supabase.from("newsletter_subscribers").insert([
        {
          email: cleanEmail,
          source: "Website Footer",
        },
      ]);

      if (error && error.code === "23505") {
        setStatusMessage("You are already subscribed!");
        setSubscribed(true);
      } else {
        setSubscribed(true);
        setStatusMessage("Thank you for subscribing! Welcome to Avsaraa.");
      }
      setEmail("");
    } catch {
      setSubscribed(true);
      setStatusMessage("Thank you for subscribing!");
      setEmail("");
    } finally {
      setIsSubmitting(false);
      setTimeout(() => {
        setSubscribed(false);
        setStatusMessage(null);
      }, 5000);
    }
  };

  return (
    <footer style={{ backgroundColor: "#F7F2EE", borderTop: "1px solid #E6DACF", marginTop: "auto" }}>
      {/* 1. Newsletter Section */}
      <div
        style={{
          position: "relative",
          backgroundColor: "#F2EBE3",
          padding: "54px 24px 60px 24px",
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
            width: "280px",
            height: "280px",
            pointerEvents: "none",
            opacity: 0.7,
            zIndex: 0,
          }}
        >
          <Image
            src="/images/botanical_flowers.jpg"
            alt=""
            fill
            sizes="280px"
            style={{ objectFit: "contain", mixBlendMode: "multiply" }}
          />
        </div>

        <div style={{ maxWidth: "760px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#866951",
              display: "block",
              marginBottom: "8px",
            }}
          >
            NEWSLETTER
          </span>
          <h2
            style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontSize: "clamp(28px, 4vw, 36px)",
              fontWeight: 500,
              color: "#261B13",
              marginBottom: "8px",
            }}
          >
            Stay in Touch
          </h2>
          <p style={{ fontSize: "14px", color: "#6E5B4E", marginBottom: "22px", maxWidth: "460px" }}>
            Get updates on new saree collections, special offers, and styling tips from Avsaraa.
          </p>

          <form
            onSubmit={handleSubscribe}
            className="newsletter-input"
            style={{
              display: "flex",
              maxWidth: "500px",
              background: "#FFFFFF",
              border: "1px solid #CFBEAD",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 4px 15px rgba(38,27,19,0.04)",
              transition: "all 0.3s ease",
            }}
          >
            <input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                flex: 1,
                padding: "13px 18px",
                fontSize: "13.5px",
                color: "#261B13",
                border: "none",
                outline: "none",
              }}
              required
            />
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                backgroundColor: "#866951",
                color: "#FFFFFF",
                padding: "0 22px",
                fontSize: "11.5px",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: isSubmitting ? 0.75 : 1,
                border: "none",
              }}
            >
              {isSubmitting ? "SAVING..." : subscribed ? "SUBSCRIBED! ✓" : "SUBSCRIBE →"}
            </button>
          </form>
          {statusMessage && (
            <p style={{ marginTop: "10px", fontSize: "13px", color: "#6E5B4E", fontWeight: 500 }}>
              {statusMessage}
            </p>
          )}
        </div>
      </div>

      {/* 2. Main Footer Directory */}
      <div style={{ maxWidth: "1140px", margin: "0 auto", padding: "56px 24px 36px 24px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "36px",
            marginBottom: "46px",
          }}
        >
          {/* Brand Column */}
          <div style={{ maxWidth: "300px" }}>
            <AvsaraaLogo size="md" width={160} />
            <p style={{ marginTop: "14px", fontSize: "13.5px", lineHeight: 1.6, color: "#6E5B4E" }}>
              Thoughtfully designed ethnic and festive wear for every special moment.
            </p>

            {/* Social Icons with SVG */}
            <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
              {[
                { name: "Instagram", icon: <InstagramIcon size={16} color="#261B13" /> },
                { name: "Pinterest", icon: <PinterestIcon size={16} color="#261B13" /> },
                { name: "Facebook", icon: <FacebookIcon size={16} color="#261B13" /> },
                { name: "YouTube", icon: <YoutubeIcon size={16} color="#261B13" /> },
              ].map((item) => (
                <div
                  key={item.name}
                  aria-label={item.name}
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    border: "1px solid #CFBEAD",
                    backgroundColor: "#FAF7F2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  {item.icon}
                </div>
              ))}
            </div>
          </div>

          {/* PAGES Column */}
          <div>
            <h3 style={{ fontSize: "11.5px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#866951", marginBottom: "16px", fontFamily: "var(--font-sans)", fontWeight: 600 }}>
              PAGES
            </h3>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", fontSize: "13.5px", color: "#4A3525" }}>
              <li><Link href="/" className="luxury-nav-link">Home</Link></li>
              <li><Link href="/products" className="luxury-nav-link">Products</Link></li>
              <li><Link href="/products/styles" className="luxury-nav-link">Styles</Link></li>
              <li><Link href="/about" className="luxury-nav-link">About Us</Link></li>
              <li><Link href="/contact" className="luxury-nav-link">Contact Us</Link></li>
              <li><Link href="/wishlist" className="luxury-nav-link">Wishlist</Link></li>
              {user && <li><Link href="/account" className="luxury-nav-link">My Account</Link></li>}
            </ul>
          </div>

          {/* ABOUT Column */}
          <div>
            <h3 style={{ fontSize: "11.5px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#866951", marginBottom: "16px", fontFamily: "var(--font-sans)", fontWeight: 600 }}>
              ABOUT
            </h3>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", fontSize: "13.5px", color: "#4A3525" }}>
              <li><Link href="/about">Our Story</Link></li>
              <li><Link href="/about">Handmade Silks</Link></li>
              <li><Link href="/contact">Surat Studio & Online Store</Link></li>
            </ul>
          </div>

          {/* HELP Column */}
          <div>
            <h3 style={{ fontSize: "11.5px", letterSpacing: "0.14em", textTransform: "uppercase", color: "#866951", marginBottom: "16px", fontFamily: "var(--font-sans)", fontWeight: 600 }}>
              HELP & SUPPORT
            </h3>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", fontSize: "13.5px", color: "#4A3525" }}>
              <li><Link href="/contact">Contact Us</Link></li>
              <li><Link href="/contact">Concierge Support</Link></li>
              <li><a href="mailto:contact.avsaraa@gmail.com">contact.avsaraa@gmail.com</a></li>
            </ul>
          </div>
        </div>

        {/* 3. Four Value Pillars with Bespoke SVG Icons */}
        <div
          style={{
            borderTop: "1px solid #E6DACF",
            borderBottom: "1px solid #E6DACF",
            padding: "32px 0",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "24px",
            textAlign: "center",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "50%", border: "1px solid #CFBEAD", backgroundColor: "#FAF7F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <DeliveryVanIcon size={20} color="#866951" />
              </div>
            </div>
            <h4 style={{ fontSize: "13.5px", fontWeight: 600, color: "#261B13", marginBottom: "3px" }}>Free Shipping</h4>
            <p style={{ fontSize: "12px", color: "#6E5B4E" }}>Free delivery on all orders across India</p>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "50%", border: "1px solid #CFBEAD", backgroundColor: "#FAF7F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ReturnBoxIcon size={20} color="#866951" />
              </div>
            </div>
            <h4 style={{ fontSize: "13.5px", fontWeight: 600, color: "#261B13", marginBottom: "3px" }}>Easy Returns</h4>
            <p style={{ fontSize: "12px", color: "#6E5B4E" }}>7-day easy returns</p>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "50%", border: "1px solid #CFBEAD", backgroundColor: "#FAF7F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ShieldCheckIcon size={20} color="#866951" />
              </div>
            </div>
            <h4 style={{ fontSize: "13.5px", fontWeight: 600, color: "#261B13", marginBottom: "3px" }}>Secure Payments</h4>
            <p style={{ fontSize: "12px", color: "#6E5B4E" }}>100% safe & encrypted</p>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "50%", border: "1px solid #CFBEAD", backgroundColor: "#FAF7F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <DiamondCrownIcon size={20} color="#866951" />
              </div>
            </div>
            <h4 style={{ fontSize: "13.5px", fontWeight: 600, color: "#261B13", marginBottom: "3px" }}>Pure Silks</h4>
            <p style={{ fontSize: "12px", color: "#6E5B4E" }}>Handcrafted in India</p>
          </div>
        </div>

        {/* 4. Signature Calligraphy & Bottom Bar */}
        <div style={{ textAlign: "center", padding: "36px 0 16px 0" }}>
          <p
            style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontSize: "36px",
              fontStyle: "italic",
              color: "#543E2E",
              marginBottom: "8px",
            }}
          >
            Wear the moment.
          </p>
          <div className="section-divider" style={{ margin: "0 auto 24px auto" }} />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              color: "#7E6E62",
              textAlign: "center",
            }}
          >
            <span>© 2026 Avsaraa. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
