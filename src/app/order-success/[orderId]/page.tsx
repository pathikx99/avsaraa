"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Order } from "@/types/order";
import { formatINR, resolveProductImage } from "@/lib/productUtils";
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
      <div style={{ maxWidth: "860px", margin: "0 auto" }}>
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
            AVSARAA Atelier · Order Confirmed
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
            Your Heirloom is Being Curated
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
              Purchased Heirlooms
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
                  <span>Promotional Discount ({order.coupon_code || "AVSARAA10"})</span>
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
            href="/account"
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
            <ShoppingBagIcon size={16} color="#FAF7F2" />
            <span>Track in My Account</span>
          </Link>

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
            }}
          >
            Print Receipt
          </button>
        </div>
      </div>
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

