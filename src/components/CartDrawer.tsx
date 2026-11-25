"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { getCartItemKey } from "@/lib/cartUtils";
import { ShoppingBagIcon } from "./Icons";
import { resolveProductImage } from "@/lib/productUtils";

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
  const [giftOptOut, setGiftOptOut] = useState(false);

  const GIFT_THRESHOLD = 2500;
  const giftProgress = Math.min(100, (subtotal / GIFT_THRESHOLD) * 100);
  const amountRemainingForGift = Math.max(0, GIFT_THRESHOLD - subtotal);
  const isGiftUnlocked = subtotal >= GIFT_THRESHOLD;
  const giftNote = isGiftUnlocked && !giftOptOut;

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
        className="cart-drawer-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "440px",
          maxWidth: "100vw",
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

        {/* Free Gift / Free Shipping Tiered Progress Bar */}
        <div
          className="cart-gift-shipping-bar"
          style={{
            backgroundColor: isGiftUnlocked ? "#FDFBF7" : "#FAF6F0",
            borderBottom: "1px solid #E6DACF",
            padding: "14px 20px",
            transition: "all 0.3s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "12px", color: isGiftUnlocked ? "#866951" : "#5A4535", fontWeight: 600 }}>
              {subtotal === 0 ? (
                <>✨ Free Insured Delivery on Orders Above ₹500</>
              ) : isGiftUnlocked ? (
                <>🎉 <strong>Keepsake Gift Box Unlocked!</strong> Handcrafted wrap included.</>
              ) : (
                <>
                  Add <strong style={{ color: "#261B13" }}>₹{amountRemainingForGift.toLocaleString("en-IN")}</strong> more for <strong>Complimentary Keepsake Gift Box</strong> 🎁
                </>
              )}
            </span>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#866951" }}>
              {Math.round(giftProgress)}%
            </span>
          </div>

          {/* Progress Bar Track */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "7px",
              backgroundColor: "#EAE0D5",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${subtotal === 0 ? 0 : Math.max(8, giftProgress)}%`,
                background: isGiftUnlocked
                  ? "linear-gradient(90deg, #C5A059 0%, #D4AF37 50%, #2E7D32 100%)"
                  : "linear-gradient(90deg, #C5A059 0%, #D4AF37 100%)",
                borderRadius: "4px",
                transition: "width 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
          </div>

          {/* Milestone Badges */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "10px", color: "#866951" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "3px", fontWeight: 600, color: subtotal >= 500 ? "#2E7D32" : "#866951" }}>
              {subtotal >= 500 ? "✓ " : ""}Free Shipping (₹500+)
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "3px", fontWeight: isGiftUnlocked ? 700 : 500, color: isGiftUnlocked ? "#2E7D32" : "#866951" }}>
              {isGiftUnlocked ? "✓ " : "🎁 "} Keepsake Box (₹2,500)
            </span>
          </div>
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
            cartItems.map((item, idx) => {
              const itemKey = `${item.product.id}__${item.product.name}__${idx}`;
              const itemCanonicalKey = getCartItemKey(item.product);
              const maxStock =
                item.product.stock_count && item.product.stock_count > 0 ? item.product.stock_count : 20;
              const isAtMax = item.quantity >= maxStock;

              return (
              <div
                key={itemKey}
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
                <Link
                  href={`/products/${item.product.id}`}
                  onClick={closeCart}
                  style={{
                    position: "relative",
                    width: "78px",
                    height: "94px",
                    borderRadius: "10px",
                    overflow: "hidden",
                    flexShrink: 0,
                    backgroundColor: "#F2EBE3",
                    display: "block",
                    cursor: "pointer",
                  }}
                >
                  <Image
                    src={resolveProductImage(item.product.image_url) || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=300&q=80"}
                    alt={item.product.name}
                    fill
                    sizes="80px"
                    style={{ objectFit: "cover" }}
                  />
                </Link>

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
                    <Link
                      href={`/products/${item.product.id}`}
                      onClick={closeCart}
                      style={{ textDecoration: "none" }}
                    >
                      <h5
                        style={{
                          fontFamily: "var(--font-serif), Georgia, serif",
                          fontSize: "15px",
                          fontWeight: 600,
                          color: "#261B13",
                          marginTop: "2px",
                          marginBottom: "4px",
                          lineHeight: 1.3,
                          cursor: "pointer",
                        }}
                      >
                        {item.product.name}
                      </h5>
                    </Link>
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
                        border: "1.5px solid #CFBEAD",
                        borderRadius: "20px",
                        overflow: "hidden",
                        backgroundColor: "#FAF7F2",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => updateQuantity(itemCanonicalKey, item.quantity - 1, idx)}
                        aria-label="Decrease quantity"
                        style={{
                          width: "32px",
                          height: "30px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "16px",
                          fontWeight: 700,
                          color: "#261B13",
                          cursor: "pointer",
                          background: "none",
                          border: "none",
                          transition: "background-color 0.15s ease",
                        }}
                      >
                        -
                      </button>
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          padding: "0 10px",
                          color: "#261B13",
                          minWidth: "22px",
                          textAlign: "center",
                        }}
                      >
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(itemCanonicalKey, item.quantity + 1, idx)}
                        disabled={isAtMax}
                        aria-label="Increase quantity"
                        style={{
                          width: "32px",
                          height: "30px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "16px",
                          fontWeight: 700,
                          color: isAtMax ? "#B8A99A" : "#261B13",
                          cursor: isAtMax ? "not-allowed" : "pointer",
                          background: "none",
                          border: "none",
                          transition: "background-color 0.15s ease",
                        }}
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(itemCanonicalKey, idx)}
                      style={{
                        fontSize: "12px",
                        color: "#A83E2D",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        textDecoration: "underline",
                        fontWeight: 500,
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
            })
          )}
        </div>

        {/* Footer / Summary */}
        {cartItems.length > 0 && (
          <div
            className="cart-drawer-footer"
            style={{
              padding: "18px 22px calc(18px + env(safe-area-inset-bottom, 12px)) 22px",
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
                <span>Gujarat Insured Delivery</span>
                <span style={{ color: subtotal >= 500 || subtotal === 0 ? "#2E6930" : "#866951", fontWeight: 600 }}>
                  {subtotal >= 500 || subtotal === 0 ? "FREE" : "₹50 (Free ₹500+)"}
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

            {/* Complimentary Handwritten Gift Note & Keepsake Box */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 12px",
                backgroundColor: "#FAF7F2",
                border: "1px dashed #D6C7B8",
                borderRadius: "12px",
                fontSize: "12px",
                color: "#6E5B4E",
              }}
            >
              <input
                type="checkbox"
                id="keepsake-gift-box"
                checked={giftNote}
                onChange={(e) => setGiftOptOut(!e.target.checked)}
                style={{ accentColor: "#866951", width: "16px", height: "16px", cursor: "pointer" }}
              />
              <label htmlFor="keepsake-gift-box" style={{ cursor: "pointer", flex: 1, userSelect: "none" }}>
                <span style={{ fontWeight: 600, color: "#261B13", display: "block", fontSize: "12px" }}>
                  🎁 Complimentary Keepsake Box & Note
                </span>
                <span style={{ fontSize: "10.5px", color: "#8E7D70" }}>
                  Handwritten on gold foil vellum paper with satin ribbon wrap
                </span>
              </label>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <Link
                href="/checkout"
                onClick={(e) => {
                  e.stopPropagation();
                  closeCart();
                }}
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
