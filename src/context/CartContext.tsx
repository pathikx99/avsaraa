"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { Product } from "@/types/product";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

export interface CartItem {
  product: Product;
  quantity: number;
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
  addToCart: (product: Product, quantity?: number) => boolean;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setIsCartOpen: (open: boolean) => void;
  openCart: () => void;
  closeCart: () => void;
  openAuthModal: (product?: Product, reason?: "cart" | "wishlist") => void;
  closeAuthModal: () => void;
  showToast: (msg: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalReason, setAuthModalReason] = useState<"cart" | "wishlist">("cart");
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3600);
  }, []);

  // Sync user state and load persistent cart for authenticated member
  useEffect(() => {
    let isMounted = true;

    const handleUserCartLoad = (currentUser: User | null) => {
      setUser(currentUser);
      if (currentUser) {
        // 1. Load saved cart
        let existingCart: CartItem[] = [];
        const saved = localStorage.getItem(`avsaraa_cart_${currentUser.id}`);
        if (saved) {
          try {
            existingCart = JSON.parse(saved);
          } catch {
            existingCart = [];
          }
        }

        // 2. Check if there was a pending product waiting for authentication
        try {
          const pendingRaw = sessionStorage.getItem("avsaraa_pending_product");
          if (pendingRaw) {
            const pendingProd = JSON.parse(pendingRaw) as Product;
            sessionStorage.removeItem("avsaraa_pending_product");
            setPendingProduct(null);

            const existingIndex = existingCart.findIndex(
              (item) => item.product.id === pendingProd.id
            );
            if (existingIndex > -1) {
              existingCart[existingIndex].quantity += 1;
            } else {
              existingCart = [{ product: pendingProd, quantity: 1 }, ...existingCart];
            }

            localStorage.setItem(
              `avsaraa_cart_${currentUser.id}`,
              JSON.stringify(existingCart)
            );
            showToast(`Added "${pendingProd.name}" to your shopping bag!`);
            setIsCartOpen(true);
          }
        } catch (e) {
          console.warn("Pending product parse note:", e);
        }

        setCartItems(existingCart);
      } else {
        setCartItems([]);
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
  }, [showToast]);

  // Persist cart whenever it changes for the logged-in user
  const persistCart = useCallback((items: CartItem[], currentUser: User | null) => {
    if (currentUser) {
      try {
        localStorage.setItem(`avsaraa_cart_${currentUser.id}`, JSON.stringify(items));
      } catch (err) {
        console.warn("Failed to persist cart to localStorage:", err);
      }
    }
  }, []);

  /**
   * Add to Cart Gate:
   * Customers can view products freely, but MUST be logged in to add to cart.
   */
  const addToCart = useCallback(
    (product: Product, quantity = 1): boolean => {
      if (!user) {
        // Customer is a guest / not logged in
        setPendingProduct(product);
        try {
          sessionStorage.setItem("avsaraa_pending_product", JSON.stringify(product));
        } catch {
          // ignore storage failure
        }
        setIsAuthModalOpen(true);
        showToast("Please sign in to add items to your shopping bag.");
        return false;
      }

      setCartItems((prevItems) => {
        const existingIndex = prevItems.findIndex((item) => item.product.id === product.id);
        let updated: CartItem[];

        if (existingIndex > -1) {
          updated = prevItems.map((item, index) =>
            index === existingIndex
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          updated = [{ product, quantity }, ...prevItems];
        }

        persistCart(updated, user);
        return updated;
      });

      showToast(`Added "${product.name}" to your shopping bag.`);
      setIsCartOpen(true);
      return true;
    },
    [user, persistCart, showToast]
  );

  const removeFromCart = useCallback(
    (productId: string) => {
      setCartItems((prev) => {
        const updated = prev.filter((item) => item.product.id !== productId);
        persistCart(updated, user);
        return updated;
      });
      showToast("Item removed from your shopping bag.");
    },
    [user, persistCart, showToast]
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(productId);
        return;
      }

      setCartItems((prev) => {
        const updated = prev.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        );
        persistCart(updated, user);
        return updated;
      });
    },
    [user, persistCart, removeFromCart]
  );

  const clearCart = useCallback(() => {
    setCartItems([]);
    if (user) {
      localStorage.removeItem(`avsaraa_cart_${user.id}`);
    }
    showToast("Shopping bag cleared.");
  }, [user, showToast]);

  const totalItems = useMemo(() => {
    return cartItems.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [cartItems]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, curr) => acc + curr.product.price * curr.quantity, 0);
  }, [cartItems]);

  const openCart = useCallback(() => {
    if (!user) {
      setIsAuthModalOpen(true);
      showToast("Please sign in to access your shopping bag.");
      return;
    }
    setIsCartOpen(true);
  }, [user, showToast]);

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
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: "28px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#261B13",
            color: "#FAF7F2",
            padding: "12px 26px",
            borderRadius: "30px",
            fontSize: "13px",
            fontWeight: 500,
            zIndex: 2000,
            boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            animation: "fadeIn 0.25s ease",
            letterSpacing: "0.02em",
            pointerEvents: "none",
            maxWidth: "90vw",
            textAlign: "center",
          }}
        >
          <span style={{ color: "#D4BEAA" }}>✦</span>
          <span>{toastMessage}</span>
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
