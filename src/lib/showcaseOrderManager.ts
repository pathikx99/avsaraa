import fs from "fs";
import path from "path";
import type { Product } from "../types/product.ts";

const SHOWCASE_FILE_PATH = path.join(process.cwd(), "src", "data", "catalogShowcaseOrder.json");

interface ShowcaseMetadata {
  orderedIds: string[];
  updatedAt: string;
}

/**
 * Retrieve the current showcase ordered product IDs.
 */
export function getShowcaseOrderedIds(): string[] {
  try {
    if (fs.existsSync(SHOWCASE_FILE_PATH)) {
      const fileContent = fs.readFileSync(SHOWCASE_FILE_PATH, "utf-8");
      const parsed: ShowcaseMetadata = JSON.parse(fileContent);
      if (Array.isArray(parsed.orderedIds)) {
        return parsed.orderedIds;
      }
    }
  } catch (err) {
    console.warn("Notice: Unable to read catalogShowcaseOrder.json, using default ordering:", err);
  }
  return [];
}

/**
 * Sorts any list of products according to the showcase order.
 */
export function sortProductsByShowcase(products: Product[]): Product[] {
  const orderedIds = getShowcaseOrderedIds();
  if (!orderedIds || orderedIds.length === 0) {
    return [...products];
  }

  const orderMap = new Map<string, number>();
  orderedIds.forEach((id, index) => {
    orderMap.set(id, index);
  });

  return [...products].sort((a, b) => {
    const rankA = orderMap.has(a.id)
      ? orderMap.get(a.id)!
      : typeof a.display_order === "number"
      ? a.display_order
      : typeof (a.specifications as Record<string, unknown> | undefined)?.display_order === "number"
      ? ((a.specifications as Record<string, unknown>).display_order as number)
      : 99999;

    const rankB = orderMap.has(b.id)
      ? orderMap.get(b.id)!
      : typeof b.display_order === "number"
      ? b.display_order
      : typeof (b.specifications as Record<string, unknown> | undefined)?.display_order === "number"
      ? ((b.specifications as Record<string, unknown>).display_order as number)
      : 99999;

    if (rankA !== rankB) {
      return rankA - rankB;
    }

    // Secondary fallback: created_at descending
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });
}

/**
 * Persists a new showcase order: writes to local JSON store and updates remote Supabase specifications.
 */
export async function saveShowcaseOrderedIds(orderedIds: string[]): Promise<boolean> {
  let localSaved = false;
  let remoteSaved = false;

  // 1. Best-effort local JSON metadata file (skipped silently on read-only serverless filesystems like Vercel)
  try {
    const meta: ShowcaseMetadata = {
      orderedIds,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(SHOWCASE_FILE_PATH, JSON.stringify(meta, null, 2), "utf-8");
    localSaved = true;
  } catch (err) {
    console.warn("Notice: Unable to write catalogShowcaseOrder.json (read-only filesystem):", err);
  }

  // 2. Remote update to Supabase products table specifications
  try {
    const { getAdminSupabaseClient } = await import("./supabaseAdmin.ts");
    const supabaseAdmin = getAdminSupabaseClient();
    const updatePromises = orderedIds.map(async (id, index) => {
      const { data: prod } = await supabaseAdmin
        .from("products")
        .select("specifications")
        .eq("id", id)
        .single();

      const currentSpecs = (prod?.specifications && typeof prod.specifications === "object")
        ? { ...(prod.specifications as Record<string, unknown>) }
        : {};

      currentSpecs.display_order = index;

      const { error } = await supabaseAdmin
        .from("products")
        .update({ specifications: currentSpecs })
        .eq("id", id);

      if (error) throw error;
    });

    const results = await Promise.allSettled(updatePromises);
    remoteSaved = results.some((r) => r.status === "fulfilled");
  } catch (err) {
    console.warn("Notice: Unable to sync showcase ordering to Supabase:", err);
  }

  return localSaved || remoteSaved;
}
