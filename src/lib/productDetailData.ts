import { Product, ProductCategory, ColorVariant } from "@/types/product";
import { resolveProductImage } from "@/lib/productUtils";
import { supabase } from "@/lib/supabaseClient";
import { fetchCatalog } from "@/lib/useProductsCatalog";

export interface DetailedProduct extends Product {
  mrp: number;
  discount_percent: number;
  gallery_images: string[];
  cluster_origin?: string;
  artisan_hours?: number;
  fall_pico_included?: boolean;
  blouse_customization_available?: boolean;
  highlights: {
    icon: string;
    title: string;
    description: string;
  }[];
  available_sizes: string[];
  stock_status: "in_stock" | "low_stock" | "out_of_stock";
  stock_count: number;
  dispatch_time: string;
  specifications: {
    fabric: string;
    work: string;
    pattern: string;
    fit: string;
    occasion: string;
    set_includes: string;
    product_length: string;
    care_instructions: string;
    ghera_flare?: string;
    waistband?: string;
    collar_style?: string;
  };
  wash_care_bullets: string[];
}

export const SEED_CATALOG_PRODUCTS: DetailedProduct[] = [];

/**
 * Enriches a standard Product record with all luxury e-commerce specifications.
 */
export function enrichProductToDetailed(product: Product): DetailedProduct {
  const isSaree = product.category === "Sarees" || product.name.toLowerCase().includes("saree");
  const isMen = product.category === "Men's Wear" || product.name.toLowerCase().includes("men") || product.name.toLowerCase().includes("kurta pyjama");
  const isCoord = product.category === "Co-ords" || product.name.toLowerCase().includes("co-ord") || product.name.toLowerCase().includes("suit set");
  const isUnder1299 = product.price <= 1299;

  // Calculate MRP & Discount (honors explicit database values, falls back to standard markup)
  const fallbackMarkup = isUnder1299 ? 1.35 : isSaree ? 1.25 : 1.3;
  const calculatedMrp = Math.round(product.price * fallbackMarkup);
  const mrp = product.mrp && product.mrp > product.price ? product.mrp : calculatedMrp;
  const discount_percent =
    product.discount_percent !== undefined && product.discount_percent > 0
      ? product.discount_percent
      : Math.max(0, Math.round(((mrp - product.price) / mrp) * 100));

  // Gallery images with resolveProductImage
  const primaryImg = resolveProductImage(product.image_url);
  const gallery_images: string[] =
    product.gallery_images && product.gallery_images.length > 0
      ? product.gallery_images.map((img) => resolveProductImage(img))
      : [primaryImg];

  // Deduplicate gallery
  const uniqueGallery = Array.from(new Set(gallery_images));

  // Default highlights adapted to category
  const defaultHighlights = isSaree
    ? [
        { icon: "loom", title: "Pure Handloom Weave", description: "100% Certified Pure Silk" },
        { icon: "needle", title: "Artisanal Zari Work", description: "Intricate Antique Gold Weft" },
        { icon: "dress", title: "Regal 6-Yard Drape", description: "Sculpted Royal Silhouette" },
      ]
    : isMen
    ? [
        { icon: "loom", title: "Raw Silk & Linen", description: "Breathable Natural Loom" },
        { icon: "needle", title: "Mandarin Collar", description: "Hand-Finished Placket" },
        { icon: "dress", title: "Tailored Royal Cut", description: "Deep Concealed Pockets" },
      ]
    : isCoord
    ? [
        { icon: "loom", title: "Artisan Handblock", description: "100% Breathable Cotton" },
        { icon: "needle", title: "Coordinated Cut", description: "Versatile 3-Piece Ensemble" },
        { icon: "dress", title: "Comfort Waistband", description: "Elastic Back with Drawstring" },
      ]
    : isUnder1299
    ? [
        { icon: "loom", title: "100% Breathable Fabric", description: "Gentle on Sensitive Skin" },
        { icon: "needle", title: "Handblock Print", description: "Colorfast Natural Dyes" },
        { icon: "dress", title: "All-Day Comfort", description: "Tailored Relaxed Fit" },
      ]
    : [
        { icon: "loom", title: "Premium Chanderi", description: "Lustrous Weightless Feel" },
        { icon: "needle", title: "Artisan Detailing", description: "Handcrafted Zari Accents" },
        { icon: "dress", title: "Flattering Silhouette", description: "4.5m Flared Kalidar Ghera" },
      ];

  const highlights =
    Array.isArray(product.highlights) && product.highlights.length > 0
      ? product.highlights.map((h) => {
          if (typeof h === "string") {
            return { icon: "loom", title: h, description: "" };
          }
          return {
            icon: h.icon || "loom",
            title: h.title,
            description: h.description || "",
          };
        })
      : defaultHighlights;

  const available_sizes =
    product.available_sizes && product.available_sizes.length > 0
      ? product.available_sizes
      : isSaree
      ? ["Free Size (5.5m + 0.8m Blouse)"]
      : isMen
      ? ["38 (S)", "40 (M)", "42 (L)", "44 (XL)", "46 (XXL)"]
      : ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

  // Default specifications adapted to category
  const defaultSpecifications = isSaree
    ? {
        fabric: "Pure Handloom Silk & Chanderi Zari Blend",
        work: "Intricate Antique Gold Zari Kadhwa Weave & Handcrafted Border",
        pattern: "Heritage Floral Boota & Traditional Brocade Pallu",
        fit: "Classic 6-Yard Drape with Sculpted Fall",
        occasion: "Bridal Receptions, Weddings, Festive Ceremonies",
        set_includes: "1 Handloom Saree (5.5 Meters) + 1 Matching Blouse Piece (0.8 Meters)",
        product_length: "Saree: 5.5 Meters | Blouse Piece: 0.8 Meters | Width: 45 Inches",
        care_instructions: "Dry clean only. Iron on reverse low heat. Store wrapped in pure muslin cloth.",
      }
    : isMen
    ? {
        fabric: "Pure Indian Raw Silk & Handloom Linen Blend",
        work: "Minimalist Stitch Detailing & Mother-of-Pearl Buttons",
        pattern: "Self-Textured Slub Weave",
        fit: "Classic Straight Cut with Comfort Side Slits",
        occasion: "Festive Pujas, Wedding Sangeet, Ceremonial Gatherings",
        set_includes: "1 Royal Kurta + 1 Churidar Pyjama",
        product_length: "Kurta Length: 42 Inches | Pyjama Length: 40 Inches",
        care_instructions: "Dry clean recommended for first wash. Iron on medium heat.",
        collar_style: "Classic Mandarin / Nehru Collar with Concealed Placket",
      }
    : isCoord
    ? {
        fabric: "100% Breathable Cotton Slub & Handcrafted Chanderi",
        work: "Traditional Bagru Handblock Print & Lace Hem",
        pattern: "Artisanal Botanical Motifs",
        fit: "Relaxed Straight-Fit Top with Tapered Trousers",
        occasion: "Intimate Dinners, Daytime Festive, Contemporary Workwear",
        set_includes: "1 Kurta Top + 1 Trousers (with Deep Pockets) + 1 Cotton Mul Stole",
        product_length: "Top: 40 Inches | Bottoms: 37 Inches | Stole: 2.2 Meters",
        care_instructions: "Gentle machine wash cold. Wash dark colors separately. Line dry in shade.",
        waistband: "Semi-Elasticated Back with Drawstring Front & Dual Side Pockets",
      }
    : isUnder1299
    ? {
        fabric: "100% Breathable Cotton Slub & Handspun Linen",
        work: "Traditional Handblock Floral Print & Minimalist Stitching",
        pattern: "Artisanal Handblock Motif",
        fit: "Straight Cut Relaxed Comfort Fit",
        occasion: "Everyday Chic, Festive Lunches, Casual Gatherings",
        set_includes: "1 Handcrafted Kurta / Ensemble",
        product_length: "Kurta Length: 44 Inches | Sleeve Length: 17 Inches",
        care_instructions: "Gentle machine wash cold. Wash dark colors separately. Line dry in shade.",
      }
    : {
        fabric: "Pure Chanderi Silk Blend with Butter Crepe Lining",
        work: "Artisanal Metallic Foil Print, Mirror-Work & Gold Threading",
        pattern: "Contemporary Kalidar Flared Motif",
        fit: "Flared Anarkali Silhouette with Cinched Waist",
        occasion: "Festive Soirées, Cocktail Dinners, Family Celebrations",
        set_includes: "1 Flared Long Dress with Inbuilt Premium Lining",
        product_length: "Dress Length: 49 Inches | Sleeve Length: 18 Inches",
        care_instructions: "Dry clean recommended for first wash. Gentle cold hand wash thereafter.",
        ghera_flare: "4.5 Meters Full Kalidar Ghera Circumference",
      };

  // Merge custom specifications and root attributes (fabric, weave) so admin data is never lost
  const rawCustomSpecs = (product.specifications && typeof product.specifications === "object")
    ? (product.specifications as Record<string, string>)
    : {};
  const specifications = {
    ...defaultSpecifications,
    ...rawCustomSpecs,
    ...(product.fabric ? { fabric: product.fabric } : {}),
    ...(product.weave ? { work: product.weave } : {}),
  };

  const wash_care_bullets = isSaree
    ? [
        "Dry clean strictly recommended to preserve genuine zari thread shine.",
        "Never spray perfumes or alcohol-based fragrances directly onto zari.",
        "Store wrapped in breathable pure cotton or muslin cloth in a dry wardrobe.",
        "Air out the drape once every six months in indirect shade.",
      ]
    : [
        "Gentle hand wash or gentle cold machine wash using mild liquid detergent.",
        "Wash dark colors separately for the first two washes.",
        "Do not wring, soak, or dry in direct harsh sunlight.",
        "Warm iron on reverse side to maintain fabric texture.",
      ];

  const defaultClusterOrigin = isSaree
    ? "Artisan Zari Guild & Varanasi Weaving Cluster"
    : isMen
    ? "Gujarat Raw Silk Studio, India"
    : isCoord
    ? "Bagru & Sanganer Handblock Cluster"
    : "Avsaraa Handloom Collective";

  const cluster_origin =
    product.cluster_origin ||
    (typeof product.specifications?.cluster_origin === "string" ? product.specifications.cluster_origin : undefined) ||
    defaultClusterOrigin;

  const artisan_hours = isSaree ? 128 : isCoord ? 48 : isMen ? 56 : 64;

  const color_variants: ColorVariant[] =
    product.color_variants && product.color_variants.length > 0
      ? product.color_variants
      : [
          { name: "Original Edition", hex: "#261B13", image_url: primaryImg },
        ];

  return {
    ...product,
    image_url: primaryImg,
    mrp,
    discount_percent,
    gallery_images: uniqueGallery,
    cluster_origin,
    artisan_hours,
    fall_pico_included: isSaree,
    blouse_customization_available: false,
    highlights,
    available_sizes,
    stock_status: (product.stock_count !== undefined && product.stock_count <= 0) ? "out_of_stock" : "in_stock",
    stock_count: product.stock_count !== undefined ? product.stock_count : 5,
    size_inventory: product.size_inventory || (product.specifications?.size_inventory as Record<string, number> | undefined),
    dispatch_time: "Dispatched within 24–48 hours from Avsaraa Atelier",
    specifications,
    wash_care_bullets,
    color_variants,
    sku: product.sku || (typeof product.specifications?.sku === "string" ? product.specifications.sku : undefined),
    hsn_code: product.hsn_code || (typeof product.specifications?.hsn_code === "string" ? product.specifications.hsn_code : undefined),
  };
}

