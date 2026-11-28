"use client";

import React, { useState, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { getCartItemKey, parseCartItemDisplay } from "@/lib/cartUtils";
import { ShoppingBagIcon, CloseIcon, CheckIcon, SpinnerIcon, SparkleStarIcon } from "./Icons";
import { resolveProductImage } from "@/lib/productUtils";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import { calculateOrderTotals, STANDARD_COURIER_FEE } from "@/lib/financials";

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
    appliedCoupon,
    couponLoading,
    couponError,
    applyPromoCode,
    removePromoCode,
  } = useCart();

  const [confirmingClear, setConfirmingClear] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  useAccessibleDialog(isCartOpen, closeCart, panelRef);

  const isFreeShippingCoupon = appliedCoupon?.discount_type === "free_shipping";

  const promoMerchDiscount = useMemo(() => {
    if (!appliedCoupon || appliedCoupon.discount_type === "free_shipping") return 0;
    if (appliedCoupon.discount_type === "percentage") {
      const calc = Math.round((subtotal * appliedCoupon.discount_value) / 100);
      return appliedCoupon.max_discount_amount
        ? Math.min(calc, appliedCoupon.max_discount_amount)
        : calc;
    }
    return Math.min(subtotal, Number(appliedCoupon.discount_amount || appliedCoupon.discount_value || 0));
  }, [appliedCoupon, subtotal]);

  const financials = useMemo(() => {
    return calculateOrderTotals({
      subtotal,
      discountAmount: promoMerchDiscount,
      paymentMethod: "Razorpay",
      customShippingFee: isFreeShippingCoupon ? 0 : undefined,
    });
  }, [subtotal, promoMerchDiscount, isFreeShippingCoupon]);

  const handlePromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await applyPromoCode(promoInput);
    if (ok) {
      setPromoInput("");
    }
  };

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

        {/* Cart Items + Fill Space Prompt */}
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
            <>
              {cartItems.map((item, idx) => {
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
                                Colour: {parsed.color}
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
              })}

              {/* Change 6: Fill Empty Space with "Want to add more?" Prompt */}
              <div
                style={{
                  marginTop: "auto",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E8DED3",
                  borderRadius: "16px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                    <SparkleStarIcon size={15} color="#866951" />
                    <span
                      style={{
                        fontFamily: "var(--font-serif), Georgia, serif",
                        fontSize: "15.5px",
                        fontWeight: 600,
                        color: "#261B13",
                      }}
                    >
                      Want to add more?
                    </span>
                  </div>
                  <Link
                    href="/products"
                    onClick={closeCart}
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#866951",
                      textDecoration: "underline",
                    }}
                  >
                    Browse Collection →
                  </Link>
                </div>
                <p style={{ margin: 0, fontSize: "12px", color: "#6A584B", lineHeight: 1.5 }}>
                  Complete your ensemble with artisanal silk drapes, handloom suit sets, and festive edits.
                </p>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {[
                    { label: "Sarees", href: "/products?category=Sarees" },
                    { label: "Dresses", href: "/products?category=Dresses" },
                    { label: "Under ₹1,299", href: "/products?maxPrice=1299" },
                  ].map((chip) => (
                    <Link
                      key={chip.label}
                      href={chip.href}
                      onClick={closeCart}
                      style={{
                        fontSize: "11.5px",
                        fontWeight: 600,
                        color: "#261B13",
                        backgroundColor: "#FAF7F2",
                        border: "1px solid #DFD2C4",
                        borderRadius: "999px",
                        padding: "5px 12px",
                        textDecoration: "none",
                      }}
                    >
                      + {chip.label}
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer / Promo Code & Summary (Changes 4, 5, 7, 8) */}
        {cartItems.length > 0 && (
          <div
            className="cart-drawer-footer"
            style={{
              padding: "14px 20px calc(18px + env(safe-area-inset-bottom, 12px)) 20px",
              borderTop: "1px solid #EAE0D5",
              backgroundColor: "#FFFFFF",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {/* Change 4 & 8: Promo Code inside Shopping Bag */}
            <div
              style={{
                padding: "12px",
                backgroundColor: "#FAF7F2",
                borderRadius: "12px",
                border: "1px solid #E6DACF",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "11.5px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#5A4535" }}>
                  Promo Code
                </span>
                {!appliedCoupon && (
                  <button
                    type="button"
                    onClick={() => applyPromoCode("FREESHIP")}
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#866951",
                      background: "none",
                      border: "none",
                      textDecoration: "underline",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    Use FREESHIP for free shipping
                  </button>
                )}
              </div>

              {appliedCoupon ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: "#FFFFFF",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: "1px solid rgba(30, 94, 58, 0.35)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600, color: "#1E5E3A" }}>
                    <CheckIcon size={14} color="#1E5E3A" />
                    <span>
                      {appliedCoupon.code} Applied (
                      {isFreeShippingCoupon
                        ? `Free shipping −₹${STANDARD_COURIER_FEE}`
                        : `−₹${promoMerchDiscount.toLocaleString("en-IN")}`}
                      )
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={removePromoCode}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#866951",
                      fontSize: "11.5px",
                      fontWeight: 600,
                      textDecoration: "underline",
                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePromoSubmit} style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    placeholder="Enter promo code (e.g. FREESHIP)"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    aria-label="Enter promo code"
                    style={{
                      flex: 1,
                      padding: "8px 10px",
                      borderRadius: "8px",
                      border: "1px solid #CFBEAD",
                      fontSize: "12px",
                      backgroundColor: "#FFFFFF",
                      color: "#261B13",
                      textTransform: "uppercase",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={couponLoading || !promoInput.trim()}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: "#261B13",
                      color: "#FAF7F2",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: couponLoading || !promoInput.trim() ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      opacity: couponLoading || !promoInput.trim() ? 0.65 : 1,
                    }}
                  >
                    {couponLoading ? <SpinnerIcon size={12} color="#FAF7F2" /> : "Apply"}
                  </button>
                </form>
              )}

              {couponError && (
                <p style={{ margin: "6px 0 0", fontSize: "11px", color: "#8A181A" }}>{couponError}</p>
              )}
            </div>

            {/* Totals Breakdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#6A584B" }}>
                <span>Subtotal ({totalItems} items)</span>
                <span style={{ fontWeight: 600, color: "#261B13" }}>
                  ₹{financials.subtotal.toLocaleString("en-IN")}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#6A584B" }}>
                <span>Shipping</span>
                <span style={{ fontWeight: 600, color: "#261B13" }}>
                  ₹{financials.baseShippingFee.toLocaleString("en-IN")}
                </span>
              </div>

              {isFreeShippingCoupon && financials.shippingDiscount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#1E5E3A", fontWeight: 600 }}>
                  <span>Free-shipping promo discount ({appliedCoupon?.code})</span>
                  <span>−₹{financials.shippingDiscount.toLocaleString("en-IN")}</span>
                </div>
              )}

              {!isFreeShippingCoupon && financials.discountAmount > 0 && appliedCoupon && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#1E5E3A", fontWeight: 600 }}>
                  <span>Promo discount ({appliedCoupon.code})</span>
                  <span>−₹{financials.discountAmount.toLocaleString("en-IN")}</span>
                </div>
              )}

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
                <span>₹{financials.totalAmount.toLocaleString("en-IN")}</span>
              </div>
              <span style={{ fontSize: "11px", color: "#6A584B" }}>
                * Inclusive of GST · 7-Day Easy Size &amp; Style Exchange Guarantee
              </span>
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
