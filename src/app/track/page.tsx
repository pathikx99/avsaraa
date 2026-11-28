"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/lib/supabaseClient";
import type { Order } from "@/types/order";
import {
  SpinnerIcon,
  CheckIcon,
  DeliveryVanIcon,
  ShieldCheckIcon,
  LocationPinIcon,
} from "@/components/Icons";
import { resolveProductImage, formatINR } from "@/lib/productUtils";

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
  subtotal?: number;
  discount_amount?: number;
  shipping_fee?: number;
  coupon_code?: string | null;
  payment_method?: string;
  items: Array<{
    product_name: string;
    quantity: number;
    image_url: string;
    size?: string;
    color?: string;
    unit_price?: number;
    total_price?: number;
  }>;
  created_at: string;
  activities?: TrackingActivity[];
  tracking_source?: string;
}

const TIMELINE_STEPS = ["Confirmed", "Processing", "Dispatched", "Out for Delivery", "Delivered"];

function buildTrackedFromOrder(ord: Order): TrackedOrder {
  return {
    order_number: ord.order_number,
    order_status: ord.order_status,
    payment_status: ord.payment_status,
    courier_partner: ord.courier_partner || "Shiprocket Air Express",
    tracking_number: ord.tracking_number || undefined,
    estimated_delivery: ord.estimated_delivery || undefined,
    destination_city: ord.shipping_address_snapshot?.city || "India",
    destination_postal_code: ord.shipping_address_snapshot?.postal_code || "",
    total_amount: Number(ord.total_amount || 0),
    subtotal: Number(ord.subtotal || 0),
    discount_amount: Number(ord.discount_amount || 0),
    shipping_fee: Number(ord.shipping_fee || 0),
    coupon_code: ord.coupon_code || null,
    payment_method: ord.payment_method,
    items: (ord.order_items || []).map((item) => ({
      product_name: item.product_name,
      quantity: item.quantity,
      image_url: item.image_url,
      size: item.size,
      color: item.color,
      unit_price: item.unit_price,
      total_price: item.total_price,
    })),
    created_at: ord.created_at,
  };
}

