import type { Product } from "../types/product.ts";
import { cleanDescription, normalizeProduct, resolveProductImage } from "./productUtils.ts";

export type MarketplaceChannel = "meta" | "google" | "amazon" | "myntra" | "ajio";

export interface CatalogFeedItem {
  id: string;
  item_group_id: string;
  title: string;
  description: string;
  availability: "in_stock" | "out_of_stock";
  condition: "new";
  price: string;
  sale_price: string;
  mrp_numeric: number;
  selling_price_numeric: number;
  stock_quantity: number;
  link: string;
  image_link: string;
  additional_image_link: string;
  brand: string;
  google_product_category: string;
  product_type: string;
  gender: "female" | "male" | "unisex";
  age_group: "adult";
  color: string;
  size: string;
  material: string;
  pattern: string;
  mpn: string;
  identifier_exists: "false";
  custom_label_0: string;
  custom_label_1: string;
  custom_label_2: string;
  shipping_weight: string;
  highlights: string[];
  raw_image_links: string[];
}

const GOOGLE_CATEGORY_MAP: Record<string, string> = {
  Sarees: "Apparel & Accessories > Clothing > Traditional & Ceremonial Clothing > Saris",
  Dresses: "Apparel & Accessories > Clothing > Dresses",
  "Co-ords": "Apparel & Accessories > Clothing > Outfits",
  "Men's Wear": "Apparel & Accessories > Clothing > Shirts & Tops",
  "New Arrivals": "Apparel & Accessories > Clothing",
  "Occasion Wear": "Apparel & Accessories > Clothing > Traditional & Ceremonial Clothing",
};

const DEFAULT_HSN_MAP: Record<string, string> = {
  Sarees: "5007",
  Dresses: "6204",
  "Co-ords": "6204",
  "Men's Wear": "6205",
  "New Arrivals": "6204",
  "Occasion Wear": "6204",
};

