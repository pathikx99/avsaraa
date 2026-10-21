"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";

export default function AuthRequiredModal() {
  const { isAuthModalOpen, closeAuthModal, pendingProduct } = useCart();

  if (!isAuthModalOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(38, 27, 19, 0.65)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
      }}
      onClick={closeAuthModal}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#FAF7F2",
          border: "1px solid #E6DACF",
          borderRadius: "24px",
          padding: "36px 30px",
          maxWidth: "480px",
          width: "100%",
          boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
          textAlign: "center",
          position: "relative",
          animation: "scaleUp 0.25s ease",
        }}
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          aria-label="Close dialog"
          style={{
            position: "absolute",
            top: "16px",
            right: "18px",
            fontSize: "22px",
            color: "#8E7D70",
            cursor: "pointer",
            background: "none",
            border: "none",
            padding: "4px",
          }}
        >
          ✕
        </button>

        {/* Icon & Badge */}
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            backgroundColor: "#F2EBE3",
            border: "1px solid #DFD0C2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px auto",
            fontSize: "24px",
            color: "#866951",
            boxShadow: "0 6px 18px rgba(134,105,81,0.12)",
          }}
        >
          🛍️
        </div>

        <span
          className="luxury-badge"
          style={{ marginBottom: "10px", display: "inline-block" }}
        >
          ✦ MEMBER SIGN IN REQUIRED ✦
        </span>

        <h3
          style={{
            fontFamily: "var(--font-serif), Georgia, serif",
            fontSize: "26px",
            fontWeight: 600,
            color: "#261B13",
            marginBottom: "8px",
            lineHeight: 1.25,
          }}
        >
          Sign In to Add to Bag
        </h3>

        <p
          style={{
            fontSize: "13.5px",
            color: "#6E5B4E",
            lineHeight: 1.65,
            marginBottom: "20px",
            maxWidth: "400px",
            margin: "0 auto 20px auto",
          }}
        >
          You are welcome to browse and view all our handcrafted sarees and luxury ensembles freely. To add items to your shopping bag and place an order, please sign in.
        </p>

        {/* Selected Product Preview */}
        {pendingProduct && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E8DED3",
              borderRadius: "14px",
              padding: "10px 14px",
              marginBottom: "22px",
              textAlign: "left",
            }}
          >
            <div
              style={{
                position: "relative",
                width: "52px",
                height: "52px",
                borderRadius: "10px",
                overflow: "hidden",
                flexShrink: 0,
                backgroundColor: "#F2EBE3",
              }}
            >
              <Image
                src={pendingProduct.image_url || "/images/banarasi_silk_saree.jpg"}
                alt={pendingProduct.name}
                fill
                sizes="52px"
                style={{ objectFit: "cover" }}
              />
            </div>
            <div style={{ overflow: "hidden", flex: 1 }}>
              <span
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#261B13",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                }}
              >
                {pendingProduct.name}
              </span>
              <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#866951" }}>
                ₹{pendingProduct.price.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <Link
            href="/login"
            onClick={closeAuthModal}
            className="avsaraa-btn-primary"
            style={{
              height: "48px",
              fontSize: "13px",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
            }}
          >
            <span>Sign In to Your Account</span>
            <span>→</span>
          </Link>

          <Link
            href="/register"
            onClick={closeAuthModal}
            className="avsaraa-btn-outline"
            style={{
              height: "46px",
              fontSize: "12.5px",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
              backgroundColor: "#FFFFFF",
            }}
          >
            Create New Account
          </Link>

          <button
            type="button"
            onClick={closeAuthModal}
            style={{
              marginTop: "8px",
              fontSize: "12px",
              color: "#8E7D70",
              cursor: "pointer",
              background: "none",
              border: "none",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
            }}
          >
            Continue Browsing Collection
          </button>
        </div>
      </div>
    </div>
  );
}
