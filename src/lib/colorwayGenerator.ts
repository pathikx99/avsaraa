import { ColorVariant } from "@/types/product";

export function slugifyColor(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

/**
 * Ensures that every color variant of a product has valid image references.
 * Preserves custom Cloudflare URLs or falls back to the product's base hero image.
 */
export function ensureColorwayImagesForProduct(
  baseHeroUrl: string,
  baseGalleryUrls: string[] = [],
  colorVariants: ColorVariant[] = []
): ColorVariant[] {
  if (!colorVariants || !Array.isArray(colorVariants) || colorVariants.length === 0) {
    return colorVariants;
  }

  const allBaseImages = Array.from(new Set([baseHeroUrl, ...(baseGalleryUrls || [])].filter(Boolean)));

  return colorVariants.map((variant) => {
    const primaryImg = variant.image_url || variant.primary_image || baseHeroUrl;
    const variantGallery = variant.gallery_images && variant.gallery_images.length > 0 ? variant.gallery_images : allBaseImages;

    // Sanitize sizes array if present
    const cleanSizes = Array.isArray(variant.sizes)
      ? variant.sizes
          .map((s) => ({
            size: String(s.size || "").trim(),
            stock: Math.max(0, Number(s.stock) || 0),
            ...(s.sku ? { sku: String(s.sku).trim() } : {}),
            ...(s.price ? { price: Number(s.price) } : {}),
          }))
          .filter((s) => s.size.length > 0)
      : undefined;

    const variantStock = cleanSizes && cleanSizes.length > 0
      ? cleanSizes.reduce((sum, s) => sum + s.stock, 0)
      : variant.stock !== undefined
      ? Math.max(0, Number(variant.stock) || 0)
      : undefined;

    return {
      ...variant,
      primary_image: primaryImg,
      image_url: primaryImg,
      gallery_images: variantGallery,
      ...(cleanSizes ? { sizes: cleanSizes } : {}),
      ...(variantStock !== undefined ? { stock: variantStock } : {}),
    };
  });
}
