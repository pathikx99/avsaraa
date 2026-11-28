"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Product } from "@/types/product";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import { getCartItemKey, isCartItemMatch, type CartItem } from "@/lib/cartUtils";

export type { CartItem };
export { getCartItemKey, isCartItemMatch };

export interface AppliedCouponState {
  code: string;
  discount_amount: number;
  discount_type: "percentage" | "fixed" | "free_shipping" | string;
  discount_value: number;
  max_discount_amount?: number | null;
  min_order_amount?: number;
}

interface CartContextType {
  cartItems: CartItem[];
  totalItems: number;
  subtotal: number;
  isCartOpen: boolean;
  isAuthModalOpen: boolean;
  authModalReason: "cart" | "wishlist";
  pendingProduct: Product | null;
  toastMessage: string | null;
  user: User | null;
  appliedCoupon: AppliedCouponState | null;
  couponLoading: boolean;
  couponError: string | null;
  applyPromoCode: (code: string, overrideSubtotal?: number) => Promise<boolean>;
  removePromoCode: () => void;
  addToCart: (product: Product, quantity?: number, options?: { openCartDrawer?: boolean }) => boolean;
  removeFromCart: (productId: string, itemIndex?: number) => void;
  updateQuantity: (productId: string, quantity: number, itemIndex?: number) => void;
  clearCart: () => void;
  setIsCartOpen: (open: boolean) => void;
  openCart: () => void;
  closeCart: () => void;
  openAuthModal: (product?: Product, reason?: "cart" | "wishlist") => void;
  closeAuthModal: () => void;
  showToast: (msg: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const GUEST_CART_KEY = "avsaraa_guest_cart";
const COUPON_CODE_KEY = "avsaraa_applied_coupon";
const COUPON_DATA_KEY = "avsaraa_applied_coupon_data";
const DEBOUNCE_DELAY_MS = 400;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalReason, setAuthModalReason] = useState<"cart" | "wishlist">("cart");
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastHasBagAction, setToastHasBagAction] = useState(false);
  const [appliedCouponRaw, setAppliedCoupon] = useState<AppliedCouponState | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(COUPON_DATA_KEY);
      if (raw) return JSON.parse(raw) as AppliedCouponState;
    } catch {}
    return null;
  });
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const showToast = useCallback((msg: string, withBagAction = false) => {
    setToastMessage(msg);
    setToastHasBagAction(withBagAction);
    setTimeout(() => {
      setToastMessage((current) => {
        if (current === msg) {
          setToastHasBagAction(false);
          return null;
        }
        return current;
      });
    }, 4000);
  }, []);

  const syncServerCart = useCallback((items: CartItem[], currentUser: User | null) => {
    if (!currentUser) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        await fetch("/api/customer/cart", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
          keepalive: true,
          signal: controller.signal,
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        console.warn("Server cart sync note:", err);
      }
    }, DEBOUNCE_DELAY_MS);
  }, []);

  const persistCartLocally = useCallback(
    (items: CartItem[], currentUser: User | null) => {
      try {
        if (currentUser) {
          localStorage.setItem(`avsaraa_cart_${currentUser.id}`, JSON.stringify(items));
          syncServerCart(items, currentUser);
        } else {
          localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
        }
      } catch (err) {
        console.warn("Storage sync notice:", err);
      }
    },
    [syncServerCart]
  );

  useEffect(() => {
    let isMounted = true;

    const handleUserCartLoad = async (currentUser: User | null) => {
      setUser(currentUser);

      if (currentUser) {
        let userCart: CartItem[] = [];
        const savedUserCart = localStorage.getItem(`avsaraa_cart_${currentUser.id}`);
        if (savedUserCart) {
          try {
            userCart = JSON.parse(savedUserCart);
          } catch {
            userCart = [];
          }
        }

        try {
          const res = await fetch("/api/customer/cart");
          if (res.ok) {
            const data = await res.json();
            if (data.success && Array.isArray(data.items) && data.items.length > 0) {
              userCart = data.items;
            }
          }
        } catch {
          // Use local userCart
        }

        const savedGuestCart = localStorage.getItem(GUEST_CART_KEY);
        if (savedGuestCart) {
          try {
            const guestItems: CartItem[] = JSON.parse(savedGuestCart);
            if (Array.isArray(guestItems) && guestItems.length > 0) {
              guestItems.forEach((gItem) => {
                const targetKey = getCartItemKey(gItem.product);
                const existingIdx = userCart.findIndex(
                  (uItem) => getCartItemKey(uItem.product) === targetKey
                );
                if (existingIdx > -1) {
                  userCart[existingIdx].quantity += gItem.quantity;
                } else {
                  userCart.push(gItem);
                }
              });

              localStorage.removeItem(GUEST_CART_KEY);
              showToast("Your guest cart items have been merged with your account bag!");
            }
          } catch {
            // ignore
          }
        }

        try {
          const pendingRaw = sessionStorage.getItem("avsaraa_pending_product");
          if (pendingRaw) {
            const pendingProd = JSON.parse(pendingRaw) as Product;
            sessionStorage.removeItem("avsaraa_pending_product");
            setPendingProduct(null);

            const existingIndex = userCart.findIndex(
              (item) => item.product.id === pendingProd.id
            );
            if (existingIndex > -1) {
              userCart[existingIndex].quantity += 1;
            } else {
              userCart = [{ product: pendingProd, quantity: 1 }, ...userCart];
            }
            showToast(`Added "${pendingProd.name}" to your shopping bag!`, true);
          }
        } catch {
          // ignore
        }

        if (isMounted) {
          setCartItems(userCart);
          persistCartLocally(userCart, currentUser);
        }
      } else {
        let guestCart: CartItem[] = [];
        const savedGuest = localStorage.getItem(GUEST_CART_KEY);
        if (savedGuest) {
          try {
            guestCart = JSON.parse(savedGuest);
          } catch {
            guestCart = [];
          }
        }
        if (isMounted) {
          setCartItems(guestCart);
        }
      }
    };

    supabase.auth.getUser().then(({ data }) => {
      if (!isMounted) return;
      handleUserCartLoad(data.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      handleUserCartLoad(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [persistCartLocally, showToast]);

  const totalItems = useMemo(() => {
    return cartItems.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [cartItems]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, curr) => acc + curr.product.price * curr.quantity, 0);
  }, [cartItems]);

  const removePromoCode = useCallback(() => {
    setAppliedCoupon(null);
    setCouponError(null);
    try {
      localStorage.removeItem(COUPON_CODE_KEY);
      localStorage.removeItem(COUPON_DATA_KEY);
    } catch {}
  }, []);

  const applyPromoCode = useCallback(
    async (rawCode: string, overrideSubtotal?: number): Promise<boolean> => {
      const targetCode = rawCode.trim().toUpperCase();
      if (!targetCode) {
        setCouponError("Please enter a promo code.");
        return false;
      }

      setCouponLoading(true);
      setCouponError(null);
      try {
        const res = await fetch("/api/coupons/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: targetCode,
            subtotal: overrideSubtotal !== undefined ? overrideSubtotal : subtotal,
          }),
        });
        const data = await res.json();
        if (res.ok && data.valid && data.coupon) {
          setAppliedCoupon(data.coupon);
          setCouponError(null);
          try {
            localStorage.setItem(COUPON_CODE_KEY, data.coupon.code);
            localStorage.setItem(COUPON_DATA_KEY, JSON.stringify(data.coupon));
          } catch {}
          return true;
        }
        setCouponError(data.message || "Invalid or ineligible promo code.");
        return false;
      } catch {
        setCouponError("Unable to verify promo code right now. Please retry.");
        return false;
      } finally {
        setCouponLoading(false);
      }
    },
    [subtotal]
  );

  const appliedCoupon = useMemo(() => {
    if (!appliedCouponRaw || cartItems.length === 0) return null;
    if (
      appliedCouponRaw.min_order_amount &&
      appliedCouponRaw.min_order_amount > 0 &&
      subtotal < appliedCouponRaw.min_order_amount
    ) {
      return null;
    }
    return appliedCouponRaw;
  }, [appliedCouponRaw, cartItems.length, subtotal]);

  // Auto-restore code from legacy COUPON_CODE_KEY asynchronously when subtotal > 0
  const restoredCouponAttemptRef = useRef(false);
  useEffect(() => {
    if (restoredCouponAttemptRef.current || appliedCouponRaw || subtotal <= 0) return;
    let savedCode: string | null = null;
    try {
      savedCode = localStorage.getItem(COUPON_CODE_KEY);
    } catch {
      savedCode = null;
    }
    if (!savedCode) return;

    restoredCouponAttemptRef.current = true;
    const timer = setTimeout(() => {
      void applyPromoCode(savedCode as string, subtotal);
    }, 0);
    return () => clearTimeout(timer);
  }, [appliedCouponRaw, subtotal, applyPromoCode]);

  const addToCart = useCallback(
    (product: Product, quantity = 1, options?: { openCartDrawer?: boolean }): boolean => {
      const addedQty = Math.max(1, quantity);
      const targetKey = getCartItemKey(product);

      setCartItems((prevItems) => {
        const existingIndex = prevItems.findIndex(
          (item) => getCartItemKey(item.product) === targetKey
        );
        let updated: CartItem[];

        if (existingIndex > -1) {
          const currentItem = prevItems[existingIndex];
          const maxStock =
            currentItem.product.stock_count && currentItem.product.stock_count > 0
              ? currentItem.product.stock_count
              : 20;
          const newQty = Math.min(maxStock, currentItem.quantity + addedQty);

          updated = prevItems.map((item, index) =>
            index === existingIndex ? { ...item, quantity: newQty } : item
          );
        } else {
          updated = [{ product, quantity: addedQty }, ...prevItems];
        }

        persistCartLocally(updated, user);
        return updated;
      });

      showToast(`Added "${product.name}" to your shopping bag.`, true);
      if (options?.openCartDrawer) {
        setIsCartOpen(true);
      }
      return true;
    },
    [user, persistCartLocally, showToast]
  );

  const removeFromCart = useCallback(
    (itemIdentifier: string, itemIndex?: number) => {
      setCartItems((prev) => {
        let updated: CartItem[];
        if (typeof itemIndex === "number" && itemIndex >= 0 && itemIndex < prev.length) {
          updated = prev.filter((_, idx) => idx !== itemIndex);
        } else {
          updated = prev.filter(
            (item, idx) => !isCartItemMatch(item, itemIdentifier, idx, itemIndex)
          );
        }
        persistCartLocally(updated, user);
        return updated;
      });
      showToast("Item removed from your shopping bag.");
    },
    [user, persistCartLocally, showToast]
  );

  const updateQuantity = useCallback(
    (itemIdentifier: string, quantity: number, itemIndex?: number) => {
      if (quantity <= 0) {
        removeFromCart(itemIdentifier, itemIndex);
        return;
      }

      setCartItems((prev) => {
        const updated = prev.map((item, idx) => {
          const isMatch =
            (typeof itemIndex === "number" && idx === itemIndex) ||
            isCartItemMatch(item, itemIdentifier, idx, itemIndex);
          if (!isMatch) return item;

          const maxStock =
            item.product.stock_count && item.product.stock_count > 0 ? item.product.stock_count : 20;
          const cappedQty = Math.min(maxStock, quantity);
          return { ...item, quantity: cappedQty };
        });

        persistCartLocally(updated, user);
        return updated;
      });
    },
    [user, persistCartLocally, removeFromCart]
  );

  const clearCart = useCallback(() => {
    setCartItems([]);
    removePromoCode();
    if (user) {
      localStorage.removeItem(`avsaraa_cart_${user.id}`);
      syncServerCart([], user);
    } else {
      localStorage.removeItem(GUEST_CART_KEY);
    }
    showToast("Shopping bag cleared.");
  }, [user, showToast, syncServerCart, removePromoCode]);

  const openCart = useCallback(() => {
    setIsCartOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    setIsCartOpen(false);
  }, []);

  const openAuthModal = useCallback((product?: Product, reason: "cart" | "wishlist" = "cart") => {
    setAuthModalReason(reason);
    if (product) {
      setPendingProduct(product);
      try {
        if (reason === "wishlist") {
          sessionStorage.setItem("avsaraa_pending_wishlist_product", JSON.stringify(product));
        } else {
          sessionStorage.setItem("avsaraa_pending_product", JSON.stringify(product));
        }
      } catch {
        // ignore
      }
    }
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setPendingProduct(null);
    setAuthModalReason("cart");
  }, []);

  const value = useMemo(
    () => ({
      cartItems,
      totalItems,
      subtotal,
      isCartOpen,
      isAuthModalOpen,
      authModalReason,
      pendingProduct,
      toastMessage,
      user,
      appliedCoupon,
      couponLoading,
      couponError,
      applyPromoCode,
      removePromoCode,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      setIsCartOpen,
      openCart,
      closeCart,
      openAuthModal,
      closeAuthModal,
      showToast,
    }),
    [
      cartItems,
      totalItems,
      subtotal,
      isCartOpen,
      isAuthModalOpen,
      authModalReason,
      pendingProduct,
      toastMessage,
      user,
      appliedCoupon,
      couponLoading,
      couponError,
      applyPromoCode,
      removePromoCode,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      openCart,
      closeCart,
      openAuthModal,
      closeAuthModal,
      showToast,
    ]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      {toastMessage && !isCartOpen && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            bottom: "88px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "min(420px, calc(100vw - 24px))",
            backgroundColor: "#261B13",
            color: "#FAF7F2",
            padding: "11px 16px",
            borderRadius: "16px",
            fontSize: "12.5px",
            fontWeight: 500,
            zIndex: 100001,
            boxShadow: "0 12px 32px rgba(38,27,19,0.35)",
            border: "1px solid rgba(197, 160, 89, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            animation: "fadeIn 0.22s ease",
            letterSpacing: "0.01em",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, flex: 1 }}>
            <span style={{ color: "#D4BEAA", flexShrink: 0 }}>✦</span>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{toastMessage}</span>
          </div>
          {toastHasBagAction && (
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              style={{
                backgroundColor: "#FAF7F2",
                color: "#261B13",
                border: "none",
                borderRadius: "999px",
                padding: "5px 12px",
                fontSize: "11.5px",
                fontWeight: 700,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              View Bag
            </button>
          )}
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
