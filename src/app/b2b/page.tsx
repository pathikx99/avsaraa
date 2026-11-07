"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ShieldCheckIcon, DeliveryVanIcon, DiamondCrownIcon, CheckIcon, SpinnerIcon } from "@/components/Icons";

export default function B2BWholesalePage() {
  const [form, setForm] = useState({
    businessName: "",
    contactPerson: "",
    email: "",
    phone: "",
    city: "",
    orderVolume: "100-500 pieces",
    inquiryType: "Domestic Retail / Multi-Brand Outlet",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.businessName || !form.email || !form.phone || !form.contactPerson) {
      setError("Please fill out all mandatory contact and business fields.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${form.contactPerson} (${form.businessName})`,
          email: form.email,
          subject: `[B2B Wholesale / Atelier Inquiry] - ${form.orderVolume}`,
          message: `Business: ${form.businessName}\nCity: ${form.city}\nInquiry Type: ${form.inquiryType}\nVolume: ${form.orderVolume}\nPhone: ${form.phone}\nNotes: ${form.message}`,
        }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        setError("Failed to register B2B inquiry. Please reach us at contact.avsaraa@gmail.com.");
      }
    } catch {
      setError("Connection issue. Please retry in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ backgroundColor: "#FAF7F2", minHeight: "100vh", color: "#261B13" }}>
      <Header />
      <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "60px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.2em", color: "#866951", fontWeight: 600 }}>
            Atelier Partnership & Corporate Gifting
          </span>
          <h1 style={{ fontSize: "36px", margin: "12px 0 16px", fontWeight: 400, letterSpacing: "0.04em" }}>
            B2B & Handloom Bulk Inquiries
          </h1>
          <p style={{ maxWidth: "640px", margin: "0 auto", fontSize: "15px", color: "#6A5C52", lineHeight: 1.6 }}>
            Partner directly with our Surat loom atelier for premium silk sarees, couture silhouettes, curated bridal trousseau collections, and bespoke luxury corporate gifting.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", marginBottom: "48px" }}>
          <div style={{ backgroundColor: "#FFFFFF", padding: "28px", borderRadius: "12px", border: "1px solid #EAE3D9", textAlign: "center" }}>
            <DiamondCrownIcon size={32} color="#866951" />
            <h3 style={{ fontSize: "16px", margin: "14px 0 8px" }}>Pure Silk Mark Certified</h3>
            <p style={{ fontSize: "13px", color: "#6A5C52", margin: 0 }}>
              100% genuine mulberry and tussar silks handwoven by generational weavers.
            </p>
          </div>
          <div style={{ backgroundColor: "#FFFFFF", padding: "28px", borderRadius: "12px", border: "1px solid #EAE3D9", textAlign: "center" }}>
            <DeliveryVanIcon size={32} color="#866951" />
            <h3 style={{ fontSize: "16px", margin: "14px 0 8px" }}>Direct Loom Pricing</h3>
            <p style={{ fontSize: "13px", color: "#6A5C52", margin: 0 }}>
              Tiered wholesale rates with direct dispatch from our Surat craft center.
            </p>
          </div>
          <div style={{ backgroundColor: "#FFFFFF", padding: "28px", borderRadius: "12px", border: "1px solid #EAE3D9", textAlign: "center" }}>
            <ShieldCheckIcon size={32} color="#866951" />
            <h3 style={{ fontSize: "16px", margin: "14px 0 8px" }}>Dedicated Account Concierge</h3>
            <p style={{ fontSize: "13px", color: "#6A5C52", margin: 0 }}>
              Custom swatch samples, personalized branding, and dedicated fulfillment support.
            </p>
          </div>
        </div>

        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", padding: "40px", border: "1px solid #EAE3D9", maxWidth: "720px", margin: "0 auto" }}>
          {success ? (
            <div style={{ textAlign: "center", padding: "32px 16px" }}>
              <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "rgba(40,167,69,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <CheckIcon size={28} color="#28a745" />
              </div>
              <h3 style={{ fontSize: "22px", margin: "0 0 10px" }}>B2B Inquiry Received</h3>
              <p style={{ fontSize: "14px", color: "#6A5C52", maxWidth: "440px", margin: "0 auto 24px" }}>
                Our senior merchandising director will review your requirements and reach out within 24 business hours with our catalog and wholesale pricing structure.
              </p>
              <button
                type="button"
                onClick={() => setSuccess(false)}
                className="avsaraa-btn-primary"
                style={{ padding: "12px 28px", borderRadius: "24px", border: "none", cursor: "pointer" }}
              >
                Submit Another Inquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <h2 style={{ fontSize: "20px", margin: "0 0 8px", fontWeight: 500 }}>Wholesale & Partnership Application</h2>

              {error && (
                <div style={{ padding: "12px 16px", backgroundColor: "rgba(220,53,69,0.1)", border: "1px solid rgba(220,53,69,0.3)", borderRadius: "8px", color: "#dc3545", fontSize: "13px" }}>
                  {error}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#5A4535", marginBottom: "6px" }}>
                    Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.businessName}
                    onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                    placeholder="e.g. Royal Silks Boutique"
                    style={{ width: "100%", height: "42px", padding: "0 12px", borderRadius: "8px", border: "1px solid #D4BEAA" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#5A4535", marginBottom: "6px" }}>
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.contactPerson}
                    onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                    placeholder="Full Name"
                    style={{ width: "100%", height: "42px", padding: "0 12px", borderRadius: "8px", border: "1px solid #D4BEAA" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#5A4535", marginBottom: "6px" }}>
                    Business Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="corporate@business.com"
                    style={{ width: "100%", height: "42px", padding: "0 12px", borderRadius: "8px", border: "1px solid #D4BEAA" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#5A4535", marginBottom: "6px" }}>
                    Phone / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    style={{ width: "100%", height: "42px", padding: "0 12px", borderRadius: "8px", border: "1px solid #D4BEAA" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#5A4535", marginBottom: "6px" }}>
                    Expected Order Volume
                  </label>
                  <select
                    value={form.orderVolume}
                    onChange={(e) => setForm({ ...form, orderVolume: e.target.value })}
                    style={{ width: "100%", height: "42px", padding: "0 12px", borderRadius: "8px", border: "1px solid #D4BEAA", backgroundColor: "#fff" }}
                  >
                    <option value="50-100 pieces">50 – 100 Pieces</option>
                    <option value="100-500 pieces">100 – 500 Pieces</option>
                    <option value="500-2000 pieces">500 – 2,000 Pieces</option>
                    <option value="2000+ pieces">2,000+ Pieces (Atelier Custom Production)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#5A4535", marginBottom: "6px" }}>
                    Operating City / State
                  </label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="e.g. Surat, Gujarat"
                    style={{ width: "100%", height: "42px", padding: "0 12px", borderRadius: "8px", border: "1px solid #D4BEAA" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#5A4535", marginBottom: "6px" }}>
                  Specific Requirements or Message
                </label>
                <textarea
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Detail your requirements (e.g. wedding collection, corporate Diwali hampers, specific weave types)..."
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #D4BEAA", fontFamily: "inherit" }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="avsaraa-btn-primary"
                style={{ height: "48px", borderRadius: "24px", border: "none", cursor: isSubmitting ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: 600, letterSpacing: "0.06em", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              >
                {isSubmitting ? (
                  <>
                    <SpinnerIcon size={18} color="#FAF7F2" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <span>Submit B2B Partnership Inquiry</span>
                )}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
