import { test, describe } from "node:test";
import assert from "node:assert";
import {
  slugifyStorageName,
  buildOrganizedStoragePath,
} from "../../src/lib/imageOrganizer.ts";

describe("Cloudflare Media Organizer & Slugification Tests", () => {
  test("slugifyStorageName cleanly transforms complex titles, symbols, and accents", () => {
    assert.strictEqual(
      slugifyStorageName("Men's Wear"),
      "mens-wear"
    );
    assert.strictEqual(
      slugifyStorageName("Royal Banarasi Katan Silk Saree - Pure Zari (Gold Edition)"),
      "royal-banarasi-katan-silk-saree-pure-zari-gold-edition"
    );
    assert.strictEqual(
      slugifyStorageName("Co-ords & Luxury Drapes"),
      "co-ords-luxury-drapes"
    );
    assert.strictEqual(
      slugifyStorageName("  Crème Brûlée Dupatta  "),
      "creme-brulee-dupatta"
    );
    assert.strictEqual(
      slugifyStorageName("Special Offer 50% Off!"),
      "special-offer-50-off"
    );
  });

  test("buildOrganizedStoragePath structures hero product paths into category folders", () => {
    const result = buildOrganizedStoragePath({
      folder: "products",
      category: "Sarees",
      productName: "Crimson Banarasi Saree",
      role: "hero",
      randomSuffix: "a1b2c3",
    });

    assert.strictEqual(
      result.storagePath,
      "products/sarees/crimson-banarasi-saree-hero-a1b2c3.webp"
    );
    assert.strictEqual(result.fileName, "crimson-banarasi-saree-hero-a1b2c3.webp");
    assert.strictEqual(result.folder, "products/sarees");
  });

  test("buildOrganizedStoragePath correctly organizes multiple gallery angles", () => {
    const angle1 = buildOrganizedStoragePath({
      folder: "products",
      category: "Men's Wear",
      productName: "Raw Silk Bandhgala",
      role: "gallery-1",
      randomSuffix: "f4e5d6",
    });

    assert.strictEqual(
      angle1.storagePath,
      "products/mens-wear/raw-silk-bandhgala-gallery-1-f4e5d6.webp"
    );

    const angle2 = buildOrganizedStoragePath({
      folder: "products",
      category: "Men's Wear",
      productName: "Raw Silk Bandhgala",
      role: "gallery-2",
      randomSuffix: "987654",
    });

    assert.strictEqual(
      angle2.storagePath,
      "products/mens-wear/raw-silk-bandhgala-gallery-2-987654.webp"
    );
  });

  test("buildOrganizedStoragePath falls back to original file name when product name is empty", () => {
    const result = buildOrganizedStoragePath({
      folder: "products",
      category: "Dresses",
      originalFileName: "IMG_2026_Emerald_Anarkali.jpg",
      role: "hero",
      randomSuffix: "33aa11",
    });

    assert.strictEqual(
      result.storagePath,
      "products/dresses/img-2026-emerald-anarkali-hero-33aa11.webp"
    );
  });

  test("buildOrganizedStoragePath supports non-product asset folders (e.g., banners, lookbooks)", () => {
    const result = buildOrganizedStoragePath({
      folder: "banners",
      productName: "Diwali Royal Festive Campaign",
      randomSuffix: "c0ffee",
    });

    assert.strictEqual(
      result.storagePath,
      "banners/diwali-royal-festive-campaign-c0ffee.webp"
    );
    assert.strictEqual(result.folder, "banners");
  });
});
