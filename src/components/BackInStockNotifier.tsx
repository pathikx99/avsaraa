"use client";

import { useState } from "react";
import { CloseIcon, SparkleStarIcon } from "@/components/Icons";

interface BackInStockNotifierProps {
  productId: string;
  productName: string;
  stockCount?: number;
  selectedSize?: string;
  selectedColor?: string;
}

export default function BackInStockNotifier({
  productId,
  productName,
  stockCount,
  selectedSize,
  selectedColor,
}: BackInStockNotifierProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const isOutOfStock = Boolean(stockCount === 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setMessage("Please enter a valid email address.");
      setStatus("error");
      return;
    }
    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch("/api/back-in-stock/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          email: email.trim(),
          phoneNumber: phone.trim() || undefined,
          variantName: selectedColor,
          size: selectedSize,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus("success");
        setMessage(data.message || "Subscribed! We'll notify you when it's back in stock.");
        setEmail("");
        setPhone("");
      } else {
        setStatus("error");
        setMessage(data.message || "Failed to subscribe. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  if (!isOutOfStock) return null;

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Get notified when back in stock"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          height: "52px",
          borderRadius: "8px",
          backgroundColor: "#F3ECE1",
          border: "1.5px dashed #C5A059",
          color: "#866951",
          fontSize: "12.5px",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          cursor: "pointer",
          width: "100%",
          marginTop: "10px",
          transition: "all 0.2s ease",
        }}
      >
        <SparkleStarIcon size={16} color="#866951" />
        <span>Notify Me When Back in Stock</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(38, 27, 19, 0.55)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            padding: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "20px",
              maxWidth: "480px",
              width: "100%",
              maxHeight: "85vh",
              overflowY: "auto",
              padding: "32px 28px",
              boxShadow: "0 20px 40px rgba(38, 27, 19, 0.25)",
              border: "1px solid #E8DED3",
            }}
          >
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#8E7D70",
                padding: 0,
              }}
            >
              <CloseIcon size={20} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <SparkleStarIcon size={20} color="#866951" />
              <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#866951" }}>
                Restock Alert
              </span>
            </div>
            <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "22px", color: "#261B13", margin: "0 0 6px" }}>
              Back in Stock Notification
            </h3>
            <p style={{ fontSize: "13px", color: "#6E5B4E", lineHeight: 1.5, marginBottom: "20px" }}>
              We&rsquo;ll let you know as soon as <strong>{productName}</strong> is available again in your selected size &amp; shade.
            </p>

            {status === "success" && (
              <div
                style={{
                  backgroundColor: "rgba(30, 94, 58, 0.08)",
                  border: "1px solid rgba(30, 94, 58, 0.25)",
                  color: "#1E5E3A",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>✓</span>
                <span>{message}</span>
              </div>
            )}

            {status === "error" && (
              <div
                style={{
                  backgroundColor: "rgba(184, 80, 66, 0.08)",
                  border: "1px solid rgba(184, 80, 66, 0.25)",
                  color: "#8A181A",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  fontSize: "13px",
                }}
              >
                {message}
              </div>
            )}

            {status !== "success" && (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#261B13", marginBottom: "6px" }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #D6C7B7",
                      backgroundColor: "#FAF7F2",
                      fontSize: "13px",
                    }}
                  />
                </div>
                <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#261B13", marginBottom: "6px" }}>
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="9876543210"
                  maxLength={10}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #D6C7B7",
                    backgroundColor: "#FAF7F2",
                    fontSize: "13px",
                  }}
                />
                <p style={{ fontSize: "11px", color: "#8E7D70", marginTop: "4px", lineHeight: 1.4 }}>
                  We will notify you via email (and SMS if provided) the moment it is back in stock.
                </p>
                </div>
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="avsaraa-btn-primary"
                  style={{
                    height: "44px",
                    fontSize: "13px",
                    opacity: status === "sending" ? 0.7 : 1,
                    cursor: status === "sending" ? "not-allowed" : "pointer",
                  }}
                >
                  {status === "sending" ? "Subscribing..." : "Notify Me"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
