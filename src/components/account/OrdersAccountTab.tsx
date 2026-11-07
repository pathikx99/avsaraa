"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Order } from "@/types/order";
import { formatINR, resolveProductImage } from "@/lib/productUtils";
import {
  ShoppingBagIcon,
  DeliveryVanIcon,
  ReturnBoxIcon,
  CloseIcon,
  SpinnerIcon,
} from "@/components/Icons";

interface OrdersAccountTabProps {
  orders: Order[];
  loadingOrders: boolean;
  onOrdersUpdate: (orders: Order[]) => void;
  showToast: (message: string) => void;
}

export default function OrdersAccountTab({
  orders,
  loadingOrders,
  onOrdersUpdate,
  showToast,
}: OrdersAccountTabProps) {
  // Exchange Portal State
  const [selectedExchangeOrder, setSelectedExchangeOrder] = useState<Order | null>(null);
  const [exchangeReason, setExchangeReason] = useState("Size mismatch (Need larger size)");
  const [exchangeReplacement, setExchangeReplacement] = useState("");
  const [exchangeDetails, setExchangeDetails] = useState("");
  const [submittingExchange, setSubmittingExchange] = useState(false);
  const [now] = useState(() => Date.now());

  const handleSubmitExchange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExchangeOrder) return;

    setSubmittingExchange(true);
    try {
      const res = await fetch(`/api/orders/${selectedExchangeOrder.id}/exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: exchangeReason,
          requested_replacement: exchangeReplacement.trim() || undefined,
          details: exchangeDetails.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to submit exchange request.");
      }

      onOrdersUpdate(
        orders.map((ord) =>
          ord.id === selectedExchangeOrder.id
            ? { ...ord, order_status: "Exchange Requested", notes: data.order?.notes || ord.notes }
            : ord
        )
      );

      showToast("7-Day Heritage Exchange request received. Our concierge will contact you shortly.");
      setSelectedExchangeOrder(null);
      setExchangeReplacement("");
      setExchangeDetails("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error submitting exchange request.";
      showToast(msg);
    } finally {
      setSubmittingExchange(false);
    }
  };

  return (
    <div className="fade-in-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <span style={{ fontSize: "11px", color: "#866951", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", display: "block" }}>
            PURCHASE HISTORY
          </span>
          <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "24px", color: "#261B13", margin: 0 }}>
            My Orders ({orders.length})
          </h3>
        </div>

        <Link
          href="/"
          className="avsaraa-btn-outline"
          style={{ height: "36px", padding: "0 16px", fontSize: "12px", width: "auto" }}
        >
          Discover Heirlooms
        </Link>
      </div>

      {loadingOrders ? (
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8DED3",
            borderRadius: "18px",
            padding: "48px 24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <SpinnerIcon size={24} color="#866951" />
          <p style={{ fontSize: "13px", color: "#866951", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Loading your order history...
          </p>
        </div>
      ) : orders.length === 0 ? (
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8DED3",
            borderRadius: "18px",
            padding: "48px 24px",
            textAlign: "center",
            boxShadow: "0 6px 20px -6px rgba(38,27,19,0.04)",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              backgroundColor: "#FAF7F2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              border: "1px solid #EFE6DC",
            }}
          >
            <ShoppingBagIcon size={26} color="#866951" />
          </div>
          <h4 style={{ fontFamily: "var(--font-serif)", fontSize: "20px", color: "#261B13", marginBottom: "8px" }}>
            No Orders Placed Yet
          </h4>
          <p style={{ fontSize: "13.5px", color: "#6E5B4E", maxWidth: "420px", margin: "0 auto 20px", lineHeight: 1.5 }}>
            When you acquire handcrafted heirlooms and couture pieces from AVSARAA, your real-time tracking, AWB details, and 7-day exchange portal will appear here.
          </p>
          <Link
            href="/"
            className="avsaraa-btn-primary"
            style={{ display: "inline-flex", height: "42px", padding: "0 24px", fontSize: "12.5px" }}
          >
            Explore New Arrivals
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {orders.map((order) => {
            // Determine status colors
            let badgeBg = "rgba(40, 167, 69, 0.12)";
            let badgeColor = "#28a745";
            let badgeBorder = "rgba(40, 167, 69, 0.25)";

            if (order.order_status === "Processing") {
              badgeBg = "rgba(197, 160, 89, 0.15)";
              badgeColor = "#A97C50";
              badgeBorder = "rgba(197, 160, 89, 0.3)";
            } else if (order.order_status === "Dispatched" || order.order_status === "Out for Delivery") {
              badgeBg = "rgba(0, 112, 243, 0.12)";
              badgeColor = "#0070f3";
              badgeBorder = "rgba(0, 112, 243, 0.25)";
            } else if (order.order_status === "Delivered") {
              badgeBg = "rgba(21, 87, 36, 0.15)";
              badgeColor = "#155724";
              badgeBorder = "rgba(21, 87, 36, 0.3)";
            } else if (order.order_status === "Exchange Requested") {
              badgeBg = "rgba(111, 66, 193, 0.12)";
              badgeColor = "#6f42c1";
              badgeBorder = "rgba(111, 66, 193, 0.25)";
            } else if (order.order_status === "Cancelled") {
              badgeBg = "rgba(220, 53, 69, 0.12)";
              badgeColor = "#dc3545";
              badgeBorder = "rgba(220, 53, 69, 0.25)";
            }

            // Check if eligible for 7-day exchange
            const createdAtDate = new Date(order.created_at);
            const daysSinceOrder = (now - createdAtDate.getTime()) / (1000 * 60 * 60 * 24);
            const canRequestExchange =
              daysSinceOrder <= 7 &&
              order.order_status !== "Cancelled" &&
              order.order_status !== "Exchange Requested" &&
              order.order_status !== "Exchanged";

            return (
              <div
                key={order.id}
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E8DED3",
                  borderRadius: "18px",
                  overflow: "hidden",
                  boxShadow: "0 4px 16px rgba(38,27,19,0.03)",
                }}
              >
                {/* Header Strip */}
                <div
                  style={{
                    backgroundColor: "#FAF7F2",
                    padding: "16px 20px",
                    borderBottom: "1px solid #E8DED3",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                    <div>
                      <span style={{ fontSize: "11px", color: "#866951", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        ORDER NUMBER
                      </span>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "#261B13" }}>
                        {order.order_number}
                      </div>
                    </div>

                    <div style={{ height: "24px", width: "1px", backgroundColor: "#E0D5C7" }} />

                    <div>
                      <span style={{ fontSize: "11px", color: "#866951", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        PLACED ON
                      </span>
                      <div style={{ fontSize: "13px", color: "#5A4535" }}>
                        {new Date(order.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: "14px",
                        fontSize: "12px",
                        fontWeight: 600,
                        backgroundColor: badgeBg,
                        color: badgeColor,
                        border: `1px solid ${badgeBorder}`,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          backgroundColor: badgeColor,
                        }}
                      />
                      {order.order_status}
                    </span>
                  </div>
                </div>

                {/* Items in Order */}
                <div style={{ padding: "20px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {(order.order_items || []).map((item, idx) => (
                      <div
                        key={item.id || idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingBottom: idx !== (order.order_items?.length || 0) - 1 ? "14px" : "0",
                          borderBottom: idx !== (order.order_items?.length || 0) - 1 ? "1px solid #F5EFEB" : "none",
                          gap: "12px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                          <div
                            style={{
                              position: "relative",
                              width: "56px",
                              height: "72px",
                              borderRadius: "8px",
                              overflow: "hidden",
                              backgroundColor: "#FAF7F2",
                              flexShrink: 0,
                            }}
                          >
                            <Image
                              src={resolveProductImage(item.image_url)}
                              alt={item.product_name}
                              fill
                              sizes="56px"
                              style={{ objectFit: "cover" }}
                            />
                          </div>

                          <div>
                            <div style={{ fontSize: "14px", fontWeight: 600, color: "#261B13" }}>
                              {item.product_name}
                            </div>
                            <div style={{ fontSize: "12px", color: "#866951", marginTop: "2px" }}>
                              Qty: {item.quantity} {item.size ? `· Size: ${item.size}` : ""} {item.color ? `· Color: ${item.color}` : ""}
                            </div>
                            {item.tailored_blouse && (
                              <span
                                style={{
                                  display: "inline-block",
                                  marginTop: "4px",
                                  fontSize: "10px",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  backgroundColor: "rgba(197, 160, 89, 0.15)",
                                  color: "#A97C50",
                                  fontWeight: 600,
                                }}
                              >
                                Tailored Blouse Included
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: "14px", fontWeight: 600, color: "#261B13" }}>
                            {formatINR(item.total_price)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tracking details if available */}
                  {(order.tracking_number || order.courier_partner) && (
                    <div
                      style={{
                        marginTop: "16px",
                        padding: "12px 16px",
                        backgroundColor: "#FAF7F2",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "10px",
                        border: "1px solid #EFE6DC",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <DeliveryVanIcon size={18} color="#866951" />
                        <span style={{ fontSize: "12.5px", color: "#5A4535" }}>
                          <strong>{order.courier_partner || "Express Courier"}</strong> · AWB Tracking:{" "}
                          <span style={{ fontFamily: "monospace", fontWeight: 600, color: "#261B13" }}>
                            {order.tracking_number}
                          </span>
                        </span>
                      </div>
                      <span style={{ fontSize: "11px", color: "#866951", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Verified Pan-India Insured Dispatch
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Strip with Actions */}
                <div
                  style={{
                    backgroundColor: "#FAF9F6",
                    padding: "14px 20px",
                    borderTop: "1px solid #E8DED3",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "11px", color: "#866951", display: "block" }}>
                      Total Amount Paid
                    </span>
                    <span style={{ fontSize: "16px", fontWeight: 700, color: "#261B13" }}>
                      {formatINR(order.total_amount)}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <Link
                      href={`/order-success/${order.id}`}
                      className="avsaraa-btn-outline"
                      style={{ height: "36px", padding: "0 14px", fontSize: "12px", width: "auto" }}
                    >
                      View Invoice
                    </Link>

                    {canRequestExchange && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedExchangeOrder(order);
                          setExchangeReason("Size mismatch (Need larger size)");
                          setExchangeReplacement("");
                          setExchangeDetails("");
                        }}
                        style={{
                          height: "36px",
                          padding: "0 14px",
                          fontSize: "12px",
                          fontWeight: 600,
                          borderRadius: "18px",
                          border: "1px solid #866951",
                          backgroundColor: "rgba(134, 105, 81, 0.06)",
                          color: "#866951",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <ReturnBoxIcon size={14} color="#866951" />
                        <span>7-Day Exchange</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 7-Day Heritage Exchange Modal */}
      {selectedExchangeOrder && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(38, 27, 19, 0.65)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "20px",
              maxWidth: "520px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "32px 28px",
              boxShadow: "0 20px 40px rgba(38, 27, 19, 0.2)",
              border: "1px solid #E8DED3",
              position: "relative",
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedExchangeOrder(null)}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#8E7D70",
              }}
            >
              <CloseIcon size={20} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <ReturnBoxIcon size={22} color="#866951" />
              <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#866951" }}>
                HERITAGE PROMISE
              </span>
            </div>

            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "22px", color: "#261B13", margin: "0 0 6px" }}>
              7-Day Handcrafted Exchange
            </h3>

            <p style={{ fontSize: "13px", color: "#6E5B4E", lineHeight: 1.5, margin: "0 0 20px" }}>
              Order <strong>{selectedExchangeOrder.order_number}</strong> · Complimentary reverse doorstep pickup and artisan re-tailoring.
            </p>

            <form onSubmit={handleSubmitExchange} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#261B13", marginBottom: "6px" }}>
                  Reason for Exchange *
                </label>
                <select
                  value={exchangeReason}
                  onChange={(e) => setExchangeReason(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #D6C7B7",
                    backgroundColor: "#FAF7F2",
                    fontSize: "13px",
                    color: "#261B13",
                  }}
                >
                  <option value="Size mismatch (Need larger size)">Size mismatch (Need larger size)</option>
                  <option value="Size mismatch (Need smaller size)">Size mismatch (Need smaller size)</option>
                  <option value="Color / Fabric variant preference">Color / Fabric variant preference</option>
                  <option value="Fitting / Stitching adjustment">Fitting / Stitching adjustment</option>
                  <option value="Minor artisan weave query / defect">Minor artisan weave query / defect</option>
                  <option value="Different ensemble preferred">Different ensemble preferred</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#261B13", marginBottom: "6px" }}>
                  Desired Replacement Size / Color
                </label>
                <input
                  type="text"
                  placeholder="e.g. Exchange for Size M (38) in Royal Maroon"
                  value={exchangeReplacement}
                  onChange={(e) => setExchangeReplacement(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #D6C7B7",
                    backgroundColor: "#FAF7F2",
                    fontSize: "13px",
                    color: "#261B13",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#261B13", marginBottom: "6px" }}>
                  Special Artisan Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Tell our concierge team any additional fitting preferences..."
                  value={exchangeDetails}
                  onChange={(e) => setExchangeDetails(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #D6C7B7",
                    backgroundColor: "#FAF7F2",
                    fontSize: "13px",
                    color: "#261B13",
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setSelectedExchangeOrder(null)}
                  style={{
                    height: "40px",
                    padding: "0 18px",
                    fontSize: "13px",
                    fontWeight: 600,
                    borderRadius: "20px",
                    border: "1px solid #D6C7B7",
                    backgroundColor: "transparent",
                    color: "#6E5B4E",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingExchange}
                  className="avsaraa-btn-primary"
                  style={{
                    height: "40px",
                    padding: "0 22px",
                    fontSize: "13px",
                    opacity: submittingExchange ? 0.7 : 1,
                    cursor: submittingExchange ? "not-allowed" : "pointer",
                  }}
                >
                  {submittingExchange ? (
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <SpinnerIcon size={14} color="#FAF7F2" />
                      Submitting...
                    </span>
                  ) : (
                    "Submit Exchange Request"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