/**
 * Fetches a product by ID or human-friendly URL slug from cache / Supabase, or falls back to seed catalog.
 */
export async function fetchProductById(id: string): Promise<DetailedProduct | null> {
  const normalizedKey = (id || "").trim().toLowerCase();
  if (!normalizedKey) return null;

  // 1. Check in-memory catalog cache first on client (instant 0ms response!)
  if (typeof window !== "undefined") {
    try {
      const catalog = await fetchCatalog();
      const cachedMatch = catalog.find((p) =>
        p.id === id ||
        p.slug === id ||
        (p.sku && p.sku.toLowerCase() === normalizedKey) ||
        p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") === normalizedKey
      );
      if (cachedMatch) {
        return enrichProductToDetailed(cachedMatch);
      }
    } catch {
      // fallback to remote lookup
    }
  }

  // 2. Query Supabase (primary source of truth if not in memory)
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const isSkuCode = /^AVS-[A-Z]{3}-\d{4}-\d{4,}$/i.test(id.trim());
    if (isUuid) {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (data && !error) {
        return enrichProductToDetailed(data as Product);
      }
    } else if (isSkuCode) {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("specifications->>sku", id.trim().toUpperCase())
        .maybeSingle();

      if (data && !error) {
        return enrichProductToDetailed(data as Product);
      }
    } else {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .ilike("name", `%${id.replace(/-/g, " ")}%`)
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        return enrichProductToDetailed(data as Product);
      }
    }
  } catch (err) {
    console.warn("fetchProductById Supabase lookup notice:", err);
  }

  return null;
}

/**
 * Fetches related recommended products ("You May Also Like").
 */
export async function fetchRelatedProducts(
  currentId: string,
  category: ProductCategory,
  limit: number = 4
): Promise<DetailedProduct[]> {
  if (typeof window !== "undefined") {
    try {
      const catalog = await fetchCatalog();
      const related = catalog
        .filter((p) => p.id !== currentId && p.category === category)
        .slice(0, limit);
      if (related.length > 0) {
        return related.map(enrichProductToDetailed);
      }
    } catch {
      // ignore
    }
  }

  try {
    const { data } = await supabase
      .from("products")
      .select("*")
      .neq("id", currentId)
      .limit(limit);

    if (data && data.length > 0) {
      return data.map((p) => enrichProductToDetailed(p as Product));
    }
  } catch (err) {
    console.warn("fetchRelatedProducts notice:", err);
  }

  return [];
}

