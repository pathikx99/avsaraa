"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { ShoppingBagIcon } from "./Icons";

export default function CartDrawer() {
  const {
    isCartOpen,
    closeCart,
    cartItems,
    totalItems,
    subtotal,
    removeFromCart,
    updateQuantity,
    clearCart,
  } = useCart();

  if (!isCartOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 250,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={closeCart}
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(38, 27, 19, 0.5)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          transition: "opacity 0.25s ease",
        }}
      />

      {/* Drawer Panel */}
      <div
        style={{
          position: "relative",
          width: "420px",
          maxWidth: "90vw",
          height: "100%",
          backgroundColor: "#FAF7F2",
          borderLeft: "1px solid #E6DACF",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-10px 0 40px rgba(38, 27, 19, 0.25)",
          animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          zIndex: 1,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #EAE0D5",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#FFFFFF",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ShoppingBagIcon size={20} color="#261B13" />
            <h3
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "20px",
                fontWeight: 600,
                color: "#261B13",
                margin: 0,
              }}
            >
              Shopping Bag ({totalItems})
            </h3>
          </div>

          <button
            onClick={closeCart}
            aria-label="Close cart"
            style={{
              padding: "6px",
              color: "#8E7D70",
              cursor: "pointer",
              background: "none",
              border: "none",
              fontSize: "20px",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Free Shipping Indicator */}
        <div
          style={{
            backgroundColor: "#F0F7EE",
            borderBottom: "1px solid #E6DACF",
            padding: "10px 24px",
            fontSize: "12px",
            color: "#2E6930",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: 500,
          }}
        >
          <span>✨</span>
          <span>Complimentary Express Shipping & Free Delivery on All Orders across India</span>
        </div>

        {/* Cart Items List */}
        <div
          className="no-scrollbar"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {cartItems.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                height: "100%",
                padding: "40px 20px",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  backgroundColor: "#F2EBE3",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "26px",
                  marginBottom: "16px",
                }}
              >
                🛍️
              </div>
              <h4
                style={{
                  fontFamily: "var(--font-serif), Georgia, serif",
                  fontSize: "22px",
                  color: "#261B13",
                  marginBottom: "8px",
                  fontWeight: 500,
                }}
              >
                Your Bag is Empty
              </h4>
              <p
                style={{
                  fontSize: "13px",
                  color: "#6E5B4E",
                  lineHeight: 1.6,
                  maxWidth: "280px",
                  marginBottom: "24px",
                }}
              >
                Explore our handcrafted pure silk sarees and festive wear to add pieces to your collection.
              </p>
              <Link
                href="/products"
                onClick={closeCart}
                className="avsaraa-btn-primary"
                style={{
                  height: "42px",
                  padding: "0 24px",
                  fontSize: "12px",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                Explore Products →
              </Link>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.product.id}
                style={{
                  display: "flex",
                  gap: "14px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E8DED3",
                  borderRadius: "16px",
                  padding: "12px",
                  boxShadow: "0 4px 12px rgba(38,27,19,0.03)",
                }}
              >
                {/* Product Thumbnail */}
                <div
                  style={{
                    position: "relative",
                    width: "78px",
                    height: "94px",
                    borderRadius: "10px",
                    overflow: "hidden",
                    flexShrink: 0,
                    backgroundColor: "#F2EBE3",
                  }}
                >
                  <Image
                    src={item.product.image_url || "/images/banarasi_silk_saree.jpg"}
                    alt={item.product.name}
                    fill
                    sizes="80px"
                    style={{ objectFit: "cover" }}
                  />
                </div>

                {/* Details */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    flex: 1,
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: "10px",
                        color: "#866951",
                        fontWeight: 600,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      {item.product.category}
                    </span>
                    <h5
                      style={{
                        fontFamily: "var(--font-serif), Georgia, serif",
                        fontSize: "15px",
                        fontWeight: 600,
                        color: "#261B13",
                        marginTop: "2px",
                        marginBottom: "4px",
                        lineHeight: 1.3,
                      }}
                    >
                      {item.product.name}
                    </h5>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#261B13" }}>
                      ₹{item.product.price.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Quantity and Remove */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: "10px",
                    }}
                  >
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        border: "1px solid #CFBEAD",
                        borderRadius: "20px",
                        overflow: "hidden",
                        backgroundColor: "#FAF7F2",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        aria-label="Decrease quantity"
                        style={{
                          width: "28px",
                          height: "26px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "14px",
                          color: "#261B13",
                          cursor: "pointer",
                          background: "none",
                          border: "none",
                        }}
                      >
                        -
                      </button>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          padding: "0 8px",
                          color: "#261B13",
                        }}
                      >
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        aria-label="Increase quantity"
                        style={{
                          width: "28px",
                          height: "26px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "14px",
                          color: "#261B13",
                          cursor: "pointer",
                          background: "none",
                          border: "none",
                        }}
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                      style={{
                        fontSize: "11.5px",
                        color: "#A83E2D",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer / Summary */}
        {cartItems.length > 0 && (
          <div
            style={{
              padding: "20px 24px",
              borderTop: "1px solid #EAE0D5",
              backgroundColor: "#FFFFFF",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "13px",
                  color: "#6E5B4E",
                }}
              >
                <span>Subtotal ({totalItems} items)</span>
                <span style={{ fontWeight: 600, color: "#261B13" }}>
                  ₹{subtotal.toLocaleString("en-IN")}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "13px",
                  color: "#6E5B4E",
                }}
              >
                <span>Shipping across India</span>
                <span style={{ color: "#2E6930", fontWeight: 600 }}>
                  FREE
                </span>
              </div>
              <div
                style={{
                  borderTop: "1px solid #F0E8DF",
                  paddingTop: "10px",
                  marginTop: "4px",
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#261B13",
                }}
              >
                <span>Total</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <span style={{ fontSize: "10.5px", color: "#8E7D70" }}>
                * All applicable GST and handcrafted charges included
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <Link
                href="/contact"
                onClick={closeCart}
                className="avsaraa-btn-primary btn-shine"
                style={{
                  height: "48px",
                  fontSize: "13px",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  textDecoration: "none",
                  borderRadius: "24px",
                  backgroundColor: "#261B13",
                  color: "#FAF7F2",
                }}
              >
                <ShoppingBagIcon size={16} color="#FAF7F2" />
                <span>Proceed to Secure Checkout</span>
              </Link>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={closeCart}
                  style={{
                    fontSize: "12px",
                    color: "#866951",
                    textDecoration: "underline",
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                    padding: "4px 0",
                  }}
                >
                  ← Continue Shopping
                </button>
                <button
                  type="button"
                  onClick={clearCart}
                  style={{
                    fontSize: "12px",
                    color: "#8E7D70",
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                    padding: "4px 0",
                  }}
                >
                  Clear Bag
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
