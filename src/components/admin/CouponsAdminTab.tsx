"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Coupon } from "@/types/order";
import { formatINR } from "@/lib/productUtils";
import {
  TagIcon,
  SparkleStarIcon,
  CheckIcon,
  CloseIcon,
  SearchIcon,
  SpinnerIcon,
  TrashIcon,
} from "@/components/Icons";

interface CouponsAdminTabProps {
  showToast: (text: string, type: "success" | "error" | "info") => void;
  getAuthHeaders: () => Promise<Record<string, string>>;
}

export default function CouponsAdminTab({
  showToast,
  getAuthHeaders,
}: CouponsAdminTabProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newDiscountType, setNewDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [newDiscountValue, setNewDiscountValue] = useState("");
  const [newMinOrderAmount, setNewMinOrderAmount] = useState("");
  const [newMaxDiscountAmount, setNewMaxDiscountAmount] = useState("");
  const [newUsageLimit, setNewUsageLimit] = useState("");
  const [newValidUntil, setNewValidUntil] = useState("");

  // Toggle & Delete processing states
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/coupons", { headers });
      const data = await res.json();

      if (data.success && Array.isArray(data.coupons)) {
        setCoupons(data.coupons);
      } else {
        showToast(data.error || "Failed to load coupons.", "error");
      }
    } catch (err) {
      console.error("Error fetching coupons:", err);
      showToast("Network error while loading promo coupons.", "error");
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, showToast]);

  useEffect(() => {
    let active = true;

    async function loadInitial() {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch("/api/admin/coupons", { headers });
        const data = await res.json();
        if (!active) return;

        if (data.success && Array.isArray(data.coupons)) {
          setCoupons(data.coupons);
        } else {
          showToast(data.error || "Failed to load coupons.", "error");
        }
      } catch (err) {
        if (!active) return;
        console.error("Error fetching coupons:", err);
        showToast("Network error while loading promo coupons.", "error");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadInitial();

    return () => {
      active = false;
    };
  }, [getAuthHeaders, showToast]);

  // KPIs
  const activeCouponsCount = useMemo(
    () => coupons.filter((c) => c.is_active).length,
    [coupons]
  );
  const totalRedemptions = useMemo(
    () => coupons.reduce((acc, c) => acc + (c.used_count || 0), 0),
    [coupons]
  );
  const percentageCount = useMemo(
    () => coupons.filter((c) => c.discount_type === "percentage").length,
    [coupons]
  );

  // Filtered List
  const filteredCoupons = useMemo(() => {
    return coupons.filter((coupon) => {
      const matchesSearch =
        coupon.code.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const matchesActive =
        activeFilter === "ALL"
          ? true
          : activeFilter === "ACTIVE"
          ? coupon.is_active
          : !coupon.is_active;
      return matchesSearch && matchesActive;
    });
  }, [coupons, searchQuery, activeFilter]);

  // Create Coupon Submit Handler
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) {
      showToast("Please enter a promo code.", "error");
      return;
    }
    const val = Number(newDiscountValue);
    if (!val || val <= 0) {
      showToast("Please enter a valid discount value.", "error");
      return;
    }
    if (newDiscountType === "percentage" && val > 100) {
      showToast("Percentage discount cannot exceed 100%.", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      const headers = await getAuthHeaders();
      const payload = {
        code: newCode.trim().toUpperCase(),
        discount_type: newDiscountType,
        discount_value: val,
        min_order_amount: newMinOrderAmount ? Number(newMinOrderAmount) : 0,
        max_discount_amount: newMaxDiscountAmount ? Number(newMaxDiscountAmount) : null,
        usage_limit: newUsageLimit ? Number(newUsageLimit) : null,
        valid_until: newValidUntil ? new Date(newValidUntil).toISOString() : null,
      };

      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message || `Coupon ${payload.code} created!`, "success");
        setIsCreateModalOpen(false);
        // Reset inputs
        setNewCode("");
        setNewDiscountValue("");
        setNewMinOrderAmount("");
        setNewMaxDiscountAmount("");
        setNewUsageLimit("");
        setNewValidUntil("");
        fetchCoupons();
      } else {
        showToast(data.error || "Failed to create coupon.", "error");
      }
    } catch (err) {
      console.error("Create coupon error:", err);
      showToast("An error occurred while creating coupon.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Active Status
  const handleToggleStatus = async (coupon: Coupon) => {
    try {
      setActionInProgressId(coupon.id);
      const headers = await getAuthHeaders();
      const res = await fetch("/api/admin/coupons", {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: coupon.id,
          is_active: !coupon.is_active,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCoupons((prev) =>
          prev.map((c) =>
            c.id === coupon.id ? { ...c, is_active: !coupon.is_active } : c
          )
        );
        showToast(
          `Coupon ${coupon.code} is now ${!coupon.is_active ? "Active" : "Inactive"}.`,
          "success"
        );
      } else {
        showToast(data.error || "Failed to update status.", "error");
      }
    } catch (err) {
      console.error("Toggle coupon status error:", err);
      showToast("Failed to toggle coupon status.", "error");
    } finally {
      setActionInProgressId(null);
    }
  };

  // Delete Coupon Handler
  const handleDeleteCoupon = async (coupon: Coupon) => {
    if (
      !confirm(
        `Are you sure you want to delete promo coupon "${coupon.code}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setActionInProgressId(coupon.id);
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/coupons?id=${encodeURIComponent(coupon.id)}`, {
        method: "DELETE",
        headers,
      });

      const data = await res.json();
      if (data.success) {
        setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
        showToast(`Coupon ${coupon.code} deleted successfully.`, "success");
      } else {
        showToast(data.error || "Failed to delete coupon.", "error");
      }
    } catch (err) {
      console.error("Delete coupon error:", err);
      showToast("Failed to delete coupon.", "error");
    } finally {
      setActionInProgressId(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* 1. Header Bar with Create Action */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          backgroundColor: "#FFFFFF",
          padding: "20px 24px",
          borderRadius: 16,
          border: "1px solid #EFEBE4",
          boxShadow: "0 2px 10px rgba(38, 27, 19, 0.03)",
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "1.35rem",
              fontWeight: 600,
              color: "#261B13",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <TagIcon size={20} color="#E2BE72" />
            Dynamic Promotional Coupons & Offers
          </h2>
          <p
            style={{
              fontSize: "0.85rem",
              color: "#7D7571",
              margin: "4px 0 0",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            Configure cart percentage savings, fixed rupee discounts, and minimum cart thresholds for AVSARAA patrons.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            backgroundColor: "#261B13",
            color: "#FAF7F2",
            border: "1px solid #E2BE72",
            borderRadius: 10,
            padding: "10px 18px",
            fontSize: "0.85rem",
            fontWeight: 600,
            letterSpacing: "0.04em",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          <SparkleStarIcon size={14} color="#E2BE72" />
          Create Promo Code
        </button>
      </div>

      {/* 2. KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16,
        }}
      >
        <div
          style={{
            backgroundColor: "#FFFFFF",
            padding: "18px 20px",
            borderRadius: 12,
            border: "1px solid #EFEBE4",
          }}
        >
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#8E8782", fontWeight: 600 }}>
            Active Offers
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#2E7D32", marginTop: 4 }}>
            {activeCouponsCount}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#7D7571", marginTop: 2 }}>
            Currently redeemable at checkout
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#FFFFFF",
            padding: "18px 20px",
            borderRadius: 12,
            border: "1px solid #EFEBE4",
          }}
        >
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#8E8782", fontWeight: 600 }}>
            Lifetime Redemptions
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#261B13", marginTop: 4 }}>
            {totalRedemptions}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#7D7571", marginTop: 2 }}>
            Across all patron orders
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#FFFFFF",
            padding: "18px 20px",
            borderRadius: 12,
            border: "1px solid #EFEBE4",
          }}
        >
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#8E8782", fontWeight: 600 }}>
            Percentage Codes
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#B37A2C", marginTop: 4 }}>
            {percentageCount}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#7D7571", marginTop: 2 }}>
            Proportional value incentives
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#FFFFFF",
            padding: "18px 20px",
            borderRadius: 12,
            border: "1px solid #EFEBE4",
          }}
        >
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#8E8782", fontWeight: 600 }}>
            Total Configured
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#261B13", marginTop: 4 }}>
            {coupons.length}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#7D7571", marginTop: 2 }}>
            Promo campaign entries
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          backgroundColor: "#FFFFFF",
          padding: "14px 18px",
          borderRadius: 12,
          border: "1px solid #EFEBE4",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            backgroundColor: "#FAF9F5",
            padding: "8px 14px",
            borderRadius: 8,
            border: "1px solid #E8E3DA",
            minWidth: 260,
            flex: 1,
            maxWidth: 420,
          }}
        >
          <SearchIcon size={16} color="#8E8782" />
          <input
            type="text"
            placeholder="Search promo code (e.g. AVSARAA10)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: "0.85rem",
              color: "#261B13",
              width: "100%",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              <CloseIcon size={14} color="#8E8782" />
            </button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {(["ALL", "ACTIVE", "INACTIVE"] as const).map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  border: isActive ? "1px solid #261B13" : "1px solid #E8E3DA",
                  backgroundColor: isActive ? "#261B13" : "#FFFFFF",
                  color: isActive ? "#FAF7F2" : "#554D48",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {filter === "ALL" ? "All" : filter === "ACTIVE" ? "Active" : "Inactive"}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Coupons Table */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 14,
          border: "1px solid #EFEBE4",
          overflow: "hidden",
          boxShadow: "0 2px 12px rgba(38, 27, 19, 0.03)",
        }}
      >
        {loading ? (
          <div
            style={{
              padding: "60px 20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              color: "#7D7571",
            }}
          >
            <SpinnerIcon size={28} color="#C5A880" />
            <span style={{ fontSize: "0.85rem" }}>Loading promotion codes...</span>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div
            style={{
              padding: "60px 20px",
              textAlign: "center",
              color: "#7D7571",
            }}
          >
            <TagIcon size={36} color="#D5CBBB" style={{ margin: "0 auto 12px" }} />
            <h4 style={{ margin: 0, fontSize: "1rem", color: "#261B13", fontWeight: 600 }}>
              No coupons found
            </h4>
            <p style={{ margin: "6px 0 0", fontSize: "0.85rem" }}>
              {searchQuery
                ? `No promo codes match "${searchQuery}".`
                : "Create your first promotional discount offer above."}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: "0.85rem",
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: "#FAF9F5",
                    borderBottom: "1px solid #EFEBE4",
                    color: "#8E8782",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                  }}
                >
                  <th style={{ padding: "14px 20px" }}>Promo Code</th>
                  <th style={{ padding: "14px 16px" }}>Discount Benefit</th>
                  <th style={{ padding: "14px 16px" }}>Thresholds</th>
                  <th style={{ padding: "14px 16px" }}>Redemptions</th>
                  <th style={{ padding: "14px 16px" }}>Validity</th>
                  <th style={{ padding: "14px 16px" }}>Status</th>
                  <th style={{ padding: "14px 20px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoupons.map((coupon) => {
                  const isBusy = actionInProgressId === coupon.id;
                  const isExpired =
                    coupon.valid_until && new Date(coupon.valid_until) < new Date();

                  return (
                    <tr
                      key={coupon.id}
                      style={{
                        borderBottom: "1px solid #F5F1EB",
                        transition: "background-color 0.15s ease",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#FDFAF6")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      {/* Code */}
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontWeight: 700,
                              fontSize: "0.95rem",
                              letterSpacing: "0.08em",
                              backgroundColor: "#FAF7F2",
                              color: "#261B13",
                              padding: "4px 10px",
                              borderRadius: 6,
                              border: "1px dashed #C5A880",
                            }}
                          >
                            {coupon.code}
                          </span>
                        </div>
                      </td>

                      {/* Benefit */}
                      <td style={{ padding: "16px 16px" }}>
                        <div style={{ fontWeight: 600, color: "#261B13" }}>
                          {coupon.discount_type === "percentage"
                            ? `${coupon.discount_value}% OFF`
                            : `${formatINR(coupon.discount_value)} FLAT OFF`}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#8E8782" }}>
                          {coupon.discount_type === "percentage"
                            ? "Percentage discount"
                            : "Direct flat deduction"}
                        </div>
                      </td>

                      {/* Thresholds */}
                      <td style={{ padding: "16px 16px" }}>
                        <div style={{ color: "#3B332E" }}>
                          Min Cart: {coupon.min_order_amount > 0 ? formatINR(coupon.min_order_amount) : "None"}
                        </div>
                        {coupon.max_discount_amount && (
                          <div style={{ fontSize: "0.75rem", color: "#8E8782" }}>
                            Max Cap: {formatINR(coupon.max_discount_amount)}
                          </div>
                        )}
                      </td>

                      {/* Redemptions */}
                      <td style={{ padding: "16px 16px" }}>
                        <span style={{ fontWeight: 600, color: "#261B13" }}>
                          {coupon.used_count || 0}
                        </span>
                        {coupon.usage_limit ? (
                          <span style={{ color: "#8E8782", fontSize: "0.75rem" }}>
                            {" "}
                            / {coupon.usage_limit} limit
                          </span>
                        ) : (
                          <span style={{ color: "#8E8782", fontSize: "0.75rem" }}>
                            {" "}
                            (unlimited)
                          </span>
                        )}
                      </td>

                      {/* Validity */}
                      <td style={{ padding: "16px 16px" }}>
                        {coupon.valid_until ? (
                          <div
                            style={{
                              color: isExpired ? "#C62828" : "#554D48",
                              fontWeight: isExpired ? 600 : 400,
                            }}
                          >
                            {isExpired
                              ? "Expired"
                              : `Ends ${new Date(coupon.valid_until).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}`}
                          </div>
                        ) : (
                          <span style={{ color: "#2E7D32", fontSize: "0.8rem", fontWeight: 500 }}>
                            Never expires
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: "16px 16px" }}>
                        <button
                          onClick={() => handleToggleStatus(coupon)}
                          disabled={isBusy}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "4px 10px",
                            borderRadius: 14,
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            border: "none",
                            backgroundColor: coupon.is_active ? "#E8F5E9" : "#F5F5F5",
                            color: coupon.is_active ? "#2E7D32" : "#757575",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              backgroundColor: coupon.is_active ? "#2E7D32" : "#9E9E9E",
                            }}
                          />
                          {coupon.is_active ? "Active" : "Disabled"}
                        </button>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "16px 20px", textAlign: "right" }}>
                        <button
                          onClick={() => handleDeleteCoupon(coupon)}
                          disabled={isBusy}
                          title="Delete coupon"
                          style={{
                            background: "none",
                            border: "none",
                            cursor: isBusy ? "not-allowed" : "pointer",
                            padding: 6,
                            borderRadius: 6,
                            color: "#C62828",
                            opacity: isBusy ? 0.4 : 0.8,
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                          onMouseLeave={(e) => (e.currentTarget.style.opacity = isBusy ? "0.4" : "0.8")}
                        >
                          <TrashIcon size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Create Coupon Modal */}
      {isCreateModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(3px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCreateModalOpen(false);
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              maxWidth: 520,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 40px rgba(38, 27, 19, 0.2)",
              border: "1px solid #EFEBE4",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px",
                borderBottom: "1px solid #EFEBE4",
              }}
            >
              <div>
                <h3
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: "1.2rem",
                    fontWeight: 600,
                    margin: 0,
                    color: "#261B13",
                  }}
                >
                  Create New Promotion Code
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "#8E8782" }}>
                  Publish an immediate luxury incentive for your cart shoppers.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#8E8782",
                }}
              >
                <CloseIcon size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateCoupon} style={{ padding: "24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {/* Promo Code */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      color: "#3B332E",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: 6,
                    }}
                  >
                    Promo Code (e.g. DIWALI20) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FESTIVE15"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid #E0D9D0",
                      fontSize: "0.95rem",
                      fontFamily: "monospace",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      outline: "none",
                    }}
                  />
                </div>

                {/* Discount Type & Value */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        color: "#3B332E",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: 6,
                      }}
                    >
                      Discount Type
                    </label>
                    <select
                      value={newDiscountType}
                      onChange={(e) =>
                        setNewDiscountType(e.target.value as "percentage" | "fixed")
                      }
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid #E0D9D0",
                        fontSize: "0.85rem",
                        outline: "none",
                        backgroundColor: "#FFFFFF",
                      }}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Rupee (₹)</option>
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        color: "#3B332E",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: 6,
                      }}
                    >
                      {newDiscountType === "percentage" ? "Percentage Off (%) *" : "Flat Off (₹) *"}
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={newDiscountType === "percentage" ? 100 : undefined}
                      placeholder={newDiscountType === "percentage" ? "10" : "500"}
                      value={newDiscountValue}
                      onChange={(e) => setNewDiscountValue(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid #E0D9D0",
                        fontSize: "0.85rem",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                {/* Min Order & Max Discount */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        color: "#3B332E",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: 6,
                      }}
                    >
                      Min Cart Subtotal (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder="e.g. 1999 (0 for any)"
                      value={newMinOrderAmount}
                      onChange={(e) => setNewMinOrderAmount(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid #E0D9D0",
                        fontSize: "0.85rem",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        color: "#3B332E",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: 6,
                      }}
                    >
                      Max Discount Cap (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder="e.g. 1500 (optional)"
                      value={newMaxDiscountAmount}
                      onChange={(e) => setNewMaxDiscountAmount(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid #E0D9D0",
                        fontSize: "0.85rem",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                {/* Usage Limit & Expiry Date */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        color: "#3B332E",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: 6,
                      }}
                    >
                      Max Redemptions
                    </label>
                    <input
                      type="number"
                      min={1}
                      placeholder="e.g. 500 (optional)"
                      value={newUsageLimit}
                      onChange={(e) => setNewUsageLimit(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid #E0D9D0",
                        fontSize: "0.85rem",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        color: "#3B332E",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: 6,
                      }}
                    >
                      Valid Until (Optional)
                    </label>
                    <input
                      type="date"
                      value={newValidUntil}
                      onChange={(e) => setNewValidUntil(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid #E0D9D0",
                        fontSize: "0.85rem",
                        outline: "none",
                        backgroundColor: "#FFFFFF",
                      }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 12,
                    marginTop: 10,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    style={{
                      padding: "10px 18px",
                      borderRadius: 8,
                      border: "1px solid #E0D9D0",
                      backgroundColor: "#FFFFFF",
                      color: "#554D48",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 22px",
                      borderRadius: 8,
                      border: "none",
                      backgroundColor: "#261B13",
                      color: "#FAF7F2",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      opacity: isSubmitting ? 0.7 : 1,
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <SpinnerIcon size={14} color="#FAF7F2" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <CheckIcon size={14} color="#E2BE72" />
                        Publish Coupon
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

