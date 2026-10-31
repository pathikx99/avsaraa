import { Product, ColorVariant, ProductType, OCCASIONS_LIST } from "@/types/product";

interface ExtractedMeta {
  occasion_tags?: string[];
  color_variants?: ColorVariant[];
  sales_count?: number;
  product_type?: ProductType;
}

/**
 * Parses embedded JSON metadata from a description string if present.
 * Format: <!--meta:{"occasion_tags":[...],"sales_count":...}-->
 */
export function extractMetaFromDescription(description?: string): ExtractedMeta {
  if (!description) return {};
  const match = description.match(/<!--meta:(.*?)-->/);
  if (!match || !match[1]) return {};
  try {
    return JSON.parse(match[1]);
  } catch {
    return {};
  }
}

/**
 * Returns clean user-facing description text without internal metadata comments.
 */
export function cleanDescription(description?: string): string {
  if (!description) return "";
  return description.replace(/<!--meta:.*?-->/g, "").trim();
}

/**
 * Normalizes a product record, ensuring occasion_tags, color_variants, sales_count,
 * and product_type are available whether they were retrieved from native columns
 * or extracted from description metadata.
 */
export function normalizeProduct(raw: Product): Product {
  const meta = extractMetaFromDescription(raw.description);

  const occasion_tags =
    Array.isArray(raw.occasion_tags) && raw.occasion_tags.length > 0
      ? raw.occasion_tags
      : meta.occasion_tags || [];

  const color_variants =
    Array.isArray(raw.color_variants) && raw.color_variants.length > 0
      ? raw.color_variants
      : meta.color_variants || [];

  const sales_count =
    typeof raw.sales_count === "number" && raw.sales_count > 0
      ? raw.sales_count
      : typeof meta.sales_count === "number"
      ? meta.sales_count
      : 0;

  const product_type = raw.product_type || meta.product_type || "standalone";

  return {
    ...raw,
    occasion_tags,
    color_variants,
    sales_count,
    product_type,
    description: cleanDescription(raw.description),
  };
}

/**
 * Normalizes an array of products.
 */
export function normalizeProducts(products: Product[]): Product[] {
  return products.map(normalizeProduct);
}

/**
 * Formats a numeric price into INR currency string with symbol (e.g., ₹1,299 or ₹24,999)
 */
export function formatINR(price: number): string {
  const rounded = Math.round(price);
  return `₹${rounded.toLocaleString("en-IN")}`;
}

/**
 * Slug-to-tag mapping for URL matching
 */
const SLUG_TO_OCCASION: Record<string, string[]> = {
  everyday: ["everyday essentials", "daily wear", "everyday"],
  festive: ["festive edit", "festive"],
  "wedding-guest": ["wedding guest", "wedding"],
  "haldi-mehendi": ["haldi & mehendi", "haldi", "mehendi"],
  traditional: ["traditional & ceremonial wear", "traditional & ceremonial", "traditional"],
  party: ["party & special occasions", "party", "cocktail"],
};

/**
 * Checks if a product matches a given occasion slug
 */
export function productMatchesOccasion(product: Product, slug: string): boolean {
  if (!slug) return true;
  const targetKeywords = SLUG_TO_OCCASION[slug.toLowerCase()] || [slug.toLowerCase()];
  const tags = (product.occasion_tags || []).map((t) => t.toLowerCase());

  return targetKeywords.some((keyword) =>
    tags.some((tag) => tag.includes(keyword) || keyword.includes(tag))
  );
}

/**
 * Retrieves the display title for an occasion slug
 */
export function getOccasionTitleBySlug(slug: string): string {
  const found = OCCASIONS_LIST.find((o) => o.slug.toLowerCase() === slug.toLowerCase());
  return found ? found.title : slug;
}
