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
 * Robust cart item matcher: resolves by product ID, canonical composite key,
 * or UI composite key with appended array index (e.g., `${id}__${name}__${idx}`).
 */
export const isCartItemMatch = (item: CartItem, identifier: string): boolean => {
  if (!identifier || !item?.product) return false;
  if (item.product.id === identifier) return true;
  if (getCartItemKey(item.product) === identifier) return true;
  if (identifier.startsWith(`${item.product.id}__`)) return true;
  if (identifier.split("__")[0] === item.product.id) return true;
  return false;
};
