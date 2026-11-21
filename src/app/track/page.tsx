"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  SpinnerIcon,
  CheckIcon,
  DeliveryVanIcon,
  ShieldCheckIcon,
  LocationPinIcon,
} from "@/components/Icons";
import { resolveProductImage } from "@/lib/productUtils";

interface TrackingActivity {
  date: string;
  time: string;
  activity: string;
  location: string;
  status: string;
}

interface TrackedOrder {
  order_number: string;
  order_status: string;
  payment_status: string;
  courier_partner: string;
  tracking_number?: string;
  estimated_delivery?: string;
  etd?: string;
  destination_city: string;
  destination_postal_code: string;
  masked_phone?: string;
  masked_email?: string;
  total_amount: number;
  items: Array<{
    product_name: string;
    quantity: number;
    image_url: string;
    size?: string;
    color?: string;
  }>;
  created_at: string;
  activities?: TrackingActivity[];
  tracking_source?: string;
}

const TIMELINE_STEPS = ["Confirmed", "Processing", "Dispatched", "Out for Delivery", "Delivered"];

function OrderTrackingContent() {
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get("orderId") || searchParams.get("id") || "";
  const initialContact = searchParams.get("contact") || searchParams.get("phone") || searchParams.get("email") || "";

  const [orderId, setOrderId] = useState(initialOrderId);
  const [contact, setContact] = useState(initialContact);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackedOrder, setTrackedOrder] = useState<TrackedOrder | null>(null);
  const [copiedAwb, setCopiedAwb] = useState(false);

  const fetchTracking = async (searchOrderId: string, searchContact: string) => {
    if (!searchOrderId.trim()) {
      setError("Please enter your Order ID or Order Number.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/order/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: searchOrderId.trim(),
          contact: searchContact.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.order) {
        setError(data.error || "No order found matching the provided details. Please verify your information.");
        setTrackedOrder(null);
      } else {
        setTrackedOrder(data.order);
      }
    } catch {
      setError("Unable to retrieve tracking details. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderId) {
      const timer = setTimeout(() => {
        fetchTracking(initialOrderId, initialContact);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [initialOrderId, initialContact]);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTracking(orderId, contact);
  };

  const getStepIndex = (status: string): number => {
    const norm = status.toLowerCase();
    if (norm === "in transit") return 2;
    const idx = TIMELINE_STEPS.findIndex((s) => s.toLowerCase() === norm);
    return idx >= 0 ? idx : 0;
  };

  const handleCopyAwb = (awb: string) => {
    navigator.clipboard.writeText(awb);
    setCopiedAwb(true);
    setTimeout(() => setCopiedAwb(false), 2000);
  };

  return (
    <main style={{ maxWidth: "800px", margin: "50px auto", padding: "0 20px" }}>
      {/* Page Title */}
      <div style={{ textAlign: "center", marginBottom: "36px" }}>
        <span
          style={{
            fontSize: "12px",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            color: "#866951",
            fontWeight: 600,
          }}
        >
          Shiprocket Integrated Logistics & Live Dispatch
        </span>
        <h1
          style={{
            fontFamily: "var(--font-serif, serif)",
            fontSize: "36px",
            margin: "12px 0 10px",
            fontWeight: 400,
            letterSpacing: "0.02em",
          }}
        >
          Track Your Atelier Shipment
        </h1>
        <p style={{ fontSize: "14px", color: "#6A5C52", margin: 0, lineHeight: 1.6 }}>
          Enter your order number and registered contact details to view the real-time courier status and checkpoint history.
        </p>
      </div>

      {/* Tracking Form */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: "16px",
          padding: "32px",
          border: "1px solid #EAE3D9",
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
          marginBottom: "36px",
        }}
      >
        <form onSubmit={handleTrack} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {error && (
            <div
              style={{
                padding: "12px 16px",
                backgroundColor: "rgba(220,53,69,0.08)",
                border: "1px solid rgba(220,53,69,0.25)",
                borderRadius: "8px",
                color: "#c82333",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>{error}</span>
            </div>
          )}

          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "#5A4535",
                marginBottom: "6px",
                fontWeight: 600,
              }}
            >
              Order ID or Order Number *
            </label>
            <input
              type="text"
              required
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="e.g. AVS-20261119-ABCD or UUID"
              style={{
                width: "100%",
                height: "46px",
                padding: "0 14px",
                borderRadius: "8px",
                border: "1px solid #D4BEAA",
                fontSize: "14px",
                backgroundColor: "#FAF7F2",
                color: "#261B13",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "#5A4535",
                marginBottom: "6px",
                fontWeight: 600,
              }}
            >
              Registered Phone Number or Email *
            </label>
            <input
              type="text"
              required
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="e.g. 9876543210 or your email"
              style={{
                width: "100%",
                height: "46px",
                padding: "0 14px",
                borderRadius: "8px",
                border: "1px solid #D4BEAA",
                fontSize: "14px",
                backgroundColor: "#FAF7F2",
                color: "#261B13",
              }}
            />
            <span style={{ fontSize: "11px", color: "#866951", marginTop: "5px", display: "block" }}>
              * Dual verification ensures only the authorized parcel recipient can access live tracking checkpoints.
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
              fontSize: "13.5px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              marginTop: "6px",
            }}
          >
            {loading ? (
              <>
                <SpinnerIcon size={18} color="#FAF7F2" />
                <span>Checking Carrier Network...</span>
              </>
            ) : (
              <>
                <DeliveryVanIcon size={18} color="#FAF7F2" />
                <span>Track Live Shipment</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Live Tracking Status Display */}
      {trackedOrder && (
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            padding: "36px",
            border: "1px solid #EAE3D9",
            boxShadow: "0 6px 24px rgba(0,0,0,0.04)",
          }}
        >
          {/* Header reference and status pill */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              borderBottom: "1px solid #EAE3D9",
              paddingBottom: "22px",
              marginBottom: "26px",
            }}
          >
            <div>
              <span style={{ fontSize: "12px", color: "#866951", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Shipment Reference
              </span>
              <h2
                style={{
                  fontFamily: "var(--font-serif, serif)",
                  fontSize: "24px",
                  margin: "4px 0 0",
                  fontWeight: 600,
                  color: "#261B13",
                }}
              >
                {trackedOrder.order_number}
              </h2>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "11px", color: "#866951", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Current Status
              </span>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 12px",
                  backgroundColor: "#E8F5E9",
                  color: "#2E7D32",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: 700,
                  marginTop: "4px",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "#2E7D32",
                  }}
                />
                {trackedOrder.order_status}
              </div>
            </div>
          </div>

          {/* Logistics partner & AWB Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
              backgroundColor: "#FAF7F2",
              padding: "18px 20px",
              borderRadius: "12px",
              marginBottom: "32px",
              border: "1px solid #EAE3D9",
            }}
          >
            <div>
              <span style={{ fontSize: "11px", color: "#866951", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Logistics Carrier
              </span>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#261B13", marginTop: "3px" }}>
                {trackedOrder.courier_partner}
              </div>
            </div>

            <div>
              <span style={{ fontSize: "11px", color: "#866951", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                AWB / Waybill Number
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "3px" }}>
                <span style={{ fontFamily: "monospace", fontSize: "13px", fontWeight: 700, color: "#261B13" }}>
                  {trackedOrder.tracking_number || "Allocating AWB..."}
                </span>
                {trackedOrder.tracking_number && (
                  <button
                    type="button"
                    onClick={() => handleCopyAwb(trackedOrder.tracking_number!)}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "11px",
                      color: copiedAwb ? "#2E7D32" : "#866951",
                      cursor: "pointer",
                      textDecoration: "underline",
                      padding: 0,
                    }}
                  >
                    {copiedAwb ? "Copied!" : "Copy"}
                  </button>
                )}
              </div>
            </div>

            <div>
              <span style={{ fontSize: "11px", color: "#866951", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Destination & Delivery
              </span>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#261B13", marginTop: "3px" }}>
                {trackedOrder.destination_city} ({trackedOrder.destination_postal_code})
                {trackedOrder.etd && (
                  <span style={{ display: "block", fontSize: "11.5px", color: "#866951", fontWeight: 400 }}>
                    Est. {trackedOrder.etd}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div style={{ marginBottom: "36px" }}>
            <h3
              style={{
                fontSize: "12.5px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#866951",
                margin: "0 0 20px",
                fontWeight: 600,
              }}
            >
              Shipment Progression
            </h3>

            <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
              {TIMELINE_STEPS.map((step, idx) => {
                const currentIdx = getStepIndex(trackedOrder.order_status);
                const isCompleted = idx <= currentIdx;
                const isCurrent = idx === currentIdx;

                return (
                  <div key={step} style={{ textAlign: "center", flex: 1, position: "relative", zIndex: 1 }}>
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        backgroundColor: isCompleted ? "#261B13" : "#EAE3D9",
                        color: isCompleted ? "#FAF7F2" : "#8A7969",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 8px",
                        fontSize: "12px",
                        fontWeight: 700,
                        border: isCurrent ? "3px solid #C5A059" : "none",
                        boxShadow: isCurrent ? "0 0 10px rgba(197,160,89,0.4)" : "none",
                        transition: "all 0.3s ease",
                      }}
                    >
                      {isCompleted ? <CheckIcon size={16} color="#FAF7F2" /> : idx + 1}
                    </div>
                    <span
                      style={{
                        fontSize: "11.5px",
                        color: isCompleted ? "#261B13" : "#8A7969",
                        fontWeight: isCurrent ? 700 : isCompleted ? 600 : 400,
                        display: "block",
                      }}
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-time Activity Checkpoints Timeline */}
          {trackedOrder.activities && trackedOrder.activities.length > 0 && (
            <div style={{ marginBottom: "36px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3
                  style={{
                    fontSize: "12.5px",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#866951",
                    margin: 0,
                    fontWeight: 600,
                  }}
                >
                  Live Scan History & Checkpoints
                </h3>
                <span
                  style={{
                    fontSize: "11px",
                    color: "#2E7D32",
                    backgroundColor: "rgba(46,125,50,0.08)",
                    padding: "3px 8px",
                    borderRadius: "12px",
                    fontWeight: 600,
                  }}
                >
                  Shiprocket Network Verified
                </span>
              </div>

              <div
                style={{
                  borderLeft: "2px solid #EAE3D9",
                  marginLeft: "12px",
                  paddingLeft: "24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                {trackedOrder.activities.map((act, index) => {
                  const isLatest = index === 0;
                  return (
                    <div key={index} style={{ position: "relative" }}>
                      {/* Checkpoint Dot */}
                      <div
                        style={{
                          position: "absolute",
                          left: "-31px",
                          top: "4px",
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          backgroundColor: isLatest ? "#C5A059" : "#D4BEAA",
                          border: isLatest ? "2px solid #FFFFFF" : "none",
                          boxShadow: isLatest ? "0 0 6px rgba(197,160,89,0.5)" : "none",
                        }}
                      />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12px" }}>
                        <span style={{ fontSize: "13.5px", fontWeight: isLatest ? 700 : 600, color: "#261B13" }}>
                          {act.activity}
                        </span>
                        <span style={{ fontSize: "11.5px", color: "#866951", whiteSpace: "nowrap" }}>
                          {act.date} · {act.time}
                        </span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#6A5C52", marginTop: "2px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <LocationPinIcon size={12} color="#866951" />
                        <span>{act.location}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Parcel Contents */}
          <div style={{ borderTop: "1px solid #EAE3D9", paddingTop: "24px" }}>
            <h3
              style={{
                fontSize: "12.5px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#866951",
                margin: "0 0 16px",
                fontWeight: 600,
              }}
            >
              Parcel Enclosed Pieces ({trackedOrder.items.length})
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {trackedOrder.items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "10px 0",
                    borderBottom: i < trackedOrder.items.length - 1 ? "1px solid #F0EAE1" : "none",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "52px",
                      height: "64px",
                      borderRadius: "6px",
                      overflow: "hidden",
                      backgroundColor: "#EAE3D9",
                      flexShrink: 0,
                    }}
                  >
                    <Image
                      src={resolveProductImage(item.image_url)}
                      alt={item.product_name}
                      fill
                      sizes="52px"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: "14px", fontWeight: 600, color: "#261B13", margin: "0 0 3px" }}>
                      {item.product_name}
                    </h4>
                    <span style={{ fontSize: "12px", color: "#866951" }}>
                      Qty: {item.quantity} · {item.size || "Standard Size"} · {item.color || "Authentic"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Need Assistance Bar */}
          <div
            style={{
              marginTop: "30px",
              padding: "16px 20px",
              backgroundColor: "#FAF7F2",
              borderRadius: "10px",
              border: "1px dashed #D4BEAA",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <ShieldCheckIcon size={20} color="#866951" />
              <div>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#261B13", display: "block" }}>
                  Insured White-Glove Handloom Transit
                </span>
                <span style={{ fontSize: "11.5px", color: "#866951" }}>
                  Every Avsaraa dispatch includes tamper-evident sealing and 7-day heritage exchange.
                </span>
              </div>
            </div>
            <Link
              href="/contact"
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "#261B13",
                textDecoration: "underline",
              }}
            >
              Contact Atelier Concierge →
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}

export default function OrderTrackingPage() {
  return (
    <div style={{ backgroundColor: "#FAF7F2", minHeight: "100vh", color: "#261B13" }}>
      <Header />
      <Suspense
        fallback={
          <div
            style={{
              minHeight: "60vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SpinnerIcon size={32} color="#866951" />
          </div>
        }
      >
        <OrderTrackingContent />
      </Suspense>
      <Footer />
    </div>
  );
}
