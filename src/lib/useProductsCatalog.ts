"use client";

import { useState, useEffect } from "react";
import { Product } from "@/types/product";

// Module-level in-memory cache shared across all components
interface CatalogCache {
  products: Product[];
  timestamp: number;
}

let memoryCache: CatalogCache | null = null;
let inFlightPromise: Promise<Product[]> | null = null;
const CLIENT_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

export async function fetchCatalog(bypassCache = false): Promise<Product[]> {
  const now = Date.now();
  if (!bypassCache && memoryCache && now - memoryCache.timestamp < CLIENT_CACHE_TTL_MS) {
    return memoryCache.products;
  }

  // Deduplicate in-flight requests (so Bestsellers + NewArrivals + ProductsSection don't make 3 requests)
  if (inFlightPromise) {
    return inFlightPromise;
  }

  inFlightPromise = (async () => {
    try {
      const res = await fetch(`/api/products${bypassCache ? "?fresh=true" : ""}`, {
        headers: { "Accept": "application/json" },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();
      if (json.success && Array.isArray(json.products)) {
        memoryCache = {
          products: json.products,
          timestamp: Date.now(),
        };
        return json.products;
      }
      return [];
    } catch (err) {
      console.warn("Fast catalog API fetch error, falling back:", err);
      // If we have previous memory cache, return it
      if (memoryCache?.products?.length) {
        return memoryCache.products;
      }
      return [];
    } finally {
      inFlightPromise = null;
    }
  })();

  return inFlightPromise;
}

export function clearClientCatalogCache() {
  memoryCache = null;
}

export function useProductsCatalog(options?: {
  category?: string;
  maxPrice?: number;
  sort?: "bestselling" | "newest" | "price-asc" | "price-desc";
  limit?: number;
}) {
  const [allProducts, setAllProducts] = useState<Product[]>(() => memoryCache?.products || []);
  const [loading, setLoading] = useState<boolean>(() => !memoryCache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchCatalog()
      .then((prods) => {
        if (!isMounted) return;
        setAllProducts(prods);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load products");
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter and sort in memory instantly
  let displayed = [...allProducts];

  if (options?.category && options.category !== "ALL" && options.category !== "All") {
    if (
      options.category.toLowerCase() === "under ₹1,299" ||
      options.category.toLowerCase() === "under 1299"
    ) {
      displayed = displayed.filter((p) => p.price <= 1299);
    } else {
      displayed = displayed.filter(
        (p) => p.category.toLowerCase() === options.category!.toLowerCase()
      );
    }
  }

  if (options?.maxPrice !== undefined && options.maxPrice !== null) {
    displayed = displayed.filter((p) => p.price <= options.maxPrice!);
  }

  if (options?.sort === "bestselling") {
    displayed.sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0));
  } else if (options?.sort === "newest") {
    displayed.sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
  } else if (options?.sort === "price-asc") {
    displayed.sort((a, b) => a.price - b.price);
  } else if (options?.sort === "price-desc") {
    displayed.sort((a, b) => b.price - a.price);
  }

  if (options?.limit && options.limit > 0) {
    displayed = displayed.slice(0, options.limit);
  }

  return {
    products: displayed,
    allProducts,
    loading,
    error,
    refresh: () => fetchCatalog(true).then(setAllProducts),
  };
}
