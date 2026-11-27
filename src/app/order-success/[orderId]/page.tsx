"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Order } from "@/types/order";
import { formatINR, resolveProductImage } from "@/lib/productUtils";
import { computeInclusiveGst } from "@/lib/financials";
import AvsaraaLogo from "@/components/AvsaraaLogo";
import {
  CheckIcon,
  ShoppingBagIcon,
  DeliveryVanIcon,
  ShieldCheckIcon,
  LocationPinIcon,
  SpinnerIcon,
} from "@/components/Icons";

function OrderSuccessContent() {
  const params = useParams();
  const orderId = (params?.orderId as string) || "";

  const [order, setOrder] = useState<Order | null>(() => {
    if (typeof window === "undefined" || !orderId) return null;
    try {
      const cached = sessionStorage.getItem("avsaraa_latest_order");
      if (cached) {
        const parsed = JSON.parse(cached) as Order;
        if (parsed.id === orderId || parsed.order_number === orderId) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(() => !order);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    if (!orderId) {
      return;
    }

    const fetchFreshOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();
        if (!mounted) return;

        if (data.success && data.order) {
          setOrder(data.order);
        } else {
          setError((prev) => (prev ? prev : data.message || "Could not retrieve order details."));
        }
      } catch {
        if (mounted) {
          setError((prev) => prev || "Failed to connect to order service.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchFreshOrder();

    return () => {
      mounted = false;
    };
  }, [orderId]);

  if (loading && !order) {
    return (
      <div
        style={{
          minHeight: "75vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          backgroundColor: "#FAF7F2",
          color: "#261B13",
        }}
      >
        <SpinnerIcon size={32} color="#866951" />
        <p style={{ fontSize: "14px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Retrieving your order invoice...
        </p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div
        style={{
          minHeight: "75vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px",
          backgroundColor: "#FAF7F2",
          color: "#261B13",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-cinzel), serif",
            fontSize: "24px",
            marginBottom: "12px",
          }}
        >
          Order Reference Note
        </h1>
        <p style={{ color: "#866951", maxWidth: "420px", fontSize: "14px", marginBottom: "24px" }}>
          {error}
        </p>
        <div style={{ display: "flex", gap: "12px" }}>
          <Link
            href="/account"
            style={{
              padding: "12px 24px",
              borderRadius: "24px",
              backgroundColor: "#261B13",
              color: "#FAF7F2",
              textDecoration: "none",
              fontSize: "12px",
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            My Account Orders
          </Link>
          <Link
            href="/"
            style={{
              padding: "12px 24px",
              borderRadius: "24px",
              border: "1px solid #261B13",
              color: "#261B13",
              textDecoration: "none",
              fontSize: "12px",
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            Return to Store
          </Link>
        </div>
      </div>
    );
  }

  const estDeliveryDate = order?.estimated_delivery
    ? new Date(order.estimated_delivery).toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Within 4 to 6 business days";

  return (
    <div
      style={{
        backgroundColor: "#FAF7F2",
        color: "#261B13",
        minHeight: "100vh",
        padding: "40px 16px 80px",
      }}
    >
      <div className="no-print" style={{ maxWidth: "860px", margin: "0 auto" }}>
        {/* Top Celebration Card */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "20px",
            padding: "40px 32px",
            textAlign: "center",
            border: "1px solid rgba(38, 27, 19, 0.08)",
            boxShadow: "0 8px 32px rgba(38, 27, 19, 0.04)",
            marginBottom: "28px",
          }}
        >
          {/* Gold Crest */}
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              backgroundColor: "#261B13",
              color: "#C5A880",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              boxShadow: "0 6px 20px rgba(38, 27, 19, 0.15)",
            }}
          >
            <CheckIcon size={34} color="#C5A880" />
          </div>

          <span
            style={{
              fontSize: "12px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#A97C50",
              fontWeight: 600,
            }}
          >
            AVSARAA · Order Confirmed
          </span>

          <h1
            style={{
              fontFamily: "var(--font-cinzel), serif",
              fontSize: "30px",
              fontWeight: 500,
              letterSpacing: "0.04em",
              margin: "8px 0 12px",
            }}
          >
            Your Order is Being Prepared
          </h1>

          <p
            style={{
              color: "#866951",
              maxWidth: "520px",
              margin: "0 auto 24px",
              fontSize: "14px",
              lineHeight: 1.6,
            }}
          >
            Thank you for choosing AVSARAA. Our master weavers and artisans are preparing your
            garments with signature protective packaging and certified authenticity.
          </p>

          {/* Quick Badges Row */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              gap: "16px",
              padding: "16px 20px",
              backgroundColor: "#FAF7F2",
              borderRadius: "12px",
              border: "1px solid rgba(38, 27, 19, 0.06)",
            }}
          >
            <div>
              <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#866951", display: "block" }}>
                Order Number
              </span>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#261B13" }}>
                {order?.order_number || orderId}
              </span>
            </div>

            <div style={{ width: "1px", height: "24px", backgroundColor: "rgba(38, 27, 19, 0.12)" }} />

            <div>
              <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#866951", display: "block" }}>
                Order Status
              </span>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#28a745",
                  backgroundColor: "rgba(40, 167, 69, 0.12)",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  textTransform: "uppercase",
                }}
              >
                ● {order?.order_status || "Confirmed"}
              </span>
            </div>

            <div style={{ width: "1px", height: "24px", backgroundColor: "rgba(38, 27, 19, 0.12)" }} />

            <div>
              <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#866951", display: "block" }}>
                Payment Method
              </span>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#261B13" }}>
                {order?.payment_method === "COD" ? "Cash on Delivery (Pending)" : "Online Verified (Paid)"}
              </span>
            </div>
          </div>
        </div>

        {/* Courier & Delivery Timeline Card */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            padding: "24px 28px",
            border: "1px solid rgba(38, 27, 19, 0.08)",
            marginBottom: "28px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                backgroundColor: "rgba(197, 168, 128, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <DeliveryVanIcon size={24} color="#866951" />
            </div>
            <div>
              <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#866951" }}>
                Estimated Handcrafted Delivery
              </span>
              <h3 style={{ fontSize: "15px", fontWeight: 600, margin: "2px 0 0", color: "#261B13" }}>
                {estDeliveryDate}
              </h3>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#866951" }}>
              Courier Partner
            </span>
            <p style={{ margin: "2px 0 0", fontSize: "13px", fontWeight: 600, color: "#261B13" }}>
              {order?.courier_partner || "Blue Dart Luxury Express"}
            </p>
            {order?.tracking_number && (
              <span style={{ fontSize: "11px", color: "#866951" }}>
                AWB Tracking: {order.tracking_number}
              </span>
            )}
          </div>
        </div>

        {/* Order Details & Summary Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px",
            marginBottom: "32px",
          }}
        >
          {/* Purchased Line Items */}
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              padding: "24px",
              border: "1px solid rgba(38, 27, 19, 0.08)",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-cinzel), serif",
                fontSize: "16px",
                fontWeight: 600,
                letterSpacing: "0.04em",
                margin: "0 0 16px",
                paddingBottom: "12px",
                borderBottom: "1px solid rgba(38, 27, 19, 0.08)",
              }}
            >
              Ordered Items
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {(order?.order_items || []).map((item, idx) => (
                <div
                  key={item.id || idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    paddingBottom: "12px",
                    borderBottom: "1px dashed rgba(38, 27, 19, 0.08)",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "52px",
                      height: "64px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      backgroundColor: "#EFECE6",
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

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: "13px",
                        fontWeight: 500,
                        margin: 0,
                        color: "#261B13",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.product_name}
                    </p>
                    <p style={{ fontSize: "12px", color: "#866951", margin: "2px 0 0" }}>
                      Qty: {item.quantity} · {formatINR(item.unit_price)}
                    </p>
                  </div>

                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#261B13", flexShrink: 0 }}>
                    {formatINR(item.total_price || item.unit_price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Financial Totals */}
            <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#5A4535" }}>
                <span>Subtotal</span>
                <span>{formatINR(order?.subtotal || 0)}</span>
              </div>

              {order?.discount_amount ? (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#28a745" }}>
                  <span>Promotional Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}</span>
                  <span>-{formatINR(order.discount_amount)}</span>
                </div>
              ) : null}

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#5A4535" }}>
                <span>Complimentary Shipping</span>
                <span style={{ color: "#28a745", fontWeight: 600 }}>FREE</span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#261B13",
                  paddingTop: "10px",
                  borderTop: "1px solid rgba(38, 27, 19, 0.1)",
                }}
              >
                <span>Total Amount</span>
                <span>{formatINR(order?.total_amount || 0)}</span>
              </div>
            </div>
          </div>

          {/* Delivery & Security Information */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Delivery Address */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                padding: "24px",
                border: "1px solid rgba(38, 27, 19, 0.08)",
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-cinzel), serif",
                  fontSize: "16px",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  margin: "0 0 12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <LocationPinIcon size={16} color="#866951" />
                <span>Shipping Destination</span>
              </h2>

              {order?.shipping_address_snapshot && (
                <div style={{ fontSize: "13px", color: "#5A4535", lineHeight: "1.6" }}>
                  <p style={{ fontWeight: 600, margin: 0, color: "#261B13" }}>
                    {order.shipping_address_snapshot.recipient_name}
                  </p>
                  <p style={{ margin: "2px 0" }}>
                    {order.shipping_address_snapshot.address_line1}
                    {order.shipping_address_snapshot.address_line2
                      ? `, ${order.shipping_address_snapshot.address_line2}`
                      : ""}
                  </p>
                  {order.shipping_address_snapshot.landmark && (
                    <p style={{ margin: "2px 0", color: "#866951" }}>
                      Landmark: {order.shipping_address_snapshot.landmark}
                    </p>
                  )}
                  <p style={{ margin: "2px 0" }}>
                    {order.shipping_address_snapshot.city}, {order.shipping_address_snapshot.state} —{" "}
                    {order.shipping_address_snapshot.postal_code}
                  </p>
                  <p style={{ margin: "4px 0 0", color: "#866951", fontWeight: 500 }}>
                    📞 {order.shipping_address_snapshot.phone_number}
                  </p>
                </div>
              )}
            </div>

            {/* Reassurances */}
            <div
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "16px",
                padding: "20px 24px",
                border: "1px solid rgba(38, 27, 19, 0.08)",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#5A4535" }}>
                <ShieldCheckIcon size={16} color="#A97C50" />
                <span>Insured Heritage Transit with Silk Mark Certification</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#5A4535" }}>
                <CheckIcon size={16} color="#A97C50" />
                <span>SMS & WhatsApp tracking link will be dispatched shortly</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "14px",
          }}
        >
          <Link
            href={`/track?orderId=${encodeURIComponent(order?.order_number || orderId)}&contact=${encodeURIComponent(order?.shipping_address_snapshot?.phone_number || order?.shipping_address_snapshot?.email || "")}`}
            className="avsaraa-btn-primary btn-shine"
            style={{
              padding: "14px 32px",
              borderRadius: "28px",
              textDecoration: "none",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              backgroundColor: "#261B13",
              color: "#FAF7F2",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <DeliveryVanIcon size={16} color="#FAF7F2" />
            <span>Track Live Shipment</span>
          </Link>

          {!order?.shipping_address_snapshot?.is_guest && (
            <Link
              href="/account"
              className="avsaraa-btn-outline"
              style={{
                padding: "14px 28px",
                borderRadius: "28px",
                textDecoration: "none",
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <ShoppingBagIcon size={16} color="#866951" />
              <span>View in My Account</span>
            </Link>
          )}

          <Link
            href="/"
            style={{
              padding: "14px 28px",
              borderRadius: "28px",
              textDecoration: "none",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              border: "1px solid #261B13",
              color: "#261B13",
              backgroundColor: "transparent",
            }}
          >
            Continue Exploring
          </Link>

          <button
            type="button"
            onClick={() => window.print()}
            style={{
              padding: "14px 24px",
              borderRadius: "28px",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              border: "1px solid rgba(38, 27, 19, 0.2)",
              color: "#5A4535",
              backgroundColor: "transparent",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>🖨️</span>
            <span>Print Tax Invoice</span>
          </button>
        </div>

        {order?.shipping_address_snapshot?.is_guest && (
          <div
            style={{
              marginTop: "24px",
              textAlign: "center",
              fontSize: "13px",
              color: "#6E5B4E",
            }}
          >
            Want to save this order for future tracking?{" "}
            <Link
              href={`/register?email=${encodeURIComponent(order.shipping_address_snapshot.email || "")}`}
              style={{ fontWeight: 600, color: "#261B13", textDecoration: "underline" }}
            >
              Create an Account →
            </Link>
          </div>
        )}
      </div>

      {/* =========================================================================
          STATUTORY INDIAN GST TAX INVOICE (Visible exclusively during window.print)
          ========================================================================= */}
      {order && (
        <div className="print-tax-invoice-sheet" style={{ display: "none" }}>
          <div
            style={{
              fontFamily: "var(--font-geist-sans), -apple-system, Arial, sans-serif",
              color: "#000000",
              padding: "20px",
              maxWidth: "800px",
              margin: "0 auto",
              fontSize: "12px",
              lineHeight: "1.5",
            }}
          >
            {/* Invoice Top Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                borderBottom: "2px solid #261B13",
                paddingBottom: "16px",
                marginBottom: "16px",
              }}
            >
              <div>
                <AvsaraaLogo width={150} />
                <div style={{ marginTop: "8px", fontSize: "11px", color: "#333", lineHeight: "1.4" }}>
                  <strong>AVSARAA LOOMS & ATELIER PVT. LTD.</strong><br />
                  Gujarat — 395002, India<br />
                  <strong>GSTIN:</strong> 24AAACA0000A1Z5 | <strong>State Code:</strong> 24 (Gujarat)<br />
                  <strong>Contact:</strong> contact.avsaraa@gmail.com | +91 98765 43210
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 10px",
                    backgroundColor: "#261B13",
                    color: "#FFFFFF",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    borderRadius: "4px",
                    marginBottom: "6px",
                  }}
                >
                  TAX INVOICE / CASH MEMO
                </span>
                <p style={{ margin: "4px 0 0", fontSize: "13px", fontWeight: 700 }}>
                  INV-{order.created_at ? new Date(order.created_at).getFullYear() : 2026}-{(order.order_number || orderId).match(/-(\d+)$/)?.[1] || (order.order_number || orderId).replace(/[^A-Za-z0-9]/g, "").slice(-5)}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#555" }}>
                  Order Ref: <strong>#{order.order_number}</strong>
                </p>
                <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#555" }}>
                  Date: {order.created_at ? new Date(order.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }) : "Confirmed"}
                </p>
              </div>
            </div>

            {/* Recipient & Destination Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
                border: "1px solid #E5E5E5",
                borderRadius: "6px",
                padding: "12px 16px",
                marginBottom: "16px",
                backgroundColor: "#FAFAFA",
              }}
            >
              <div>
                <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "#666", letterSpacing: "0.06em", display: "block", marginBottom: "4px" }}>
                  BILL TO / BUYER DETAILS
                </span>
                <strong style={{ fontSize: "13px" }}>{order.shipping_address_snapshot.recipient_name}</strong><br />
                Phone: {order.shipping_address_snapshot.phone_number}<br />
                {order.shipping_address_snapshot.email && <>Email: {order.shipping_address_snapshot.email}<br /></>}
                Place of Supply: {order.shipping_address_snapshot.state} (PIN: {order.shipping_address_snapshot.postal_code})
              </div>

              <div>
                <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "#666", letterSpacing: "0.06em", display: "block", marginBottom: "4px" }}>
                  SHIP TO / DELIVERY DESTINATION
                </span>
                {order.shipping_address_snapshot.address_line1}
                {order.shipping_address_snapshot.address_line2 ? `, ${order.shipping_address_snapshot.address_line2}` : ""}<br />
                {order.shipping_address_snapshot.landmark && <>Landmark: {order.shipping_address_snapshot.landmark}<br /></>}
                {order.shipping_address_snapshot.city}, {order.shipping_address_snapshot.state} — {order.shipping_address_snapshot.postal_code}<br />
                <strong>Payment Mode:</strong> {order.payment_method} ({order.payment_status})
              </div>
            </div>

            {/* Items Table */}
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginBottom: "16px",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#261B13", color: "#FFFFFF", fontSize: "11px", textTransform: "uppercase" }}>
                  <th style={{ padding: "8px 10px", textAlign: "center", border: "1px solid #261B13" }}>#</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", border: "1px solid #261B13" }}>Item Description</th>
                  <th style={{ padding: "8px 10px", textAlign: "center", border: "1px solid #261B13" }}>HSN</th>
                  <th style={{ padding: "8px 10px", textAlign: "center", border: "1px solid #261B13" }}>Qty</th>
                  <th style={{ padding: "8px 12px", textAlign: "right", border: "1px solid #261B13" }}>Unit Rate</th>
                  <th style={{ padding: "8px 12px", textAlign: "right", border: "1px solid #261B13" }}>Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {(order.order_items || []).map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #E5E5E5" }}>
                    <td style={{ padding: "8px 10px", textAlign: "center", borderLeft: "1px solid #E5E5E5", borderRight: "1px solid #E5E5E5" }}>{idx + 1}</td>
                    <td style={{ padding: "8px 12px", borderRight: "1px solid #E5E5E5" }}>
                      <strong>{item.product_name}</strong><br />
                      <span style={{ fontSize: "10px", color: "#666" }}>Variant: {item.size || "Standard"} | Tone: {item.color || "Default"}</span>
                    </td>
                    <td style={{ padding: "8px 10px", textAlign: "center", borderRight: "1px solid #E5E5E5" }}>5208</td>
                    <td style={{ padding: "8px 10px", textAlign: "center", borderRight: "1px solid #E5E5E5" }}>{item.quantity}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", borderRight: "1px solid #E5E5E5" }}>{formatINR(item.unit_price)}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", borderRight: "1px solid #E5E5E5", fontWeight: 600 }}>
                      {formatINR(item.total_price || item.unit_price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Calculations & GST Split */}
            {(() => {
              const netDisc = Math.max(0, (order.subtotal || 0) - (order.discount_amount || 0));
              const { gstAmount: gstAmt, taxableAmount: taxAmt } = computeInclusiveGst(netDisc);
              const st = (order.shipping_address_snapshot.state || "").toLowerCase();
              const pn = (order.shipping_address_snapshot.postal_code || "");
              const isIntra = st.includes("gujarat") || /^3[6-9]\d{4}$/.test(pn);
              const cgst = isIntra ? Math.round((gstAmt / 2) * 100) / 100 : 0;
              const sgst = isIntra ? Math.round((gstAmt - cgst) * 100) / 100 : 0;
              const igst = !isIntra ? gstAmt : 0;

              return (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                  <div style={{ maxWidth: "50%", fontSize: "11px", color: "#555" }}>
                    <p style={{ margin: "0 0 4px" }}>
                      <strong>Statutory Tax Declaration:</strong><br />
                      GST computed @ 5% inclusive rate applicable under Indian Tariff Heading 5208 (Woven Silk / Handloom).
                    </p>
                    <p style={{ margin: "4px 0 0" }}>
                      <strong>Courier Partner:</strong> {order.courier_partner || "Blue Dart Express"}<br />
                      <strong>AWB / Tracking:</strong> {order.tracking_number || "Generated Upon Packing"}
                    </p>
                  </div>

                  <div style={{ width: "280px" }}>
                    <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                      <tbody>
                        <tr>
                          <td style={{ padding: "4px 0", color: "#555" }}>Taxable Value:</td>
                          <td style={{ padding: "4px 0", textAlign: "right" }}>{formatINR(taxAmt)}</td>
                        </tr>
                        {isIntra ? (
                          <>
                            <tr>
                              <td style={{ padding: "3px 0", color: "#555" }}>CGST (2.5%):</td>
                              <td style={{ padding: "3px 0", textAlign: "right" }}>{formatINR(cgst)}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: "3px 0", color: "#555" }}>SGST (2.5%):</td>
                              <td style={{ padding: "3px 0", textAlign: "right" }}>{formatINR(sgst)}</td>
                            </tr>
                          </>
                        ) : (
                          <tr>
                            <td style={{ padding: "3px 0", color: "#555" }}>IGST (5.0%):</td>
                            <td style={{ padding: "3px 0", textAlign: "right" }}>{formatINR(igst)}</td>
                          </tr>
                        )}
                        {order.discount_amount ? (
                          <tr>
                            <td style={{ padding: "4px 0", color: "#2E7D32" }}>Discount ({order.coupon_code || "COUPON"}):</td>
                            <td style={{ padding: "4px 0", textAlign: "right", color: "#2E7D32" }}>-{formatINR(order.discount_amount)}</td>
                          </tr>
                        ) : null}
                        <tr>
                          <td style={{ padding: "4px 0", color: "#555" }}>Delivery & Insurance:</td>
                          <td style={{ padding: "4px 0", textAlign: "right" }}>
                            {order.shipping_fee === 0 ? "FREE" : formatINR(order.shipping_fee)}
                          </td>
                        </tr>
                        <tr style={{ borderTop: "2px solid #261B13", borderBottom: "2px solid #261B13" }}>
                          <td style={{ padding: "8px 0", fontWeight: 700, fontSize: "14px" }}>TOTAL INVOICE VALUE:</td>
                          <td style={{ padding: "8px 0", textAlign: "right", fontWeight: 700, fontSize: "15px" }}>
                            {formatINR(order.total_amount)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {/* Terms & Signature Box */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                borderTop: "1px solid #E5E5E5",
                paddingTop: "16px",
                fontSize: "10px",
                color: "#666",
              }}
            >
              <div>
                <p style={{ margin: 0 }}>
                  1. Goods once sold are covered by Avsaraa&apos;s 7-Day Exchange Guarantee (Exchanges only, no refunds).<br />
                  2. All disputes subject to jurisdiction of competent courts in Gujarat, India only.<br />
                  3. Computer-generated tax invoice; no physical stamp required under IT Act 2000.
                </p>
              </div>

              <div style={{ textAlign: "center" }}>
                <span style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#261B13", marginBottom: "4px" }}>
                  For AVSARAA LOOMS & ATELIER
                </span>
                <div
                  style={{
                    border: "1px dashed #261B13",
                    padding: "6px 16px",
                    borderRadius: "4px",
                    fontSize: "10px",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                  }}
                >
                  Authorized Signatory
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Global Styles for Print Media */}
      <style jsx global>{`
        @media print {
          body, html {
            background-color: #FFFFFF !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          nav, footer, .no-print, header, [role="banner"], [role="navigation"] {
            display: none !important;
          }
          .print-tax-invoice-sheet {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

function OrderSuccessFallback() {
  return (
    <div
      style={{
        minHeight: "75vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        backgroundColor: "#FAF7F2",
        color: "#261B13",
      }}
    >
      <SpinnerIcon size={32} color="#866951" />
      <p style={{ fontSize: "14px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Retrieving your order invoice...
      </p>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<OrderSuccessFallback />}>
      <OrderSuccessContent />
    </Suspense>
  );
}

