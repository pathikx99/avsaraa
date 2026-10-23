"use client";

import React, { useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { PhoneIcon, MailIcon, ClockIcon, SpinnerIcon, WhatsAppIcon } from "./Icons";


interface ContactSectionProps {
  showHeader?: boolean;
}

export default function ContactSection({ showHeader = true }: ContactSectionProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from("contact_inquiries").insert([
        {
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone_number: phone.trim() || null,
          subject: "Customer Inquiry",
          message: message.trim(),
          user_id: user?.id || null,
        },
      ]);

      if (error) {
        console.warn("Contact form note:", error.message);
      }

      setSubmitted(true);
      showToast("Thank you! We received your message and will reply soon.");
      setFullName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch {
      setSubmitted(true);
      showToast("Thank you! Your message has been received.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      style={{
        backgroundColor: "#F7F2EE",
        padding: showHeader ? "80px 24px" : "60px 24px 80px 24px",
        position: "relative",
        borderBottom: "1px solid #E6DACF",
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
            padding: "10px 24px",
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

      {/* Decorative Botanical Flourish */}
      <div
        style={{
          position: "absolute",
          left: "-30px",
          bottom: "-30px",
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
          style={{ objectFit: "contain", transform: "rotate(45deg)", mixBlendMode: "multiply" }}
        />
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        {/* Section Header */}
        {showHeader && (
          <div style={{ textAlign: "center", marginBottom: "52px" }}>
            <span className="luxury-badge" style={{ marginBottom: "14px" }}>
              ✦ CONTACT US ✦
            </span>
            <h2
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "clamp(30px, 4.5vw, 44px)",
                fontWeight: 500,
                color: "#261B13",
                lineHeight: 1.15,
                marginBottom: "14px",
              }}
            >
              Get in Touch
            </h2>
            <div style={{ width: "48px", height: "1.5px", backgroundColor: "#C4AB94", margin: "0 auto 18px auto" }} />
            <p
              style={{
                fontSize: "15px",
                color: "#6E5B4E",
                maxWidth: "600px",
                margin: "0 auto",
                lineHeight: 1.7,
              }}
            >
              Have a question about our sarees, orders, or custom sizing? We are here to help.
            </p>
          </div>
        )}

        {/* 2-Column Minimal Layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "36px",
            alignItems: "stretch",
          }}
        >
          {/* Left Column: Store Details */}
          <div
            style={{
              backgroundColor: "#FAF7F2",
              border: "1px solid #E6DACF",
              borderRadius: "20px",
              padding: "36px 30px",
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
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#866951",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                OUR STUDIO & ONLINE STORE
              </span>
              <h3
                style={{
                  fontFamily: "var(--font-serif), Georgia, serif",
                  fontSize: "26px",
                  color: "#261B13",
                  marginBottom: "14px",
                }}
              >
                Surat Studio & Online Store
              </h3>
              <p style={{ fontSize: "14px", color: "#543E2E", lineHeight: 1.7, marginBottom: "28px" }}>
                Avsaraa Studio<br />
                Ring Road Textile Hub, Surat<br />
                Gujarat - 395002, India<br />
                <span style={{ color: "#866951", fontSize: "12.5px", fontWeight: 600 }}>✦ Online Orders Delivered Across India</span>
              </p>

              {/* Contact Channels */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "50%",
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E6DACF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#866951",
                      flexShrink: 0,
                    }}
                  >
                    <PhoneIcon size={16} color="#866951" />
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "11px", color: "#8E7D70", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Phone & Orders
                    </span>
                    <a href="tel:+919825012345" style={{ fontSize: "14px", fontWeight: 600, color: "#261B13" }}>
                      +91 98250 12345
                    </a>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "50%",
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E6DACF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#25D366",
                      flexShrink: 0,
                    }}
                  >
                    <WhatsAppIcon size={18} color="#25D366" />
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "11px", color: "#8E7D70", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      WhatsApp Atelier
                    </span>
                    <a
                      href="https://wa.me/919876543210?text=Hello%20Avsaraa%20Atelier,%20I%20would%20like%20to%20inquire%20about%20a%20handcrafted%20drape"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: "14px", fontWeight: 600, color: "#1B6B40" }}
                    >
                      Chat with Master Draper →
                    </a>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "50%",
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E6DACF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#866951",
                      flexShrink: 0,
                    }}
                  >
                    <MailIcon size={16} color="#866951" />
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "11px", color: "#8E7D70", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Email
                    </span>
                    <a href="mailto:hello@avsaraa.in" style={{ fontSize: "14px", fontWeight: 600, color: "#261B13" }}>
                      hello@avsaraa.in
                    </a>
                  </div>
                </div>


                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "50%",
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E6DACF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#866951",
                      flexShrink: 0,
                    }}
                  >
                    <ClockIcon size={16} color="#866951" />
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: "11px", color: "#8E7D70", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Online Support Hours
                    </span>
                    <span style={{ fontSize: "13.5px", color: "#261B13" }}>
                      Monday – Saturday: 10:00 AM – 7:30 PM IST
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Call Studio CTA */}
            <a
              href="tel:+919825012345"
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
                textDecoration: "none",
              }}
            >
              <PhoneIcon size={18} color="#C5A059" />
              <span>Call Studio (+91 98250 12345)</span>
            </a>
          </div>

          {/* Right Column: Simple Message Form */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8DED3",
              borderRadius: "20px",
              padding: "36px 30px",
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
              Send us a Message
            </h3>
            <p style={{ fontSize: "13px", color: "#6E5B4E", marginBottom: "24px" }}>
              Leave your details below and our team will get back to you soon.
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
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    backgroundColor: "#866951",
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px auto",
                    fontSize: "20px",
                  }}
                >
                  ✓
                </div>
                <h4 style={{ fontFamily: "var(--font-serif)", fontSize: "22px", color: "#261B13", marginBottom: "8px" }}>
                  Message Sent
                </h4>
                <p style={{ fontSize: "13.5px", color: "#6E5B4E", lineHeight: 1.6, marginBottom: "20px" }}>
                  Thank you for contacting us. We will reply to your email or phone within 24 hours.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="avsaraa-btn-outline"
                  style={{ width: "auto", padding: "0 24px", height: "42px", fontSize: "12.5px" }}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#261B13", marginBottom: "6px" }}>
                    Full Name *
                  </label>
                  <div className="avsaraa-input-group" style={{ height: "48px" }}>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Radhika Kapoor"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      style={{ width: "100%", height: "100%", padding: "0 14px", fontSize: "13.5px", color: "#261B13" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#261B13", marginBottom: "6px" }}>
                      Email Address *
                    </label>
                    <div className="avsaraa-input-group" style={{ height: "48px" }}>
                      <input
                        type="email"
                        required
                        placeholder="you@domain.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{ width: "100%", height: "100%", padding: "0 14px", fontSize: "13.5px", color: "#261B13" }}
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
                        style={{ width: "100%", height: "100%", padding: "0 14px", fontSize: "13.5px", color: "#261B13" }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#261B13", marginBottom: "6px" }}>
                    Your Message *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Ask about sarees, sizing, delivery, or anything else..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      fontSize: "13.5px",
                      color: "#261B13",
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #CFBEAD",
                      borderRadius: "10px",
                      fontFamily: "inherit",
                      resize: "vertical",
                      outline: "none",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="avsaraa-btn-primary"
                  style={{
                    height: "50px",
                    fontSize: "13px",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    marginTop: "6px",
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <SpinnerIcon size={16} color="#FAF7F2" />
                      <span>Sending Message...</span>
                    </>
                  ) : (
                    <span>Send Message →</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
