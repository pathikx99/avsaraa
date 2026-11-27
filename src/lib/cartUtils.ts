import type { Product } from "@/types/product";

export interface CartItem {
  product: Product;
  quantity: number;
}

/**
 * Generates the canonical cart item key: `${product.id}__${product.name}`
 */
export const getCartItemKey = (p: Product): string => `${p.id}__${p.name}`;

/**
 * Normalizes an item identifier by stripping a trailing array index if present (e.g. `${id}__${name}__0` -> `${id}__${name}`).
 */
export const normalizeCartKey = (key: string): string => {
  if (!key) return "";
  const lastIndex = key.lastIndexOf("__");
  if (lastIndex > 0) {
    const suffix = key.slice(lastIndex + 2);
    if (/^\d+$/.test(suffix)) {
      return key.slice(0, lastIndex);
    }
  }
  return key;
};

export interface CartItemDisplay {
  title: string;
  size: string | null;
  color: string | null;
  isPreOrder: boolean;
}

/**
 * Extracts clean title and variant attributes (Size, Color, Pre-Order)
 * from composite cart product names (e.g. "Saree Name · Free Size · Crimson Red").
 */
export const parseCartItemDisplay = (product: Product): CartItemDisplay => {
  const rawName = product?.name || "";
  const parts = rawName.split(" · ").map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 1) {
    return { title: rawName, size: null, color: null, isPreOrder: false };
  }

  const title = parts[0];
  let isPreOrder = false;
  const attrs: string[] = [];

  for (let i = 1; i < parts.length; i++) {
    if (parts[i].toLowerCase() === "pre-order") {
      isPreOrder = true;
    } else {
      attrs.push(parts[i]);
    }
  }

  return {
    title,
    size: attrs[0] || null,
    color: attrs[1] || null,
    isPreOrder,
  };
};

/**
 * Robust cart item matcher:
 * - If explicit itemIndex & targetIndex are provided, matches strictly by position.
 * - Matches by exact canonical composite key (`${id}__${name}`).
 * - Matches by UI composite key with trailing index stripped (`${id}__${name}__${idx}`).
 * - Only falls back to bare product.id if identifier contains no delimiter,
 *   preventing cross-variant wipeout when multiple variants share a base product.id.
 */
export const isCartItemMatch = (
  item: CartItem,
  identifier: string,
  itemIndex?: number,
  targetIndex?: number
): boolean => {
  if (!item?.product) return false;

  // Strict positional index matching if provided
  if (typeof targetIndex === "number" && typeof itemIndex === "number") {
    return targetIndex === itemIndex;
  }

  if (!identifier) return false;

  const canonicalKey = getCartItemKey(item.product);
  const normalizedIdent = normalizeCartKey(identifier);

  // Exact match against canonical composite key
  if (canonicalKey === normalizedIdent || canonicalKey === identifier) {
    return true;
  }

  // Exact match against bare product ID (only if identifier has no name separator)
  if (!identifier.includes("__") && item.product.id === identifier) {
    return true;
  }

  return false;
};
