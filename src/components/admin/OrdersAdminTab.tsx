"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { Order, OrderStatus } from "@/types/order";
import { formatINR, resolveProductImage } from "@/lib/productUtils";
import {
  ShoppingBagIcon,
  DeliveryVanIcon,
  CloseIcon,
  SearchIcon,
  SpinnerIcon,
} from "@/components/Icons";

interface OrdersAdminTabProps {
  orders: Order[];
  onRefresh: () => Promise<void> | void;
  showToast: (text: string, type: "success" | "error" | "info") => void;
  getAuthHeaders: () => Promise<Record<string, string>>;
}

export default function OrdersAdminTab({
  orders,
  onRefresh,
  showToast,
  getAuthHeaders,
}: OrdersAdminTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Modals state
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [editingCourierOrder, setEditingCourierOrder] = useState<Order | null>(null);
  const [courierPartnerInput, setCourierPartnerInput] = useState("Blue Dart Luxury Express");
  const [trackingNumberInput, setTrackingNumberInput] = useState("");
  const [orderNotesInput, setOrderNotesInput] = useState("");
  const [savingCourier, setSavingCourier] = useState(false);

  // KPI Calculations
  const totalRevenue = useMemo(() => {
    return orders
      .filter((o) => o.order_status !== "Cancelled")
      .reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);
  }, [orders]);

  const awaitingDispatchCount = useMemo(() => {
    return orders.filter(
      (o) => o.order_status === "Confirmed" || o.order_status === "Processing"
    ).length;
  }, [orders]);

  const inTransitCount = useMemo(() => {
    return orders.filter(
      (o) => o.order_status === "Dispatched" || o.order_status === "Out for Delivery"
    ).length;
  }, [orders]);

  const exchangeRequestsCount = useMemo(() => {
    return orders.filter((o) => o.order_status === "Exchange Requested").length;
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        order.order_number.toLowerCase().includes(query) ||
        (order.shipping_address_snapshot?.recipient_name &&
          order.shipping_address_snapshot.recipient_name.toLowerCase().includes(query)) ||
        (order.shipping_address_snapshot?.phone_number &&
          order.shipping_address_snapshot.phone_number.includes(query)) ||
        (order.tracking_number && order.tracking_number.toLowerCase().includes(query)) ||
        (order.courier_partner && order.courier_partner.toLowerCase().includes(query));

      const matchFilter = statusFilter === "ALL" || order.order_status === statusFilter;

      return matchSearch && matchFilter;
    });
  }, [orders, searchQuery, statusFilter]);

  // Status Change Handler
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, order_status: newStatus }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(`Order status updated to "${newStatus}".`, "success");
        await onRefresh();
      } else {
        throw new Error(json.error || "Failed to update order status");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Order update failed";
      showToast(msg, "error");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Courier & Tracking Save Handler
  const handleSaveCourierFulfillment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourierOrder) return;

    setSavingCourier(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCourierOrder.id,
          courier_partner: courierPartnerInput,
          tracking_number: trackingNumberInput.trim() || undefined,
          notes: orderNotesInput.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast("Logistics partner and AWB tracking updated successfully.", "success");
        setEditingCourierOrder(null);
        await onRefresh();
      } else {
        throw new Error(json.error || "Failed to update courier details");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Courier update failed";
      showToast(msg, "error");
    } finally {
      setSavingCourier(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* 1. Top KPI Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
        }}
      >
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8DED3",
            borderRadius: "14px",
            padding: "18px 20px",
            boxShadow: "0 4px 16px rgba(38,27,19,0.03)",
          }}
        >
          <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#866951", fontWeight: 600 }}>
            Total Orders
          </span>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#261B13", marginTop: "4px" }}>
            {orders.length}
          </div>
          <span style={{ fontSize: "12px", color: "#28a745", fontWeight: 600 }}>
            {formatINR(totalRevenue)} Settled GMV
          </span>
        </div>

        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8DED3",
            borderRadius: "14px",
            padding: "18px 20px",
            boxShadow: "0 4px 16px rgba(38,27,19,0.03)",
          }}
        >
          <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#866951", fontWeight: 600 }}>
            Awaiting Dispatch
          </span>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#261B13", marginTop: "4px" }}>
            {awaitingDispatchCount}
          </div>
          <span style={{ fontSize: "11px", color: "#866951" }}>
            Confirmed / Atelier Tailoring
          </span>
        </div>

        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E8DED3",
            borderRadius: "14px",
            padding: "18px 20px",
            boxShadow: "0 4px 16px rgba(38,27,19,0.03)",
          }}
        >
          <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#866951", fontWeight: 600 }}>
            In Logistics Transit
          </span>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#0070f3", marginTop: "4px" }}>
            {inTransitCount}
          </div>
          <span style={{ fontSize: "11px", color: "#866951" }}>
            With Blue Dart / Insured Courier
          </span>
        </div>

        <div
          style={{
            backgroundColor: exchangeRequestsCount > 0 ? "rgba(217, 119, 6, 0.08)" : "#FFFFFF",
            border: exchangeRequestsCount > 0 ? "1px solid rgba(217, 119, 6, 0.35)" : "1px solid #E8DED3",
            borderRadius: "14px",
            padding: "18px 20px",
            boxShadow: "0 4px 16px rgba(38,27,19,0.03)",
          }}
        >
          <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#d97706", fontWeight: 600 }}>
            7-Day Exchanges
          </span>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#d97706", marginTop: "4px" }}>
            {exchangeRequestsCount}
          </div>
          <span style={{ fontSize: "11px", color: "#92400e" }}>
            Patron Re-tailoring Requests
          </span>
        </div>
      </div>

      {/* 2. Search & Status Filter Bar */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E8DED3",
          borderRadius: "12px",
          padding: "12px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "260px" }}>
          <SearchIcon size={16} color="#866951" />
          <input
            type="text"
            placeholder="Search orders by #, customer name, phone, AWB..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              fontSize: "13px",
              color: "#261B13",
              backgroundColor: "transparent",
              border: "none",
              outline: "none",
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              <CloseIcon size={14} color="#866951" />
            </button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #E8DED3",
              backgroundColor: "#FAF7F2",
              fontSize: "13px",
              color: "#261B13",
              fontWeight: 500,
            }}
          >
            <option value="ALL">All Order Statuses ({orders.length})</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Processing">Processing</option>
            <option value="Dispatched">Dispatched</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="Exchange Requested">Exchange Requested</option>
            <option value="Exchanged">Exchanged</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <button
            type="button"
            onClick={() => void onRefresh()}
            style={{
              background: "none",
              border: "1px solid #E8DED3",
              borderRadius: "8px",
              padding: "8px 12px",
              fontSize: "12px",
              color: "#866951",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <SpinnerIcon size={12} color="#866951" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 3. Orders Table Container */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E8DED3",
          borderRadius: "14px",
          boxShadow: "0 4px 20px rgba(38,27,19,0.04)",
          overflow: "hidden",
        }}
      >
        {filteredOrders.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "#866951" }}>
            <ShoppingBagIcon size={32} color="#866951" />
            <p style={{ marginTop: "12px", fontSize: "14px", fontWeight: 500 }}>
              No orders found matching your search criteria.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ backgroundColor: "#FAF7F2", borderBottom: "1px solid #E8DED3", color: "#866951" }}>
                  <th style={{ padding: "14px 18px", fontWeight: 700 }}>Order # & Date</th>
                  <th style={{ padding: "14px 18px", fontWeight: 700 }}>Customer Destination</th>
                  <th style={{ padding: "14px 18px", fontWeight: 700 }}>Items</th>
                  <th style={{ padding: "14px 18px", fontWeight: 700 }}>Amount & Payment</th>
                  <th style={{ padding: "14px 18px", fontWeight: 700 }}>Logistics & AWB</th>
                  <th style={{ padding: "14px 18px", fontWeight: 700 }}>Status Lifecycle</th>
                  <th style={{ padding: "14px 18px", fontWeight: 700, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((ord) => {
                  let badgeBg = "rgba(40, 167, 69, 0.12)";
                  let badgeColor = "#28a745";

                  if (ord.order_status === "Processing") {
                    badgeBg = "rgba(197, 160, 89, 0.15)";
                    badgeColor = "#A97C50";
                  } else if (ord.order_status === "Dispatched" || ord.order_status === "Out for Delivery") {
                    badgeBg = "rgba(0, 112, 243, 0.12)";
                    badgeColor = "#0070f3";
                  } else if (ord.order_status === "Delivered") {
                    badgeBg = "rgba(21, 87, 36, 0.15)";
                    badgeColor = "#155724";
                  } else if (ord.order_status === "Exchange Requested") {
                    badgeBg = "rgba(217, 119, 6, 0.18)";
                    badgeColor = "#d97706";
                  } else if (ord.order_status === "Exchanged") {
                    badgeBg = "rgba(75, 85, 99, 0.15)";
                    badgeColor = "#4b5563";
                  } else if (ord.order_status === "Cancelled") {
                    badgeBg = "rgba(220, 53, 69, 0.12)";
                    badgeColor = "#dc3545";
                  }

                  return (
                    <tr
                      key={ord.id}
                      style={{
                        borderBottom: "1px solid #EFE6DC",
                        backgroundColor: ord.order_status === "Exchange Requested" ? "rgba(217, 119, 6, 0.03)" : "transparent",
                      }}
                    >
                      {/* Order Number & Date */}
                      <td style={{ padding: "14px 18px", verticalAlign: "top" }}>
                        <span style={{ fontWeight: 700, color: "#261B13", display: "block" }}>
                          {ord.order_number}
                        </span>
                        <span style={{ fontSize: "11px", color: "#8E7D70" }}>
                          {new Date(ord.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </td>

                      {/* Customer & Destination */}
                      <td style={{ padding: "14px 18px", verticalAlign: "top" }}>
                        <span style={{ fontWeight: 600, color: "#261B13", display: "block" }}>
                          {ord.shipping_address_snapshot?.recipient_name || "Patron"}
                        </span>
                        <span style={{ fontSize: "12px", color: "#5A4535", display: "block" }}>
                          {ord.shipping_address_snapshot?.city}, {ord.shipping_address_snapshot?.state}
                        </span>
                        <span style={{ fontSize: "11px", color: "#866951" }}>
                          📞 {ord.shipping_address_snapshot?.phone_number}
                        </span>
                      </td>

                      {/* Items */}
                      <td style={{ padding: "14px 18px", verticalAlign: "top" }}>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          {(ord.order_items || []).slice(0, 3).map((item, idx) => (
                            <div
                              key={item.id || idx}
                              style={{
                                position: "relative",
                                width: "36px",
                                height: "45px",
                                borderRadius: "6px",
                                overflow: "hidden",
                                backgroundColor: "#FAF7F2",
                                border: "1px solid #E8DED3",
                                flexShrink: 0,
                              }}
                              title={`${item.product_name} (Qty: ${item.quantity})`}
                            >
                              <Image
                                src={resolveProductImage(item.image_url)}
                                alt={item.product_name}
                                fill
                                sizes="36px"
                                style={{ objectFit: "cover" }}
                              />
                            </div>
                          ))}
                          {(ord.order_items || []).length > 3 && (
                            <span style={{ fontSize: "11px", color: "#866951", fontWeight: 600 }}>
                              +{(ord.order_items || []).length - 3} more
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: "11px", color: "#8E7D70", display: "block", marginTop: "4px" }}>
                          {(ord.order_items || []).length} Piece{(ord.order_items || []).length === 1 ? "" : "s"}
                        </span>
                      </td>

                      {/* Amount & Payment */}
                      <td style={{ padding: "14px 18px", verticalAlign: "top" }}>
                        <span style={{ fontWeight: 700, color: "#261B13", display: "block" }}>
                          {formatINR(ord.total_amount)}
                        </span>
                        <span
                          style={{
                            fontSize: "10px",
                            padding: "2px 6px",
                            borderRadius: "6px",
                            backgroundColor: ord.payment_status === "Paid" ? "rgba(40, 167, 69, 0.12)" : "rgba(217, 119, 6, 0.12)",
                            color: ord.payment_status === "Paid" ? "#28a745" : "#b45309",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            display: "inline-block",
                            marginTop: "2px",
                          }}
                        >
                          {ord.payment_method === "COD" ? `COD (${ord.payment_status})` : "Online Paid"}
                        </span>
                      </td>

                      {/* Logistics & Courier */}
                      <td style={{ padding: "14px 18px", verticalAlign: "top" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#261B13", display: "block" }}>
                          {ord.courier_partner || "Blue Dart Express"}
                        </span>
                        {ord.tracking_number ? (
                          <span style={{ fontSize: "11px", color: "#0070f3", fontFamily: "monospace" }}>
                            AWB: {ord.tracking_number}
                          </span>
                        ) : (
                          <span style={{ fontSize: "11px", color: "#8E7D70" }}>No AWB assigned</span>
                        )}
                      </td>

                      {/* Status Selector */}
                      <td style={{ padding: "14px 18px", verticalAlign: "top" }}>
                        <select
                          value={ord.order_status}
                          disabled={updatingOrderId === ord.id}
                          onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as OrderStatus)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: "8px",
                            fontSize: "12px",
                            fontWeight: 600,
                            border: `1px solid ${badgeColor}`,
                            backgroundColor: badgeBg,
                            color: badgeColor,
                            cursor: "pointer",
                          }}
                        >
                          <option value="Confirmed">Confirmed</option>
                          <option value="Processing">Processing</option>
                          <option value="Dispatched">Dispatched</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Exchange Requested">Exchange Requested</option>
                          <option value="Exchanged">Exchanged</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "14px 18px", verticalAlign: "top", textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCourierOrder(ord);
                              setCourierPartnerInput(ord.courier_partner || "Blue Dart Luxury Express");
                              setTrackingNumberInput(ord.tracking_number || "");
                              setOrderNotesInput(ord.notes || "");
                            }}
                            title="Edit Courier Partner & AWB Tracking"
                            style={{
                              padding: "6px 10px",
                              borderRadius: "8px",
                              border: "1px solid #E8DED3",
                              backgroundColor: "#FAF7F2",
                              color: "#5A4535",
                              fontSize: "11px",
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <DeliveryVanIcon size={14} color="#866951" />
                            <span>Courier & AWB</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedOrderDetails(ord)}
                            title="View Full Order Details"
                            style={{
                              padding: "6px 10px",
                              borderRadius: "8px",
                              border: "1px solid #E8DED3",
                              backgroundColor: "#FFFFFF",
                              color: "#261B13",
                              fontSize: "11px",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. MODAL: Courier Partner & AWB Tracking */}
      {editingCourierOrder && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundColor: "rgba(38, 27, 19, 0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingCourierOrder(null);
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "16px",
              border: "1px solid #E8DED3",
              width: "100%",
              maxWidth: "500px",
              padding: "28px",
              boxShadow: "0 20px 40px rgba(38, 27, 19, 0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <DeliveryVanIcon size={20} color="#866951" />
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#261B13" }}>
                  Logistics & AWB Tracking
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingCourierOrder(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#8E7D70" }}
              >
                <CloseIcon size={20} />
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "#6E5B4E", margin: "0 0 20px" }}>
              Order <strong>{editingCourierOrder.order_number}</strong> · Destination:{" "}
              {editingCourierOrder.shipping_address_snapshot?.city},{" "}
              {editingCourierOrder.shipping_address_snapshot?.state}.
            </p>

            <form onSubmit={handleSaveCourierFulfillment} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#261B13", marginBottom: "6px" }}>
                  Designated Courier Partner
                </label>
                <select
                  value={courierPartnerInput}
                  onChange={(e) => setCourierPartnerInput(e.target.value)}
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
                  <option value="Blue Dart Luxury Express">Blue Dart Luxury Express</option>
                  <option value="Delhivery Express">Delhivery Express</option>
                  <option value="DTDC Priority Prime">DTDC Priority Prime</option>
                  <option value="Shadowfax Prime Courier">Shadowfax Prime Courier</option>
                  <option value="FedEx Insured Express">FedEx Insured Express</option>
                  <option value="Atelier White-Glove Hand Delivery">Atelier White-Glove Hand Delivery</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#261B13", marginBottom: "6px" }}>
                  Airway Bill (AWB) Tracking Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. BLUEDART-498210398"
                  value={trackingNumberInput}
                  onChange={(e) => setTrackingNumberInput(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #D6C7B7",
                    backgroundColor: "#FAF7F2",
                    fontSize: "13px",
                    color: "#261B13",
                    fontFamily: "monospace",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#261B13", marginBottom: "6px" }}>
                  Fulfillment Notes (Internal / Courier Notes)
                </label>
                <textarea
                  rows={2}
                  placeholder="Special instructions for the courier, packaging notes, etc."
                  value={orderNotesInput}
                  onChange={(e) => setOrderNotesInput(e.target.value)}
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

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setEditingCourierOrder(null)}
                  className="avsaraa-btn-outline"
                  style={{ flex: 1, height: "42px", fontSize: "13px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCourier}
                  className="avsaraa-btn-primary"
                  style={{
                    flex: 2,
                    height: "42px",
                    fontSize: "13px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  {savingCourier && <SpinnerIcon size={14} color="#FAF7F2" />}
                  <span>Save Courier Details</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: Full Order Details Drawer */}
      {selectedOrderDetails && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundColor: "rgba(38, 27, 19, 0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedOrderDetails(null);
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "18px",
              border: "1px solid #E8DED3",
              width: "100%",
              maxWidth: "640px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "28px",
              boxShadow: "0 24px 48px rgba(38, 27, 19, 0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", color: "#866951", textTransform: "uppercase" }}>
                  TRANSACTION AUDIT
                </span>
                <h3 style={{ margin: "2px 0 0", fontSize: "20px", fontWeight: 700, color: "#261B13" }}>
                  Order {selectedOrderDetails.order_number}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderDetails(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#8E7D70" }}
              >
                <CloseIcon size={20} />
              </button>
            </div>

            {/* Status & Payment Row */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                padding: "14px",
                backgroundColor: "#FAF7F2",
                borderRadius: "12px",
                marginBottom: "20px",
                border: "1px solid #EFE6DC",
              }}
            >
              <div>
                <span style={{ fontSize: "11px", color: "#8E7D70", textTransform: "uppercase", display: "block" }}>
                  Order Status
                </span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#261B13" }}>
                  {selectedOrderDetails.order_status}
                </span>
              </div>
              <div style={{ width: "1px", height: "28px", backgroundColor: "#E8DED3" }} />
              <div>
                <span style={{ fontSize: "11px", color: "#8E7D70", textTransform: "uppercase", display: "block" }}>
                  Payment Method
                </span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#261B13" }}>
                  {selectedOrderDetails.payment_method} ({selectedOrderDetails.payment_status})
                </span>
              </div>
              <div style={{ width: "1px", height: "28px", backgroundColor: "#E8DED3" }} />
              <div>
                <span style={{ fontSize: "11px", color: "#8E7D70", textTransform: "uppercase", display: "block" }}>
                  Total GMV
                </span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#28a745" }}>
                  {formatINR(selectedOrderDetails.total_amount)}
                </span>
              </div>
            </div>

            {/* Purchased Items List */}
            <h4 style={{ fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#866951", margin: "0 0 10px" }}>
              Purchased Pieces ({(selectedOrderDetails.order_items || []).length})
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              {(selectedOrderDetails.order_items || []).map((item, idx) => (
                <div
                  key={item.id || idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 12px",
                    backgroundColor: "#FAF7F2",
                    borderRadius: "10px",
                    border: "1px solid #EFE6DC",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "44px",
                      height: "55px",
                      borderRadius: "6px",
                      overflow: "hidden",
                      backgroundColor: "#FFFFFF",
                      flexShrink: 0,
                    }}
                  >
                    <Image
                      src={resolveProductImage(item.image_url)}
                      alt={item.product_name}
                      fill
                      sizes="44px"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#261B13" }}>
                      {item.product_name}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#8E7D70" }}>
                      Qty: {item.quantity} · {formatINR(item.unit_price)}
                    </p>
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#261B13" }}>
                    {formatINR(item.total_price || item.unit_price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Shipping Destination Snapshot */}
            <h4 style={{ fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#866951", margin: "0 0 10px" }}>
              Patron Delivery Destination
            </h4>
            <div style={{ padding: "14px", backgroundColor: "#FAF7F2", borderRadius: "10px", border: "1px solid #EFE6DC", fontSize: "13px", color: "#5A4535", marginBottom: "20px" }}>
              <p style={{ margin: 0, fontWeight: 700, color: "#261B13" }}>
                {selectedOrderDetails.shipping_address_snapshot?.recipient_name}
              </p>
              <p style={{ margin: "3px 0" }}>
                {selectedOrderDetails.shipping_address_snapshot?.address_line1}
                {selectedOrderDetails.shipping_address_snapshot?.address_line2 ? `, ${selectedOrderDetails.shipping_address_snapshot.address_line2}` : ""}
              </p>
              {selectedOrderDetails.shipping_address_snapshot?.landmark && (
                <p style={{ margin: "3px 0", color: "#866951" }}>
                  Landmark: {selectedOrderDetails.shipping_address_snapshot.landmark}
                </p>
              )}
              <p style={{ margin: "3px 0" }}>
                {selectedOrderDetails.shipping_address_snapshot?.city}, {selectedOrderDetails.shipping_address_snapshot?.state} —{" "}
                {selectedOrderDetails.shipping_address_snapshot?.postal_code}
              </p>
              <p style={{ margin: "4px 0 0", color: "#866951", fontWeight: 600 }}>
                📞 {selectedOrderDetails.shipping_address_snapshot?.phone_number}
              </p>
            </div>

            {/* Notes / Exchange Logs */}
            {selectedOrderDetails.notes && (
              <>
                <h4 style={{ fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#866951", margin: "0 0 10px" }}>
                  Order Notes & Exchange Log
                </h4>
                <div style={{ padding: "12px 14px", backgroundColor: "#FAF7F2", borderRadius: "10px", border: "1px solid #EFE6DC", fontSize: "12.5px", color: "#261B13", whiteSpace: "pre-wrap", marginBottom: "20px" }}>
                  {selectedOrderDetails.notes}
                </div>
              </>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setSelectedOrderDetails(null)}
                className="avsaraa-btn-primary"
                style={{ height: "40px", padding: "0 24px", fontSize: "12.5px" }}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