function OrderTrackingContent() {
  const searchParams = useSearchParams();
  const initialOrderId = searchParams.get("orderId") || searchParams.get("id") || "";
  const initialContact = searchParams.get("contact") || searchParams.get("phone") || searchParams.get("email") || "";

  const [isSignedIn, setIsSignedIn] = useState(false);
  const [loadingAccountOrders, setLoadingAccountOrders] = useState(true);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [showManualLookup, setShowManualLookup] = useState(false);

  const [orderId, setOrderId] = useState(initialOrderId);
  const [contact, setContact] = useState(initialContact);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackedOrder, setTrackedOrder] = useState<TrackedOrder | null>(null);
  const [copiedAwb, setCopiedAwb] = useState(false);

  const fetchTracking = useCallback(async (searchOrderId: string, searchContact: string, fallbackOrder?: Order) => {
    if (!searchOrderId.trim()) {
      setError("Please enter your Order ID or Order Number.");
      return;
    }

    setLoading(true);
    setError(null);
    if (fallbackOrder) {
      setTrackedOrder(buildTrackedFromOrder(fallbackOrder));
    }

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
        if (!fallbackOrder) {
          setError(data.error || "No order found matching the provided details. Please verify your information.");
          setTrackedOrder(null);
        }
      } else {
        setTrackedOrder({
          ...(fallbackOrder ? buildTrackedFromOrder(fallbackOrder) : {}),
          ...data.order,
        });
      }
    } catch {
      if (!fallbackOrder) {
        setError("Unable to retrieve tracking details. Please check your network connection.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Change 2: Load logged-in customer's orders automatically without manual tracking ID entry
  useEffect(() => {
    let isMounted = true;

    async function loadSignedInOrders() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (!session?.user) {
          setIsSignedIn(false);
          setShowManualLookup(true);
          setLoadingAccountOrders(false);
          if (initialOrderId) {
            fetchTracking(initialOrderId, initialContact);
          }
          return;
        }

        setIsSignedIn(true);
        const ordRes = await fetch("/api/orders");
        const ordData = await ordRes.json();
        if (!isMounted) return;

        if (ordData.success && Array.isArray(ordData.orders)) {
          const list = ordData.orders as Order[];
          setCustomerOrders(list);

          const userContact =
            (session.user.email && !session.user.email.endsWith("@phone.avsaraa.in")
              ? session.user.email
              : session.user.phone) || "";

          const targetOrder =
            (initialOrderId
              ? list.find((o) => o.order_number === initialOrderId || o.id === initialOrderId)
              : null) || list[0];

          if (targetOrder) {
            const snapContact =
              targetOrder.shipping_address_snapshot?.phone_number ||
              targetOrder.shipping_address_snapshot?.email ||
              userContact;
            fetchTracking(targetOrder.order_number, snapContact, targetOrder);
          } else {
            setShowManualLookup(true);
          }
        } else {
          setShowManualLookup(true);
        }
      } catch {
        if (isMounted) setShowManualLookup(true);
      } finally {
        if (isMounted) setLoadingAccountOrders(false);
      }
    }

    loadSignedInOrders();
    return () => {
      isMounted = false;
    };
  }, [fetchTracking, initialOrderId, initialContact]);

  const handleSelectOrder = (ord: Order) => {
    const snapContact =
      ord.shipping_address_snapshot?.phone_number ||
      ord.shipping_address_snapshot?.email ||
      "";
    setOrderId(ord.order_number);
    fetchTracking(ord.order_number, snapContact, ord);
  };

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
    <main style={{ maxWidth: "860px", margin: "40px auto 60px", padding: "0 18px" }}>
      {/* Page Title */}
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <span
          style={{
            fontSize: "11.5px",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            color: "#866951",
            fontWeight: 600,
          }}
        >
          Shiprocket Integrated Logistics &amp; Live Dispatch
        </span>
        <h1
          style={{
            fontFamily: "var(--font-serif, serif)",
            fontSize: "clamp(28px, 4.5vw, 36px)",
            margin: "10px 0 10px",
            fontWeight: 400,
            letterSpacing: "0.02em",
          }}
        >
          Track Your Orders
        </h1>
        <p style={{ fontSize: "14px", color: "#6A5C52", margin: 0, lineHeight: 1.6 }}>
          {isSignedIn
            ? "Select any of your orders below to view live shipment status, bill details, and courier milestones."
            : "Sign in to see your orders directly, or enter your order number below to track a guest shipment."}
        </p>
      </div>

      {/* Change 2: Direct Customer Orders Selector for Signed-In Customers */}
      {loadingAccountOrders ? (
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            padding: "28px",
            border: "1px solid #EAE3D9",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            color: "#866951",
            fontSize: "13.5px",
          }}
        >
          <SpinnerIcon size={18} color="#866951" />
          <span>Loading your orders...</span>
        </div>
      ) : isSignedIn && customerOrders.length > 0 ? (
        <section
          aria-label="Your Current Orders"
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            padding: "22px",
            border: "1px solid #EAE3D9",
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
            <h2 style={{ fontFamily: "var(--font-serif, serif)", fontSize: "20px", margin: 0, color: "#261B13" }}>
              Your Orders ({customerOrders.length})
            </h2>
            <button
              type="button"
              onClick={() => setShowManualLookup((prev) => !prev)}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                fontSize: "12px",
                color: "#866951",
                textDecoration: "underline",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {showManualLookup ? "Hide manual order lookup" : "Track another order by ID"}
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }}>
            {customerOrders.map((ord) => {
              const isSelected = trackedOrder?.order_number === ord.order_number;
              const firstItem = ord.order_items?.[0];
              const itemCount = (ord.order_items || []).reduce((sum, it) => sum + (it.quantity || 1), 0);
              return (
                <button
                  key={ord.id}
                  type="button"
                  onClick={() => handleSelectOrder(ord)}
                  style={{
                    textAlign: "left",
                    padding: "14px",
                    borderRadius: "12px",
                    border: isSelected ? "2px solid #261B13" : "1px solid #E6DACF",
                    backgroundColor: isSelected ? "#FAF7F2" : "#FFFFFF",
                    cursor: "pointer",
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "52px",
                      height: "66px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      backgroundColor: "#EFE6DC",
                      flexShrink: 0,
                    }}
                  >
                    <Image
                      src={resolveProductImage(firstItem?.image_url || "/images/saree_model_hero.jpg")}
                      alt={firstItem?.product_name || ord.order_number}
                      fill
                      sizes="52px"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#261B13" }}>
                        {ord.order_number}
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: "999px",
                          backgroundColor: ord.order_status === "Delivered" ? "#E8F5E9" : "#F3ECE1",
                          color: ord.order_status === "Delivered" ? "#1E5E3A" : "#56351E",
                        }}
                      >
                        {ord.order_status}
                      </span>
                    </div>
                    <div style={{ fontSize: "11.5px", color: "#6E5B4E", marginTop: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {firstItem?.product_name || "Handcrafted Ensemble"}
                      {itemCount > 1 ? ` + ${itemCount - 1} more` : ""}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px", fontSize: "12px" }}>
                      <span style={{ fontWeight: 700, color: "#261B13" }}>
                        Bill: {formatINR(Number(ord.total_amount || 0))}
                      </span>
                      <span style={{ fontSize: "11px", color: "#866951" }}>
                        {new Date(ord.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ) : !isSignedIn ? (
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "14px",
            padding: "16px 20px",
            border: "1px solid #E6DACF",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <span style={{ fontSize: "13px", color: "#5A4535" }}>
            Signed in customers see all their orders here without typing any tracking ID.
          </span>
          <Link
            href="/login?redirectTo=/track"
            className="avsaraa-btn-primary"
            style={{ height: "38px", padding: "0 18px", fontSize: "12px", width: "auto", textDecoration: "none", display: "inline-flex", alignItems: "center", borderRadius: "20px" }}
          >
            Sign In to View Orders →
          </Link>
        </div>
      ) : null}

      {/* Manual Order Lookup Form (For Guests or Tracking Another Order) */}
      {(showManualLookup || !isSignedIn || customerOrders.length === 0) && (
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            padding: "28px",
            border: "1px solid #EAE3D9",
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
            marginBottom: "28px",
          }}
        >
          <form onSubmit={handleTrack} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
      )}

      {/* Selected Order Detail & Live Tracking Display */}
      {trackedOrder && (
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            padding: "28px",
            border: "1px solid #EAE3D9",
            boxShadow: "0 6px 24px rgba(0,0,0,0.04)",
          }}
        >
          {/* Header reference, bill summary & status pill */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: "12px",
              borderBottom: "1px solid #EAE3D9",
              paddingBottom: "20px",
              marginBottom: "24px",
            }}
          >
            <div>
              <span style={{ fontSize: "11.5px", color: "#866951", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Order Reference
              </span>
              <h2
                style={{
                  fontFamily: "var(--font-serif, serif)",
                  fontSize: "24px",
                  margin: "4px 0 4px",
                  fontWeight: 600,
                  color: "#261B13",
                }}
              >
                {trackedOrder.order_number}
              </h2>
              <span style={{ fontSize: "12px", color: "#6E5B4E" }}>
                Placed on{" "}
                {new Date(trackedOrder.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                {trackedOrder.payment_method ? ` · ${trackedOrder.payment_method}` : ""}
              </span>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "18px", fontWeight: 700, color: "#261B13" }}>
                Bill Amount: {formatINR(Number(trackedOrder.total_amount || 0))}
              </div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 12px",
                  backgroundColor: "#E8F5E9",
                  color: "#2E7D32",
                  borderRadius: "20px",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  marginTop: "6px",
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
                {trackedOrder.order_status} · {trackedOrder.payment_status}
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
              marginBottom: "28px",
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
                Destination &amp; Delivery
              </span>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#261B13", marginTop: "3px" }}>
                {trackedOrder.destination_city} {trackedOrder.destination_postal_code ? `(${trackedOrder.destination_postal_code})` : ""}
                {trackedOrder.etd && (
                  <span style={{ display: "block", fontSize: "11.5px", color: "#866951", fontWeight: 400 }}>
                    Est. {trackedOrder.etd}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div style={{ marginBottom: "32px" }}>
            <h3
              style={{
                fontSize: "12.5px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#866951",
                margin: "0 0 18px",
                fontWeight: 600,
              }}
            >
              Shipment Progression
            </h3>

            {trackedOrder.order_status === "Cancelled" || trackedOrder.order_status === "Exchange Requested" ? (
              <div
                style={{
                  padding: "16px 18px",
                  borderRadius: "12px",
                  backgroundColor: trackedOrder.order_status === "Cancelled" ? "#FDF3F2" : "#FAF7F2",
                  border: trackedOrder.order_status === "Cancelled" ? "1px solid #EBC6C4" : "1px solid #E6DACF",
                  color: trackedOrder.order_status === "Cancelled" ? "#8A181A" : "#56351E",
                  fontSize: "13.5px",
                  fontWeight: 600,
                }}
              >
                Status: {trackedOrder.order_status} — Our concierge team has logged this update on your order.
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
                {TIMELINE_STEPS.map((step, idx) => {
                  const currentIdx = getStepIndex(trackedOrder.order_status);
                  const isCompleted = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <div key={step} style={{ textAlign: "center", flex: 1, position: "relative", zIndex: 1 }}>
                      <div
                        style={{
                          width: "30px",
                          height: "30px",
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
                        }}
                      >
                        {isCompleted ? <CheckIcon size={14} color="#FAF7F2" /> : idx + 1}
                      </div>
                      <span
                        style={{
                          fontSize: "11px",
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
            )}
          </div>

          {/* Real-time Activity Checkpoints Timeline */}
          {trackedOrder.activities && trackedOrder.activities.length > 0 && (
            <div style={{ marginBottom: "30px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
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
                  Live Scan History &amp; Checkpoints
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
                  paddingLeft: "22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "18px",
                }}
              >
                {trackedOrder.activities.map((act, index) => {
                  const isLatest = index === 0;
                  return (
                    <div key={index} style={{ position: "relative" }}>
                      <div
                        style={{
                          position: "absolute",
                          left: "-29px",
                          top: "4px",
                          width: "12px",
                          height: "12px",
                          borderRadius: "50%",
                          backgroundColor: isLatest ? "#C5A059" : "#D4BEAA",
                          border: isLatest ? "2px solid #FFFFFF" : "none",
                        }}
                      />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12px", flexWrap: "wrap" }}>
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

          {/* Bill Breakdown & Order Items */}
          <div style={{ borderTop: "1px solid #EAE3D9", paddingTop: "22px", display: "flex", flexDirection: "column", gap: "18px" }}>
            {trackedOrder.subtotal !== undefined && trackedOrder.subtotal > 0 && (
              <div style={{ backgroundColor: "#FAF7F2", padding: "14px 16px", borderRadius: "12px", border: "1px solid #EAE3D9", display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#5A4535" }}>
                  <span>Subtotal</span>
                  <span>{formatINR(trackedOrder.subtotal)}</span>
                </div>
                {trackedOrder.discount_amount && trackedOrder.discount_amount > 0 ? (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#1E5E3A", fontWeight: 600 }}>
                    <span>Promo Discount {trackedOrder.coupon_code ? `(${trackedOrder.coupon_code})` : ""}</span>
                    <span>−{formatINR(trackedOrder.discount_amount)}</span>
                  </div>
                ) : null}
                <div style={{ display: "flex", justifyContent: "space-between", color: "#5A4535" }}>
                  <span>Shipping &amp; Handling</span>
                  <span>{trackedOrder.shipping_fee ? formatINR(trackedOrder.shipping_fee) : "₹0 (Promo Applied)"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "#261B13", borderTop: "1px solid #E6DACF", paddingTop: "8px", marginTop: "2px" }}>
                  <span>Total Bill Amount</span>
                  <span>{formatINR(trackedOrder.total_amount)}</span>
                </div>
              </div>
            )}

            <div>
              <h3
                style={{
                  fontSize: "12.5px",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#866951",
                  margin: "0 0 14px",
                  fontWeight: 600,
                }}
              >
                Order Items ({trackedOrder.items.length})
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
                    {item.total_price !== undefined && (
                      <span style={{ fontSize: "13.5px", fontWeight: 600, color: "#261B13" }}>
                        {formatINR(Number(item.total_price))}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Assistance Bar */}
          <div
            style={{
              marginTop: "26px",
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
                  Every Avsaraa dispatch includes tamper-evident sealing and easy 7-day exchange support.
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
