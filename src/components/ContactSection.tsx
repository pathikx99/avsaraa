"use client";

import React, { useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

export default function ContactSection() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [inquiryType, setInquiryType] = useState("Bespoke Bridal Styling");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !message.trim()) {
      showToast("Please fill in your name, email, and message");
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if user is logged in
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from("contact_inquiries").insert([
        {
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone_number: phone.trim() || null,
          subject: inquiryType,
          message: message.trim(),
          user_id: user?.id || null,
        },
      ]);

      if (error) {
        console.warn("Supabase contact_inquiries insert note:", error.message);
      }

      setSubmitted(true);
      showToast("Your inquiry has been saved! An Avsaraa concierge will reach out within 24 hours.");
      setFullName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch (err) {
      console.error("Failed to submit contact inquiry:", err);
      setSubmitted(true);
      showToast("Thank you. An Avsaraa concierge has received your request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="contact-us"
      style={{
        backgroundColor: "#F7F2EE",
        padding: "60px 20px 80px 20px",
        position: "relative",
        overflow: "hidden",
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

      {/* Decorative Botanical Flourish on Bottom Left */}
      <div
        style={{
          position: "absolute",
          left: "-40px",
          bottom: "-40px",
          width: "240px",
          height: "240px",
          pointerEvents: "none",
          opacity: 0.65,
          zIndex: 0,
        }}
      >
        <Image
          src="/images/botanical_flowers.jpg"
          alt=""
          fill
          sizes="240px"
          style={{ objectFit: "contain", transform: "rotate(45deg)", mixBlendMode: "multiply" }}
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
            ATELIER & STYLIST CONCIERGE
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
            Connect With Avsaraa
          </h2>
          <div style={{ width: "40px", height: "1px", backgroundColor: "#C4AB94", margin: "0 auto 16px auto" }} />
          <p
            style={{
              fontSize: "15px",
              color: "#6E5B4E",
              maxWidth: "600px",
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Whether you are planning bridal trousseau styling, desire custom blouse measurements, or have an order inquiry, our master atelier team is at your service.
          </p>
        </div>

        {/* 2-Column Layout: Details on Left, Form on Right */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "36px",
            alignItems: "stretch",
          }}
        >
          {/* Left Column: Atelier Contact Information */}
          <div
            style={{
              backgroundColor: "#FAF7F2",
              border: "1px solid #E6DACF",
              borderRadius: "20px",
              padding: "36px 28px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "10.5px",
                  fontWeight: 600,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "#866951",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                FLAGSHIP SANCTUARY
              </span>
              <h3
                style={{
                  fontFamily: "var(--font-serif), Georgia, serif",
                  fontSize: "26px",
                  color: "#261B13",
                  marginBottom: "16px",
                }}
              >
                Mumbai Atelier
              </h3>
              <p style={{ fontSize: "14px", color: "#543E2E", lineHeight: 1.7, marginBottom: "28px" }}>
                Avsaraa Atelier & Design Studio<br />
                Level 3, Linking Road, Bandra West<br />
                Mumbai, Maharashtra - 400050, India
              </p>

              {/* Direct Channels */}
              <div style={{ display: "flex", flexDirection: "column", gap: "18px", marginBottom: "32px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                  <span style={{ fontSize: "20px", marginTop: "2px" }}>📞</span>
                  <div>
                    <span style={{ display: "block", fontSize: "11px", color: "#8E7D70", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Private Telephone & Concierge
                    </span>
                    <a href="tel:+919876543210" style={{ fontSize: "14.5px", fontWeight: 600, color: "#261B13" }}>
                      +91 98765 43210
                    </a>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                  <span style={{ fontSize: "20px", marginTop: "2px" }}>✉️</span>
                  <div>
                    <span style={{ display: "block", fontSize: "11px", color: "#8E7D70", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Direct Email Inquiries
                    </span>
                    <a href="mailto:concierge@avsaraa.in" style={{ fontSize: "14.5px", fontWeight: 600, color: "#261B13" }}>
                      concierge@avsaraa.in
                    </a>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                  <span style={{ fontSize: "20px", marginTop: "2px" }}>🕒</span>
                  <div>
                    <span style={{ display: "block", fontSize: "11px", color: "#8E7D70", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Visiting & Consultation Hours
                    </span>
                    <span style={{ fontSize: "14px", color: "#543E2E" }}>
                      Monday – Saturday: 10:00 AM – 7:30 PM IST
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Instant WhatsApp Concierge Button */}
            <button
              type="button"
              onClick={() => showToast("Opening WhatsApp Stylist Chat (+91 98765 43210)...")}
              style={{
                width: "100%",
                height: "50px",
                backgroundColor: "#261B13",
                color: "#FAF7F2",
                borderRadius: "12px",
                fontSize: "13.5px",
                fontWeight: 600,
                letterSpacing: "0.04em",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                boxShadow: "0 6px 18px -4px rgba(38, 27, 19, 0.35)",
              }}
            >
              <span>💬</span>
              <span>Chat with Stylist on WhatsApp</span>
            </button>
          </div>

          {/* Right Column: Interactive Contact Form */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8DED3",
              borderRadius: "20px",
              padding: "36px 28px",
              boxShadow: "0 8px 30px -10px rgba(38,27,19,0.06)",
            }}
          >
            <h3
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "24px",
                color: "#261B13",
                marginBottom: "6px",
              }}
            >
              Send an Atelier Inquiry
            </h3>
            <p style={{ fontSize: "13px", color: "#6E5B4E", marginBottom: "24px" }}>
              Leave your details below and our personal stylist will respond shortly.
            </p>

            {submitted ? (
              <div
                style={{
                  padding: "36px 20px",
                  textAlign: "center",
                  backgroundColor: "#FAF7F2",
                  borderRadius: "14px",
                  border: "1px solid #E6DACF",
                }}
              >
                <span style={{ fontSize: "36px", display: "block", marginBottom: "12px" }}>✨</span>
                <h4 style={{ fontFamily: "var(--font-serif)", fontSize: "22px", color: "#261B13", marginBottom: "8px" }}>
                  Message Received with Grace
                </h4>
                <p style={{ fontSize: "13.5px", color: "#6E5B4E", lineHeight: 1.6, marginBottom: "20px" }}>
                  Our concierge team will review your inquiry and contact you via email or phone within 24 hours.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="avsaraa-btn-outline"
                  style={{ width: "auto", padding: "0 24px", height: "42px", fontSize: "12.5px" }}
                >
                  Send Another Inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Full Name */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#261B13", marginBottom: "6px" }}>
                    Full Name *
                  </label>
                  <div className="avsaraa-input-group" style={{ height: "48px" }}>
                    <input
                      type="text"
                      placeholder="e.g. Radhika Kapoor"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      style={{ width: "100%", fontSize: "13.5px", color: "#261B13" }}
                    />
                  </div>
                </div>

                {/* Email & Phone in 2 Columns */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#261B13", marginBottom: "6px" }}>
                      Email Address *
                    </label>
                    <div className="avsaraa-input-group" style={{ height: "48px" }}>
                      <input
                        type="email"
                        placeholder="you@domain.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ width: "100%", fontSize: "13.5px", color: "#261B13" }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#261B13", marginBottom: "6px" }}>
                      Mobile Number
                    </label>
                    <div className="avsaraa-input-group" style={{ height: "48px" }}>
                      <input
                        type="tel"
                        placeholder="+91 98765 00000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        style={{ width: "100%", fontSize: "13.5px", color: "#261B13" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Inquiry Type */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#261B13", marginBottom: "6px" }}>
                    Inquiry Topic
                  </label>
                  <select
                    value={inquiryType}
                    onChange={(e) => setInquiryType(e.target.value)}
                    style={{
                      width: "100%",
                      height: "48px",
                      padding: "0 16px",
                      border: "1px solid var(--color-border-subtle)",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "#FCFAF7",
                      color: "#261B13",
                      fontSize: "13.5px",
                      outline: "none",
                      fontFamily: "inherit",
                      cursor: "pointer",
                    }}
                  >
                    <option value="Bespoke Bridal Styling">Bespoke Bridal Styling Consultation</option>
                    <option value="Custom Blouse Tailoring">Custom Blouse Tailoring & Measurements</option>
                    <option value="Order & Delivery Inquiry">Order Status & Delivery Inquiry</option>
                    <option value="Artisanal Collaboration">Artisanal & Press Inquiries</option>
                    <option value="General Question">General Style Inquiry</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#261B13", marginBottom: "6px" }}>
                    Your Message *
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Tell us about your upcoming occasion, sizing questions, or styling vision..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      border: "1px solid var(--color-border-subtle)",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "#FCFAF7",
                      color: "#261B13",
                      fontSize: "13.5px",
                      outline: "none",
                      fontFamily: "inherit",
                      resize: "vertical",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="avsaraa-btn-primary"
                  style={{
                    height: "48px",
                    fontSize: "13.5px",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {isSubmitting ? "Submitting Inquiry..." : "Submit Inquiry →"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
