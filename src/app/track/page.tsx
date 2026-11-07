"use client";

import React, { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  SpinnerIcon,
  CheckIcon,
} from "@/components/Icons";

interface TrackedOrder {
  order_number: string;
  order_status: string;
  payment_status: string;
  courier_partner: string;
  tracking_number?: string;
  estimated_delivery?: string;
  destination_city: string;
  destination_postal_code: string;
  total_amount: number;
  items: Array<{
    product_name: string;
    quantity: number;
    image_url: string;
    size?: string;
    color?: string;
  }>;
  created_at: string;
}

const TIMELINE_STEPS = ["Confirmed", "Processing", "Dispatched", "Out for Delivery", "Delivered"];

export default function OrderTrackingPage() {
  const [orderId, setOrderId] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackedOrder, setTrackedOrder] = useState<TrackedOrder | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim() || !contact.trim()) {
      setError("Please provide both your Order ID/Number and your registered phone number or email.");
      return;
    }

    setLoading(true);
    setError(null);
    setTrackedOrder(null);

    try {
      const res = await fetch("/api/order/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderId.trim(), contact: contact.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.order) {
        setError(data.error || "No order found matching the provided details. Please verify your information.");
      } else {
        setTrackedOrder(data.order);
      }
    } catch {
      setError("Unable to retrieve tracking details. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  };

  const getStepIndex = (status: string): number => {
    const idx = TIMELINE_STEPS.findIndex((s) => s.toLowerCase() === status.toLowerCase());
    return idx >= 0 ? idx : 0;
  };

  return (
    <div style={{ backgroundColor: "#FAF7F2", minHeight: "100vh", color: "#261B13" }}>
      <Header />
      <main style={{ maxWidth: "760px", margin: "60px auto", padding: "0 20px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.2em", color: "#866951", fontWeight: 600 }}>
            Insured Logistics & Real-Time Tracking
          </span>
          <h1 style={{ fontSize: "32px", margin: "12px 0 10px", fontWeight: 400, letterSpacing: "0.04em" }}>
            Track Your Atelier Order
          </h1>
          <p style={{ fontSize: "14px", color: "#6A5C52", margin: 0 }}>
            Enter your order number and registered contact details to view the live status of your shipment.
          </p>
        </div>

        {/* Tracking Query Form */}
        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", padding: "32px", border: "1px solid #EAE3D9", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", marginBottom: "32px" }}>
          <form onSubmit={handleTrack} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {error && (
              <div style={{ padding: "12px 16px", backgroundColor: "rgba(220,53,69,0.1)", border: "1px solid rgba(220,53,69,0.3)", borderRadius: "8px", color: "#dc3545", fontSize: "13px" }}>
                {error}
              </div>
            )}

            <div>
              <label style={{ display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#5A4535", marginBottom: "6px", fontWeight: 600 }}>
                Order ID or Number *
              </label>
              <input
                type="text"
                required
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="e.g. AVS-20261107-ABCD or order UUID"
                style={{ width: "100%", height: "46px", padding: "0 14px", borderRadius: "8px", border: "1px solid #D4BEAA", fontSize: "14px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#5A4535", marginBottom: "6px", fontWeight: 600 }}>
                Registered Phone Number or Email *
              </label>
              <input
                type="text"
                required
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="e.g. 9876543210 or your email"
                style={{ width: "100%", height: "46px", padding: "0 14px", borderRadius: "8px", border: "1px solid #D4BEAA", fontSize: "14px" }}
              />
              <span style={{ fontSize: "11px", color: "#866951", marginTop: "4px", display: "block" }}>
                * Dual verification prevents unauthorized discovery of customer parcel details.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="avsaraa-btn-primary"
              style={{
                height: "48px",
                borderRadius: "24px",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginTop: "8px",
              }}
            >
              {loading ? (
                <>
                  <SpinnerIcon size={18} color="#FAF7F2" />
                  <span>Checking Courier Status...</span>
                </>
              ) : (
                <span>Track Order Shipment</span>
              )}
            </button>
          </form>
        </div>

        {/* Tracking Details View */}
        {trackedOrder && (
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", padding: "32px", border: "1px solid #EAE3D9", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #EAE3D9", paddingBottom: "20px", marginBottom: "24px" }}>
              <div>
                <span style={{ fontSize: "12px", color: "#866951", textTransform: "uppercase", letterSpacing: "0.05em" }}>Order Reference</span>
                <h2 style={{ fontSize: "20px", margin: "4px 0 0", fontWeight: 600 }}>{trackedOrder.order_number}</h2>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "12px", color: "#866951", textTransform: "uppercase" }}>Current Status</span>
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#2E7D32" }}>{trackedOrder.order_status}</div>
              </div>
            </div>

            {/* Courier partner & tracking number */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", backgroundColor: "#FAF7F2", padding: "16px", borderRadius: "8px", marginBottom: "28px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "#866951", textTransform: "uppercase" }}>Courier Partner</span>
                <div style={{ fontSize: "13px", fontWeight: 600, marginTop: "2px" }}>{trackedOrder.courier_partner}</div>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "#866951", textTransform: "uppercase" }}>Tracking AWB / Reference</span>
                <div style={{ fontSize: "13px", fontWeight: 600, marginTop: "2px" }}>{trackedOrder.tracking_number || "Allocating AWB..."}</div>
              </div>
            </div>

            {/* Timeline progression */}
            <div style={{ marginBottom: "32px" }}>
              <h3 style={{ fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#866951", margin: "0 0 16px" }}>
                Shipment Progression
              </h3>
              <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
                {TIMELINE_STEPS.map((step, idx) => {
                  const currentIdx = getStepIndex(trackedOrder.order_status);
                  const isDone = idx <= currentIdx;
                  return (
                    <div key={step} style={{ textAlign: "center", flex: 1, position: "relative" }}>
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          backgroundColor: isDone ? "#261B13" : "#EAE3D9",
                          color: isDone ? "#FAF7F2" : "#A89887",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto 8px",
                          fontSize: "12px",
                          fontWeight: 700,
                        }}
                      >
                        {isDone ? <CheckIcon size={14} color="#FAF7F2" /> : idx + 1}
                      </div>
                      <span style={{ fontSize: "11px", color: isDone ? "#261B13" : "#A89887", fontWeight: isDone ? 600 : 400 }}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Items */}
            <div>
              <h3 style={{ fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#866951", margin: "0 0 12px" }}>
                Parcel Contents ({trackedOrder.items.length} items)
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {trackedOrder.items.map((item, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #F0EAE1" }}>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 600 }}>{item.product_name}</div>
                      <span style={{ fontSize: "12px", color: "#866951" }}>Qty: {item.quantity} | Size: {item.size || "Standard"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
