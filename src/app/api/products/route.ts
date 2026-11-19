import { NextResponse } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { normalizeProducts } from "@/lib/productUtils";
import { Product } from "@/types/product";
import { SEED_CATALOG_PRODUCTS } from "@/lib/productDetailData";

// In-Memory Server Cache for Ultra-Fast Product Fetching
interface CacheEntry {
  data: Product[];
  timestamp: number;
}

let cachedCatalog: CacheEntry | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function invalidateProductsCache() {
  cachedCatalog = null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : null;
    const sort = searchParams.get("sort"); // "bestselling" | "newest" | "price-asc" | "price-desc"
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : null;
    const occasion = searchParams.get("occasion");
    const bypassCache = searchParams.get("fresh") === "true";

    const now = Date.now();
    let allProducts: Product[];

    if (!bypassCache && cachedCatalog && now - cachedCatalog.timestamp < CACHE_TTL_MS) {
      allProducts = cachedCatalog.data;
    } else {
      const supabaseAdmin = getAdminSupabaseClient();
      const { data, error } = await supabaseAdmin
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error || !data || data.length === 0) {
        if (error) {
          console.warn("Products API Supabase note, serving verified fallback catalog:", error.message || error);
        }
        allProducts = normalizeProducts(SEED_CATALOG_PRODUCTS);
      } else {
        allProducts = normalizeProducts(data);
      }

      cachedCatalog = {
        data: allProducts,
        timestamp: now,
      };
    }

    // Apply Filters in memory (ultra-fast < 1ms)
    let filtered = [...allProducts];

    if (category && category !== "ALL" && category !== "All") {
      if (category.toLowerCase() === "under ₹1,299" || category.toLowerCase() === "under 1299") {
        filtered = filtered.filter((p) => p.price <= 1299);
      } else {
        filtered = filtered.filter(
          (p) => p.category.toLowerCase() === category.toLowerCase()
        );
      }
    }

    if (maxPrice !== null && !isNaN(maxPrice)) {
      filtered = filtered.filter((p) => p.price <= maxPrice);
    }

    if (occasion) {
      filtered = filtered.filter(
        (p) =>
          Array.isArray(p.occasion_tags) &&
          p.occasion_tags.some((t) => t.toLowerCase().includes(occasion.toLowerCase()))
      );
    }

    // Apply Sorting
    if (sort === "bestselling") {
      filtered.sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0));
    } else if (sort === "newest") {
      filtered.sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
    } else if (sort === "price-asc") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sort === "price-desc") {
      filtered.sort((a, b) => b.price - a.price);
    }

    // Apply Limit
    if (limit && limit > 0) {
      filtered = filtered.slice(0, limit);
    }

    // Set aggressive browser & CDN edge caching headers for sub-second page loads
    return NextResponse.json(
      {
        success: true,
        count: filtered.length,
        total: allProducts.length,
        products: filtered,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
        },
      }
    );
  } catch (err: unknown) {
    if ((err as { digest?: string })?.digest?.startsWith("NEXT_")) {
      throw err;
    }
    console.error("Products API exception:", err);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred while fetching products." },
      { status: 500 }
    );
  }
}
