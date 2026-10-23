"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { Product } from "@/types/product";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import { useCart } from "@/context/CartContext";

interface WishlistContextType {
  wishlist: Product[];
  totalWishlist: number;
  user: User | null;
  isLoaded: boolean;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => boolean;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { openAuthModal, showToast } = useCart();
  const [user, setUser] = useState<User | null>(null);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const handleUserWishlistLoad = async (currentUser: User | null) => {
      setUser(currentUser);
      if (currentUser) {
        let existingWishlist: Product[] = [];
        const userKey = `avsaraa_wishlist_${currentUser.id}`;
        try {
          const saved = localStorage.getItem(userKey);
          if (saved) {
            existingWishlist = JSON.parse(saved);
          } else {
            // Check legacy storage key to migrate if present
            const legacySaved = localStorage.getItem("avsaraa_wishlist_items");
            if (legacySaved) {
              existingWishlist = JSON.parse(legacySaved);
              localStorage.setItem(userKey, legacySaved);
              localStorage.removeItem("avsaraa_wishlist_items");
            }
          }
        } catch (e) {
          console.warn("Could not load wishlist from storage", e);
          existingWishlist = [];
        }

        // Check if there was a pending wishlist item waiting for authentication
        try {
          const pendingRaw = sessionStorage.getItem("avsaraa_pending_wishlist_product");
          if (pendingRaw) {
            const pendingProd = JSON.parse(pendingRaw) as Product;
            sessionStorage.removeItem("avsaraa_pending_wishlist_product");

            const alreadySaved = existingWishlist.some((item) => item.id === pendingProd.id);
            if (!alreadySaved) {
              existingWishlist = [pendingProd, ...existingWishlist];
              localStorage.setItem(userKey, JSON.stringify(existingWishlist));
              showToast(`Saved "${pendingProd.name}" to your wishlist!`);
            }
          }
        } catch (e) {
          console.warn("Pending wishlist parse note:", e);
        }

        // Set state immediately from cache for fast render
        setWishlist(existingWishlist);
        setIsLoaded(true);

        // Synchronize with Supabase wishlists table
        try {
          const { data: dbWishlist, error: dbErr } = await supabase
            .from("wishlists")
            .select("product_id, product_data")
            .eq("user_id", currentUser.id);

          if (!dbErr && dbWishlist && isMounted) {
            // Merge database items
            const dbProducts: Product[] = [];
            for (const row of dbWishlist) {
              if (row.product_data) {
                dbProducts.push(row.product_data as Product);
              }
            }

            // Sync any local-only items up to Supabase
            const combinedMap = new Map<string, Product>();
            dbProducts.forEach((p) => combinedMap.set(p.id, p));
            existingWishlist.forEach((p) => {
              if (!combinedMap.has(p.id)) {
                combinedMap.set(p.id, p);
                // Background push to Supabase
                void supabase.from("wishlists").upsert(
                  {
                    user_id: currentUser.id,
                    product_id: p.id,
                    product_data: p,
                  },
                  { onConflict: "user_id,product_id" }
                );
              }
            });

            const mergedList = Array.from(combinedMap.values());
            setWishlist(mergedList);
            try {
              localStorage.setItem(userKey, JSON.stringify(mergedList));
            } catch {
              // ignore
            }
          }
        } catch (syncErr) {
          console.warn("Wishlist Supabase table sync notice:", syncErr);
        }
      } else {
        setWishlist([]);
        setIsLoaded(true);
      }
    };

    supabase.auth.getUser().then(({ data }) => {
      if (!isMounted) return;
      void handleUserWishlistLoad(data.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      void handleUserWishlistLoad(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [showToast]);

  const isInWishlist = useCallback(
    (productId: string) => {
      if (!user) return false;
      return wishlist.some((item) => item.id === productId);
    },
    [wishlist, user]
  );

  const toggleWishlist = useCallback(
    (product: Product): boolean => {
      if (!user) {
        try {
          sessionStorage.setItem("avsaraa_pending_wishlist_product", JSON.stringify(product));
        } catch {
          // ignore
        }
        openAuthModal(product, "wishlist");
        showToast("Please sign in to save items to your wishlist.");
        return false;
      }

      setWishlist((prev) => {
        const exists = prev.some((item) => item.id === product.id);
        let updated: Product[];
        if (exists) {
          updated = prev.filter((item) => item.id !== product.id);
          showToast(`Removed "${product.name}" from your wishlist`);
          // Delete from Supabase wishlists table
          void supabase
            .from("wishlists")
            .delete()
            .eq("user_id", user.id)
            .eq("product_id", product.id);
        } else {
          updated = [product, ...prev];
          showToast(`Saved "${product.name}" to your wishlist!`);
          // Upsert into Supabase wishlists table
          void supabase.from("wishlists").upsert(
            {
              user_id: user.id,
              product_id: product.id,
              product_data: product,
            },
            { onConflict: "user_id,product_id" }
          );
        }
        try {
          localStorage.setItem(`avsaraa_wishlist_${user.id}`, JSON.stringify(updated));
        } catch (e) {
          console.warn("Could not save wishlist to storage", e);
        }
        return updated;
      });
      return true;
    },
    [user, openAuthModal, showToast]
  );

  const removeFromWishlist = useCallback(
    (productId: string) => {
      if (!user) return;
      setWishlist((prev) => {
        const updated = prev.filter((item) => item.id !== productId);
        try {
          localStorage.setItem(`avsaraa_wishlist_${user.id}`, JSON.stringify(updated));
        } catch (e) {
          console.warn("Could not save wishlist to storage", e);
        }
        return updated;
      });
      // Delete from Supabase wishlists table
      void supabase
        .from("wishlists")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId);
    },
    [user]
  );

  const clearWishlist = useCallback(() => {
    if (!user) return;
    setWishlist([]);
    try {
      localStorage.removeItem(`avsaraa_wishlist_${user.id}`);
    } catch (e) {
      console.warn("Could not clear wishlist from storage", e);
    }
    // Delete all from Supabase wishlists table
    void supabase.from("wishlists").delete().eq("user_id", user.id);
  }, [user]);

  const value = useMemo(
    () => ({
      wishlist,
      totalWishlist: wishlist.length,
      user,
      isLoaded,
      isInWishlist,
      toggleWishlist,
      removeFromWishlist,
      clearWishlist,
    }),
    [wishlist, user, isLoaded, isInWishlist, toggleWishlist, removeFromWishlist, clearWishlist]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