function toAbsoluteUrl(urlOrPath: string, siteUrl: string): string {
  const cleanSite = siteUrl.replace(/\/+$/, "");
  const resolved = resolveProductImage(urlOrPath);
  if (/^https?:\/\//i.test(resolved)) return resolved;
  if (resolved.startsWith("/")) return `${cleanSite}${resolved}`;
  return `${cleanSite}/${resolved}`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapeCsvCell(value: unknown): string {
  let str = String(value ?? "").replace(/\r\n|\r|\n/g, " ");
  // Guard against spreadsheet formula injection on text cells
  if (/^[=+\-@\t]/.test(str)) {
    str = `'${str}`;
  }
  if (str.includes('"') || str.includes(",")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildFallbackDescription(product: Product): string {
  const cleaned = cleanDescription(product.description);
  if (cleaned) return cleaned;
  const parts = [
    product.name,
    product.category ? `from AVSARAA's ${product.category} collection` : "from AVSARAA",
    product.fabric ? `crafted in ${product.fabric}` : "",
    product.weave ? `featuring ${product.weave}` : "",
    "Handcrafted in India with 7-day exchange guarantee.",
  ].filter(Boolean);
  return parts.join(" — ");
}

function buildVariantSuffix(colorName: string, sizeName: string, includeColor: boolean, includeSize: boolean): string {
  const parts: string[] = [];
  if (includeColor && colorName) {
    parts.push(colorName.replace(/[^a-zA-Z0-9]+/g, "").toUpperCase().slice(0, 8));
  }
  if (includeSize && sizeName) {
    parts.push(sizeName.replace(/[^a-zA-Z0-9]+/g, "").toUpperCase().slice(0, 8));
  }
  return parts.length > 0 ? `-${parts.join("-")}` : "";
}

function getStockForSize(product: Product, sizeName: string): number {
  const specInv = (product.specifications as Record<string, unknown> | undefined)?.size_inventory as
    | Record<string, number>
    | undefined;
  const sizeInv = product.size_inventory || specInv;
  if (sizeInv && typeof sizeInv === "object") {
    if (sizeInv[sizeName] !== undefined) return Math.max(0, Number(sizeInv[sizeName]) || 0);
    const matchedKey = Object.keys(sizeInv).find(
      (k) => k.trim().toLowerCase() === sizeName.trim().toLowerCase()
    );
    if (matchedKey) return Math.max(0, Number(sizeInv[matchedKey]) || 0);
  }
  return typeof product.stock_count === "number" ? Math.max(0, product.stock_count) : 5;
}

/**
 * Expands published catalog products (and their color/size variants) into normalized feed rows.
 */
export function expandCatalogRows(
  rawProducts: Product[],
  siteUrl = "https://avsaraa.in"
): CatalogFeedItem[] {
  const cleanSite = siteUrl.replace(/\/+$/, "");
  const rows: CatalogFeedItem[] = [];

  for (const raw of rawProducts) {
    const publishStatus = (raw as { publish_status?: string | null }).publish_status;
    if (publishStatus && publishStatus !== "published") {
      continue;
    }

    const product = normalizeProduct(raw);
    const parentSku = product.sku || product.id;
    const baseLink = `${cleanSite}/products/${encodeURIComponent(product.id)}`;
    const sellingPrice = Math.max(0, Number(product.price) || 0);
    const mrpPrice = product.mrp && Number(product.mrp) > sellingPrice ? Number(product.mrp) : sellingPrice;
    const hasSale = mrpPrice > sellingPrice;

    const specs = (product.specifications || {}) as Record<string, unknown>;
    const fabric =
      product.fabric ||
      (typeof specs.fabric === "string" ? specs.fabric : "") ||
      (product.category === "Sarees" ? "Pure Handloom Silk" : "Handcrafted Cotton & Silk Blend");
    const weave =
      product.weave ||
      (typeof specs.work === "string" ? specs.work : "") ||
      "Artisanal Handcrafted";
    const hsn =
      product.hsn_code ||
      (typeof specs.hsn_code === "string" ? specs.hsn_code : "") ||
      DEFAULT_HSN_MAP[product.category] ||
      "6204";
    const origin = product.country_of_origin || "India";
    const gender: "female" | "male" | "unisex" = product.category === "Men's Wear" ? "male" : "female";
    const description = buildFallbackDescription(product);
    const promoTag =
      (product.occasion_tags && product.occasion_tags[0]) ||
      (hasSale ? "On Sale" : "Handloom Collection");

    const baseGallery = Array.isArray(product.gallery_images)
      ? product.gallery_images.map((u) => toAbsoluteUrl(u, cleanSite))
      : [];
    const primaryUrl = toAbsoluteUrl(product.image_url, cleanSite);
    const baseAdditionalImages = Array.from(new Set(baseGallery)).filter((u) => u !== primaryUrl);

    const highlights = Array.isArray(product.highlights)
      ? product.highlights.map((h) => (typeof h === "string" ? h : `${h.title}${h.description ? `: ${h.description}` : ""}`))
      : [];

    const shippingWeight =
      product.shipping_weight_grams || product.weight_grams
        ? `${product.shipping_weight_grams || product.weight_grams} g`
        : product.category === "Sarees"
        ? "650 g"
        : "500 g";

    const colors =
      Array.isArray(product.color_variants) && product.color_variants.length > 0
        ? product.color_variants
        : [{ name: "Original Edition", hex: "#261B13", image_url: primaryUrl }];

    const defaultSizes =
      Array.isArray(product.available_sizes) && product.available_sizes.length > 0
        ? product.available_sizes
        : ["Free Size"];

    const hasMultipleColors = colors.length > 1;

    for (const color of colors) {
      const colorImage = toAbsoluteUrl(
        color.primary_image || color.image_url || primaryUrl,
        cleanSite
      );
      const colorGallery = Array.isArray(color.gallery_images)
        ? color.gallery_images.map((u) => toAbsoluteUrl(u, cleanSite))
        : baseAdditionalImages;
      const additionalList = Array.from(new Set([...colorGallery, ...baseAdditionalImages]))
        .filter((u) => u && u !== colorImage)
        .slice(0, 10);

      const sizesToExpand: Array<{ size: string; stock: number; sku?: string }> =
        Array.isArray(color.sizes) && color.sizes.length > 0
          ? color.sizes
          : defaultSizes.map((sz) => ({
              size: sz,
              stock:
                typeof color.stock === "number"
                  ? Math.max(0, color.stock)
                  : getStockForSize(product, sz),
            }));

      const hasMultipleSizes = sizesToExpand.length > 1;

      for (const sizeEntry of sizesToExpand) {
        const sizeLabel = sizeEntry.size || "Free Size";
        const stockQty = Math.max(0, Number(sizeEntry.stock) || 0);
        const variantSuffix = buildVariantSuffix(
          color.name || "Standard",
          sizeLabel,
          hasMultipleColors,
          hasMultipleSizes
        );
        const variantId = sizeEntry.sku || `${parentSku}${variantSuffix}`;
        const variantTitle = [
          product.name,
          hasMultipleColors ? color.name : "",
          hasMultipleSizes ? sizeLabel : "",
        ]
          .filter(Boolean)
          .join(" - ");

        rows.push({
          id: variantId,
          item_group_id: parentSku,
          title: variantTitle,
          description,
          availability: stockQty > 0 ? "in_stock" : "out_of_stock",
          condition: "new",
          price: `${mrpPrice.toFixed(2)} INR`,
          sale_price: hasSale ? `${sellingPrice.toFixed(2)} INR` : "",
          mrp_numeric: mrpPrice,
          selling_price_numeric: sellingPrice,
          stock_quantity: stockQty,
          link: baseLink,
          image_link: colorImage,
          additional_image_link: additionalList.join(","),
          brand: "AVSARAA",
          google_product_category:
            GOOGLE_CATEGORY_MAP[product.category] || "Apparel & Accessories > Clothing",
          product_type: product.category,
          gender,
          age_group: "adult",
          color: color.name || "Original Edition",
          size: sizeLabel,
          material: fabric,
          pattern: weave,
          mpn: variantId,
          identifier_exists: "false",
          custom_label_0: promoTag,
          custom_label_1: hsn,
          custom_label_2: origin,
          shipping_weight: shippingWeight,
          highlights,
          raw_image_links: [colorImage, ...additionalList],
        });
      }
    }
  }

  return rows;
}

/**
 * Generates an RSS 2.0 XML Product Feed compatible with Meta Commerce Manager & Google Merchant Center.
 */
export function buildGoogleMetaXmlFeed(
  products: Product[],
  siteUrl = "https://avsaraa.in"
): string {
  const cleanSite = siteUrl.replace(/\/+$/, "");
  const rows = expandCatalogRows(products, cleanSite);

  const itemsXml = rows
    .map((item) => {
      const additionalTags = item.raw_image_links
        .slice(1, 11)
        .map((url) => `      <g:additional_image_link>${escapeXml(url)}</g:additional_image_link>`)
        .join("\n");

      return [
        "    <item>",
        `      <g:id>${escapeXml(item.id)}</g:id>`,
        `      <g:item_group_id>${escapeXml(item.item_group_id)}</g:item_group_id>`,
        `      <g:title>${escapeXml(item.title)}</g:title>`,
        `      <g:description>${escapeXml(item.description)}</g:description>`,
        `      <g:link>${escapeXml(item.link)}</g:link>`,
        `      <g:image_link>${escapeXml(item.image_link)}</g:image_link>`,
        ...(additionalTags ? [additionalTags] : []),
        `      <g:availability>${item.availability}</g:availability>`,
        `      <g:condition>${item.condition}</g:condition>`,
        `      <g:price>${escapeXml(item.price)}</g:price>`,
        ...(item.sale_price ? [`      <g:sale_price>${escapeXml(item.sale_price)}</g:sale_price>`] : []),
        `      <g:brand>${escapeXml(item.brand)}</g:brand>`,
        `      <g:google_product_category>${escapeXml(item.google_product_category)}</g:google_product_category>`,
        `      <g:product_type>${escapeXml(item.product_type)}</g:product_type>`,
        `      <g:gender>${item.gender}</g:gender>`,
        `      <g:age_group>${item.age_group}</g:age_group>`,
        `      <g:color>${escapeXml(item.color)}</g:color>`,
        `      <g:size>${escapeXml(item.size)}</g:size>`,
        `      <g:material>${escapeXml(item.material)}</g:material>`,
        `      <g:pattern>${escapeXml(item.pattern)}</g:pattern>`,
        `      <g:mpn>${escapeXml(item.mpn)}</g:mpn>`,
        `      <g:identifier_exists>${item.identifier_exists}</g:identifier_exists>`,
        `      <g:shipping_weight>${escapeXml(item.shipping_weight)}</g:shipping_weight>`,
        `      <g:custom_label_0>${escapeXml(item.custom_label_0)}</g:custom_label_0>`,
        `      <g:custom_label_1>${escapeXml(item.custom_label_1)}</g:custom_label_1>`,
        `      <g:custom_label_2>${escapeXml(item.custom_label_2)}</g:custom_label_2>`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">',
    "  <channel>",
    "    <title>AVSARAA Product Catalog</title>",
    `    <link>${escapeXml(cleanSite)}</link>`,
    "    <description>AVSARAA handcrafted sarees, dresses, and Indian ethnic wear catalog feed</description>",
    itemsXml,
    "  </channel>",
    "</rss>",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Generates a CSV Catalog Feed directly importable via scheduled URL in Meta Commerce Manager & Google Merchant Center.
 */
export function buildMetaGoogleCsvFeed(
  products: Product[],
  siteUrl = "https://avsaraa.in"
): string {
  const rows = expandCatalogRows(products, siteUrl);
  const headers = [
    "id",
    "item_group_id",
    "title",
    "description",
    "availability",
    "condition",
    "price",
    "sale_price",
    "link",
    "image_link",
    "additional_image_link",
    "brand",
    "google_product_category",
    "product_type",
    "gender",
    "age_group",
    "color",
    "size",
    "material",
    "pattern",
    "mpn",
    "identifier_exists",
    "shipping_weight",
    "custom_label_0",
    "custom_label_1",
    "custom_label_2",
  ];

  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.id,
        r.item_group_id,
        r.title,
        r.description,
        r.availability,
        r.condition,
        r.price,
        r.sale_price,
        r.link,
        r.image_link,
        r.additional_image_link,
        r.brand,
        r.google_product_category,
        r.product_type,
        r.gender,
        r.age_group,
        r.color,
        r.size,
        r.material,
        r.pattern,
        r.mpn,
        r.identifier_exists,
        r.shipping_weight,
        r.custom_label_0,
        r.custom_label_1,
        r.custom_label_2,
      ]
        .map(escapeCsvCell)
        .join(",")
    ),
  ];

  return lines.join("\n");
}

/**
 * Generates marketplace-ready CSV bulk sheets for Amazon Seller Central, Myntra Partner Portal, and Ajio Seller Portal.
 */
export function buildMarketplaceCsvExport(
  products: Product[],
  siteUrl: string,
  channel: "amazon" | "myntra" | "ajio"
): string {
  const rows = expandCatalogRows(products, siteUrl);

  if (channel === "amazon") {
    const headers = [
      "item_sku",
      "parent_sku",
      "brand_name",
      "item_name",
      "product_description",
      "feed_product_type",
      "standard_price",
      "sale_price",
      "list_price_with_tax",
      "quantity",
      "color_name",
      "size_name",
      "material_type",
      "pattern_type",
      "department_name",
      "hsn_code",
      "country_of_origin",
      "main_image_url",
      "other_image_url1",
      "other_image_url2",
      "other_image_url3",
      "bullet_point1",
      "bullet_point2",
      "bullet_point3",
      "external_url",
    ];
    return [
      headers.join(","),
      ...rows.map((r) =>
        [
          r.id,
          r.item_group_id,
          r.brand,
          r.title,
          r.description,
          r.product_type === "Sarees" ? "saree" : r.product_type === "Men's Wear" ? "kurta" : "dress",
          r.selling_price_numeric.toFixed(2),
          r.sale_price ? r.selling_price_numeric.toFixed(2) : "",
          r.mrp_numeric.toFixed(2),
          r.stock_quantity,
          r.color,
          r.size,
          r.material,
          r.pattern,
          r.gender === "male" ? "Mens" : "Womens",
          r.custom_label_1,
          r.custom_label_2,
          r.raw_image_links[0] || "",
          r.raw_image_links[1] || "",
          r.raw_image_links[2] || "",
          r.raw_image_links[3] || "",
          r.highlights[0] || `Material: ${r.material}`,
          r.highlights[1] || `Craftsmanship: ${r.pattern}`,
          r.highlights[2] || "7-Day Exchange Guarantee (No Refunds)",
          r.link,
        ]
          .map(escapeCsvCell)
          .join(",")
      ),
    ].join("\n");
  }

  if (channel === "myntra") {
    const headers = [
      "vendor_sku_code",
      "style_id",
      "brand",
      "article_type",
      "product_title",
      "product_description",
      "gender",
      "size",
      "color",
      "fabric",
      "pattern",
      "mrp",
      "selling_price",
      "stock_count",
      "hsn_code",
      "country_of_origin",
      "front_image_url",
      "additional_image_urls",
      "product_url",
    ];
    return [
      headers.join(","),
      ...rows.map((r) =>
        [
          r.id,
          r.item_group_id,
          r.brand,
          r.product_type,
          r.title,
          r.description,
          r.gender === "male" ? "Men" : "Women",
          r.size,
          r.color,
          r.material,
          r.pattern,
          r.mrp_numeric.toFixed(2),
          r.selling_price_numeric.toFixed(2),
          r.stock_quantity,
          r.custom_label_1,
          r.custom_label_2,
          r.image_link,
          r.additional_image_link,
          r.link,
        ]
          .map(escapeCsvCell)
          .join(",")
      ),
    ].join("\n");
  }

  // Ajio Seller Portal format
  const headers = [
    "seller_sku",
    "style_code",
    "brand_name",
    "category",
    "item_title",
    "description",
    "gender",
    "size",
    "colour",
    "fabric_composition",
    "weave_craft",
    "mrp_inr",
    "offer_price_inr",
    "inventory_qty",
    "hsn_sac",
    "country_of_origin",
    "primary_image_url",
    "gallery_image_urls",
    "source_url",
  ];
  return [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.id,
        r.item_group_id,
        r.brand,
        r.product_type,
        r.title,
        r.description,
        r.gender === "male" ? "Men" : "Women",
        r.size,
        r.color,
        r.material,
        r.pattern,
        r.mrp_numeric.toFixed(2),
        r.selling_price_numeric.toFixed(2),
        r.stock_quantity,
        r.custom_label_1,
        r.custom_label_2,
        r.image_link,
        r.additional_image_link,
        r.link,
      ]
        .map(escapeCsvCell)
        .join(",")
    ),
  ].join("\n");
}
