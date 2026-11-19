import crypto from "crypto";

/**
 * Sanitizes and normalizes human-entered names into clean, URL-safe and S3/R2-friendly slugs.
 * E.g., "Men's Wear" -> "mens-wear", "Pure Banarasi Katan Silk" -> "pure-banarasi-katan-silk"
 */
export function slugifyStorageName(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/['"’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface BuildStoragePathOptions {
  folder?: string;
  category?: string;
  productName?: string;
  originalFileName?: string;
  role?: string;
  randomSuffix?: string;
}

/**
 * Automatically organizes luxury apparel image assets into structured Cloudflare R2 / S3 storage paths.
 *
 * Folder Organization Convention:
 * - Product imagery: products/{categorySlug}/{productSlug}-{roleSlug}-{shortHex}.webp
 *   Example: products/sarees/royal-katan-silk-saree-hero-7b8c9d.webp
 *   Example: products/sarees/royal-katan-silk-saree-gallery-1-e4f5a6.webp
 * - General assets: {folderSlug}/{assetSlug}-{shortHex}.webp
 */
export function buildOrganizedStoragePath(options: BuildStoragePathOptions): {
  storagePath: string;
  fileName: string;
  folder: string;
} {
  const folder = options.folder || "products";
  const random = options.randomSuffix || crypto.randomBytes(3).toString("hex");

  if (folder === "products") {
    const categorySlug = options.category ? slugifyStorageName(options.category) : "catalog";
    const baseName = options.productName
      ? slugifyStorageName(options.productName)
      : (options.originalFileName ? slugifyStorageName(options.originalFileName.replace(/\.[^/.]+$/, "")) : "") || "product";
    const roleSlug = slugifyStorageName(options.role || "hero");

    const fileName = `${baseName}-${roleSlug}-${random}.webp`;
    return {
      storagePath: `products/${categorySlug}/${fileName}`,
      fileName,
      folder: `products/${categorySlug}`,
    };
  }

  const sanitizedFolder = slugifyStorageName(folder) || "uploads";
  const assetSlug = options.productName
    ? slugifyStorageName(options.productName)
    : (options.originalFileName ? slugifyStorageName(options.originalFileName.replace(/\.[^/.]+$/, "")) : "") || "asset";
  const fileName = `${assetSlug}-${random}.webp`;
  return {
    storagePath: `${sanitizedFolder}/${fileName}`,
    fileName,
    folder: sanitizedFolder,
  };
}
