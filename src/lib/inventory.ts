import "server-only";
import { OrderItem } from "@/types/order";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";

export interface InventoryDeductionTarget {
  product_id?: string;
  quantity: number;
  size?: string;
}

export interface InventoryDeductionResult {
  success: boolean;
  failedProducts: Array<{ productId: string; requested: number; reason: string }>;
}

/**
 * Atomically decrements product stock_count using PostgreSQL FOR UPDATE row locking
 * via the deduct_stock_atomic RPC in deterministic product_id order (deadlock-free).
 * Size-level inventory is adjusted after successful stock deduction.
 */
export async function deductInventory(
  adminClient: ReturnType<typeof getAdminSupabaseClient>,
  items: Array<OrderItem | InventoryDeductionTarget>
): Promise<InventoryDeductionResult> {
  if (!items || items.length === 0) {
    return { success: true, failedProducts: [] };
  }

  const productQtyMap = new Map<
    string,
    { totalQty: number; sizeQty: Record<string, number> }
  >();

  for (const item of items) {
    const productId = item.product_id;
    const qty = Number(item.quantity);
    if (!productId || !Number.isFinite(qty) || qty <= 0) {
      continue;
    }
    const cleanQty = Math.floor(qty);
    const size = item.size ?? "Standard";
    const entry = productQtyMap.get(productId) || {
      totalQty: 0,
      sizeQty: {},
    };
    entry.totalQty += cleanQty;
    entry.sizeQty[size] = (entry.sizeQty[size] || 0) + cleanQty;
    productQtyMap.set(productId, entry);
  }

  const failedProducts: Array<{ productId: string; requested: number; reason: string }> = [];
  // Sort product IDs deterministically to eliminate multi-row lock deadlocks
  const sortedEntries = Array.from(productQtyMap.entries()).sort(([a], [b]) => a.localeCompare(b));

  for (const [productId, { totalQty, sizeQty }] of sortedEntries) {
    // Atomic stock deduction with row-level locking via PostgreSQL RPC
    const { data: deducted, error: deductErr } = await adminClient
      .rpc("deduct_stock_atomic", { p_product_id: productId, p_quantity: totalQty })
      .single();

    if (deductErr || !deducted) {
      failedProducts.push({
        productId,
        requested: totalQty,
        reason: deductErr?.message || "Insufficient stock or product record absent",
      });
      continue;
    }

    // Size-level inventory adjustment (best-effort after successful atomic stock deduct)
    const { data: product } = await adminClient
      .from("products")
      .select("id, size_inventory")
      .eq("id", productId)
      .maybeSingle();

    if (!product) {
      continue;
    }

    const currentInv: Record<string, number> =
      product.size_inventory && typeof product.size_inventory === "object"
        ? { ...(product.size_inventory as Record<string, number>) }
        : {};
    const newInv = { ...currentInv };

    for (const [size, qty] of Object.entries(sizeQty)) {
      newInv[size] = Math.max(0, Number(newInv[size] || 0) - qty);
    }

    await adminClient
      .from("products")
      .update({ size_inventory: newInv })
      .eq("id", productId);
  }

  return {
    success: failedProducts.length === 0,
    failedProducts,
  };
}
