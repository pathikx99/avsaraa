"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { getCartItemKey, parseCartItemDisplay } from "@/lib/cartUtils";
import { ShoppingBagIcon, GiftIcon, CloseIcon, SparkleStarIcon } from "./Icons";
import { resolveProductImage } from "@/lib/productUtils";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";

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
  const [confirmingClear, setConfirmingClear] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useAccessibleDialog(isCartOpen, closeCart, panelRef);

  const GIFT_THRESHOLD = 2500;
  const giftProgress = Math.min(100, (subtotal / GIFT_THRESHOLD) * 100);
  const amountRemainingForGift = Math.max(0, GIFT_THRESHOLD - subtotal);
  const isGiftUnlocked = subtotal >= GIFT_THRESHOLD;
  const giftNote = isGiftUnlocked && !giftOptOut;

  if (!isCartOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Shopping Bag (${totalItems} items)`}
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
        aria-hidden="true"
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
        ref={panelRef}
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
            padding: "18px 22px",
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
            type="button"
            onClick={closeCart}
            aria-label="Close shopping bag"
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              backgroundColor: "#F2EBE3",
              border: "1px solid #E2D7CC",
              color: "#261B13",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CloseIcon size={16} color="#261B13" />
          </button>
        </div>

        {/* Free Gift / Free Shipping Tiered Progress Bar */}
        <div
          className="cart-gift-shipping-bar"
          style={{
            backgroundColor: isGiftUnlocked ? "#F4F8F5" : "#FAF6F0",
            borderBottom: "1px solid #E6DACF",
            padding: "13px 20px",
            transition: "all 0.3s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", gap: "8px" }}>
            <span style={{ fontSize: "12px", color: isGiftUnlocked ? "#1E5E3A" : "#5A4535", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
              {subtotal === 0 ? (
                <>
                  <SparkleStarIcon size={14} color="#866951" />
                  <span>Free Insured Delivery on Orders Above ₹799</span>
                </>
              ) : isGiftUnlocked ? (
                <>
                  <GiftIcon size={15} color="#1E5E3A" />
                  <span><strong>Silk Gift Wrap Unlocked!</strong> Wrap included.</span>
                </>
              ) : (
                <>
                  <GiftIcon size={15} color="#866951" />
                  <span>
                    Add <strong style={{ color: "#261B13" }}>₹{amountRemainingForGift.toLocaleString("en-IN")}</strong> more for <strong>Silk Gift Wrap</strong>
                  </span>
                </>
              )}
            </span>
            <span style={{ fontSize: "11px", fontWeight: 700, color: isGiftUnlocked ? "#1E5E3A" : "#866951", flexShrink: 0 }}>
              {Math.round(giftProgress)}%
            </span>
          </div>

          <div
            role="progressbar"
            aria-valuenow={Math.round(giftProgress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Complimentary Silk Gift Wrap unlock progress"
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
                  ? "linear-gradient(90deg, #C5A059 0%, #1E5E3A 100%)"
                  : "linear-gradient(90deg, #C5A059 0%, #D4AF37 100%)",
                borderRadius: "4px",
                transition: "width 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "10.5px", color: "#6A584B" }}>
            <span style={{ fontWeight: 600, color: subtotal >= 799 ? "#1E5E3A" : "#6A584B" }}>
              {subtotal >= 799 ? "✓ " : ""}Free Shipping (₹799+)
            </span>
            <span style={{ fontWeight: isGiftUnlocked ? 700 : 500, color: isGiftUnlocked ? "#1E5E3A" : "#6A584B" }}>
              {isGiftUnlocked ? "✓ " : ""}Gift Wrap (₹2,500)
            </span>
          </div>
        </div>

        {/* Cart Items List */}
        <div
          className="no-scrollbar"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "18px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
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
                  border: "1px solid #DFD0C2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                }}
              >
                <ShoppingBagIcon size={26} color="#866951" />
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
                  color: "#6A584B",
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
                  height: "44px",
                  padding: "0 24px",
                  fontSize: "12px",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  width: "auto",
                  borderRadius: "22px",
                }}
              >
                Explore Products →
              </Link>
            </div>
          ) : (
            cartItems.map((item, idx) => {
              const itemKey = `${item.product.id}__${item.product.name}__${idx}`;
              const itemCanonicalKey = getCartItemKey(item.product);
              const parsed = parseCartItemDisplay(item.product);
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
                  <Link
                    href={`/products/${item.product.id}`}
                    onClick={closeCart}
                    style={{
                      position: "relative",
                      width: "78px",
                      height: "98px",
                      borderRadius: "10px",
                      overflow: "hidden",
                      flexShrink: 0,
                      backgroundColor: "#F2EBE3",
                      display: "block",
                    }}
                  >
                    <Image
                      src={resolveProductImage(item.product.image_url) || "/images/saree_model_hero.jpg"}
                      alt={parsed.title}
                      fill
                      sizes="80px"
                      style={{ objectFit: "cover", objectPosition: "center 20%" }}
                    />
                  </Link>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      flex: 1,
                      minWidth: 0,
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
                            marginBottom: "6px",
                            lineHeight: 1.3,
                          }}
                        >
                          {parsed.title}
                        </h5>
                      </Link>

                      {/* Variant Size & Color Chips */}
                      {(parsed.size || parsed.color || parsed.isPreOrder) && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "6px" }}>
                          {parsed.isPreOrder && (
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                padding: "2px 7px",
                                borderRadius: "6px",
                                backgroundColor: "#F9ECE8",
                                color: "#8A181A",
                                border: "1px solid rgba(138,24,26,0.2)",
                              }}
                            >
                              Pre-Order
                            </span>
                          )}
                          {parsed.size && (
                            <span
                              style={{
                                fontSize: "10.5px",
                                fontWeight: 600,
                                padding: "2px 7px",
                                borderRadius: "6px",
                                backgroundColor: "#FAF7F2",
                                color: "#543E2E",
                                border: "1px solid #E2D7CC",
                              }}
                            >
                              Size: {parsed.size}
                            </span>
                          )}
                          {parsed.color && (
                            <span
                              style={{
                                fontSize: "10.5px",
                                fontWeight: 600,
                                padding: "2px 7px",
                                borderRadius: "6px",
                                backgroundColor: "#FAF7F2",
                                color: "#543E2E",
                                border: "1px solid #E2D7CC",
                              }}
                            >
                              Shade: {parsed.color}
                            </span>
                          )}
                        </div>
                      )}

                      <span style={{ fontSize: "14px", fontWeight: 700, color: "#261B13" }}>
                        ₹{(item.product.price * item.quantity).toLocaleString("en-IN")}
                      </span>
                      {item.quantity > 1 && (
                        <span style={{ fontSize: "11px", color: "#6A584B", marginLeft: "6px" }}>
                          (₹{item.product.price.toLocaleString("en-IN")} each)
                        </span>
                      )}
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
                          aria-label={`Decrease quantity of ${parsed.title}`}
                          style={{
                            width: "32px",
                            height: "30px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "16px",
                            fontWeight: 700,
                            color: "#261B13",
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
                          aria-label={`Increase quantity of ${parsed.title}`}
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
                          color: "#8A181A",
                          textDecoration: "underline",
                          fontWeight: 600,
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
              padding: "16px 20px calc(18px + env(safe-area-inset-bottom, 12px)) 20px",
              borderTop: "1px solid #EAE0D5",
              backgroundColor: "#FFFFFF",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "13px",
                  color: "#6A584B",
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
                  color: "#6A584B",
                }}
              >
                <span>Pan-India Insured Delivery</span>
                <span style={{ color: subtotal >= 799 || subtotal === 0 ? "#1E5E3A" : "#866951", fontWeight: 600 }}>
                  {subtotal >= 799 || subtotal === 0 ? "FREE" : "₹50 (Free ₹799+)"}
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
                <span>Estimated Total</span>
                <span>₹{(subtotal + (subtotal > 0 && subtotal < 799 ? 50 : 0)).toLocaleString("en-IN")}</span>
              </div>
              <span style={{ fontSize: "11px", color: "#6A584B" }}>
                * Inclusive of GST · Promo codes applied at checkout
              </span>
            </div>

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
                color: "#6A584B",
              }}
            >
              <input
                type="checkbox"
                id="keepsake-gift-box"
                className="avsaraa-checkbox"
                checked={giftNote}
                onChange={(e) => setGiftOptOut(!e.target.checked)}
              />
              <label htmlFor="keepsake-gift-box" style={{ cursor: "pointer", flex: 1, userSelect: "none" }}>
                <span style={{ fontWeight: 600, color: "#261B13", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
                  <GiftIcon size={14} color="#866951" />
                  <span>Complimentary Silk Gift Wrap &amp; Note</span>
                </span>
                <span style={{ fontSize: "10.5px", color: "#6A584B" }}>
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
                    padding: "4px 0",
                  }}
                >
                  ← Continue Shopping
                </button>
                {confirmingClear ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => {
                        clearCart();
                        setConfirmingClear(false);
                      }}
                      style={{
                        fontSize: "11.5px",
                        fontWeight: 700,
                        color: "#8A181A",
                        textDecoration: "underline",
                      }}
                    >
                      Confirm Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingClear(false)}
                      style={{ fontSize: "11.5px", color: "#6A584B" }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingClear(true)}
                    style={{
                      fontSize: "12px",
                      color: "#6A584B",
                      padding: "4px 0",
                    }}
                  >
                    Clear Bag
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
