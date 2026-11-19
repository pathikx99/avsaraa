import "server-only";
import sharp from "sharp";

export interface OptimizedImageResult {
  buffer: Buffer;
  format: "webp";
  contentType: "image/webp";
  width?: number;
  height?: number;
  sizeBytes: number;
}

/**
 * Optimizes an uploaded product image:
 * - Downscales to max 1200x1600 (ideal for retina e-commerce PDP displays)
 * - Converts to modern, ultra-compact WebP format (typically 80KB-120KB)
 * - Strips all EXIF/metadata for privacy and footprint reduction
 */
export async function optimizeProductImage(
  inputBuffer: Buffer,
  maxWidth = 1200,
  maxHeight = 1600,
  quality = 82
): Promise<OptimizedImageResult> {
  const image = sharp(inputBuffer);
  const metadata = await image.metadata();

  const buffer = await image
    .rotate() // Auto-orient based on EXIF before stripping
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      quality,
      effort: 4,
      smartSubsample: true,
    })
    .toBuffer();

  const optimizedMeta = await sharp(buffer).metadata();

  return {
    buffer,
    format: "webp",
    contentType: "image/webp",
    width: optimizedMeta.width || metadata.width,
    height: optimizedMeta.height || metadata.height,
    sizeBytes: buffer.length,
  };
}

/**
 * Generates an ultra-compact swatch or catalog thumbnail (max 400x533, ~20KB-35KB).
 */
export async function optimizeThumbnail(
  inputBuffer: Buffer,
  maxWidth = 400,
  maxHeight = 533,
  quality = 80
): Promise<OptimizedImageResult> {
  return optimizeProductImage(inputBuffer, maxWidth, maxHeight, quality);
}
