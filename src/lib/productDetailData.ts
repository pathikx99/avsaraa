import { Product, ProductCategory, ColorVariant } from "@/types/product";
import { resolveProductImage, formatINR } from "@/lib/productUtils";
import { supabase } from "@/lib/supabaseClient";

export interface DetailedProduct extends Product {
  mrp: number;
  discount_percent: number;
  gallery_images: string[];
  video_url?: string;
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

/**
 * Seeded catalog fallback products to ensure instant, reliable loading
 * even if Supabase is initializing or an item is accessed by mock/seed ID.
 */
export const SEED_CATALOG_PRODUCTS: DetailedProduct[] = [
  {
    id: "e0000000-0000-0000-0000-000000000001",
    name: "Royal Banarasi Katan Silk Saree",
    category: "Sarees",
    price: 24999,
    mrp: 32500,
    discount_percent: 23,
    image_url: "/images/banarasi_silk_saree.jpg",
    gallery_images: [
      "/images/banarasi_silk_saree.jpg",
      "/images/handloom_silk_saree.jpg",
      "/images/occasion_traditional.jpg",
      "/images/occasion_wedding.jpg",
    ],
    video_url: "https://www.youtube.com/embed/5mGUdDq42iI",
    description: "Pure mulberry Katan silk handwoven on traditional Varanasi handlooms with intricate real zari kadhwa floral jaal and a regal gold brocade pallu.",
    color_variants: [
      { name: "Crimson Red", hex: "#8A181A", image_url: "/images/banarasi_silk_saree.jpg" },
      { name: "Royal Emerald", hex: "#1C4D35", image_url: "/images/handloom_silk_saree.jpg" },
      { name: "Rani Pink", hex: "#B8255F", image_url: "/images/occasion_wedding.jpg" },
    ],
    highlights: [
      { icon: "loom", title: "Pure Handloom Weave", description: "100% Certified Katan Silk" },
      { icon: "needle", title: "Real Zari Kadhwa", description: "Intricate Antique Gold Weft" },
      { icon: "dress", title: "Regal 6-Yard Drape", description: "Sculpted Heirloom Weight" },
    ],
    available_sizes: ["Free Size (5.5m + 0.8m Blouse)"],
    stock_status: "in_stock",
    stock_count: 4,
    dispatch_time: "Dispatched within 24–48 hours from Surat Atelier",
    specifications: {
      fabric: "Pure Mulberry Katan Silk (Handloom Certified)",
      work: "Intricate Antique Gold Zari Kadhwa Weave & Handwoven Floral Jaal",
      pattern: "Traditional Royal Floral Boota & Ornate Brocade Border",
      fit: "Classic 6-Yard Drape with Sculpted Fall",
      occasion: "Bridal Receptions, Weddings, Traditional Ceremonies",
      set_includes: "1 Saree (5.5 Meters) + 1 Unstitched Matching Blouse Piece (0.8 Meters)",
      product_length: "Saree: 5.5 Meters | Blouse: 0.8 Meters | Width: 45 Inches",
      care_instructions: "Dry clean only. Iron on low heat on reverse side. Store wrapped in pure muslin.",
    },
    wash_care_bullets: [
      "Dry clean strictly recommended to preserve genuine zari thread shine.",
      "Never spray perfumes or deodorants directly onto gold zari borders.",
      "Store wrapped in breathable cotton or muslin cloth in a dry wardrobe.",
      "Air out the drape once every six months in indirect shade.",
    ],
  },
  {
    id: "e0000000-0000-0000-0000-000000000004",
    name: "Festive Chanderi Foil Print Dress",
    category: "Dresses",
    price: 12500,
    mrp: 16900,
    discount_percent: 26,
    image_url: "/images/festive_chanderi_dress.jpg",
    gallery_images: [
      "/images/festive_chanderi_dress.jpg",
      "/images/royal_occasion_dress.jpg",
      "/images/occasion_festive.jpg",
      "/images/botanical_flowers.jpg",
    ],
    video_url: "https://www.youtube.com/embed/5mGUdDq42iI",
    description: "Contemporary silhouette crafted from lightweight Chanderi weave featuring artisanal metallic foil accents, soft inner lining, and a flowing flared hem.",
    color_variants: [
      { name: "Festive Gold", hex: "#D4AF37", image_url: "/images/festive_chanderi_dress.jpg" },
      { name: "Deep Ruby", hex: "#7B1113", image_url: "/images/royal_occasion_dress.jpg" },
      { name: "Ivory Pearl", hex: "#F3ECE1", image_url: "/images/occasion_festive.jpg" },
    ],
    highlights: [
      { icon: "loom", title: "Pure Chanderi Silk", description: "Weightless Breathable Sheen" },
      { icon: "needle", title: "Hand-Applied Foil", description: "Artisanal Metallic Accents" },
      { icon: "dress", title: "Flared Kalidar Cut", description: "All-Day Tailored Comfort" },
    ],
    available_sizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
    stock_status: "in_stock",
    stock_count: 7,
    dispatch_time: "Dispatched within 24 hours from Surat Atelier",
    specifications: {
      fabric: "Pure Chanderi Silk Blend with Soft Butter Crepe Lining",
      work: "Artisanal Metallic Gold Foil Print & Micro-Sequin Yoke",
      pattern: "Contemporary Kalidar Flared Motif",
      fit: "Flared Anarkali Silhouette with Cinched Waist",
      occasion: "Festive Soirées, Diwali Celebrations, Evening Gatherings",
      set_includes: "1 Flared Long Dress with Inbuilt Lining",
      product_length: "Dress Length: 49 Inches | Sleeve Length: 18 Inches",
      care_instructions: "Dry clean recommended for first two washes. Hand wash cold separately.",
    },
    wash_care_bullets: [
      "Dry clean recommended for first wash to set foil finish.",
      "Hand wash gently in cold water using mild detergent.",
      "Do not scrub, twist, or bleach metallic foil motifs.",
      "Iron inside-out on low heat setting.",
    ],
  },
  {
    id: "e0000000-0000-0000-0000-000000000002",
    name: "Emerald Organza Embroidered Saree",
    category: "Sarees",
    price: 18450,
    mrp: 23900,
    discount_percent: 23,
    image_url: "/images/royal_organza_saree.jpg",
    gallery_images: [
      "/images/royal_organza_saree.jpg",
      "/images/occasion_party.jpg",
      "/images/handloom_silk_saree.jpg",
      "/images/occasion_wedding.jpg",
    ],
    video_url: "https://www.youtube.com/embed/5mGUdDq42iI",
    description: "Whisper-light handloom organza saree in deep emerald adorned with scalloped hand-cut resham embroidery and delicate badla zari accents.",
    color_variants: [
      { name: "Deep Emerald", hex: "#0E4731", image_url: "/images/royal_organza_saree.jpg" },
      { name: "Powder Blue", hex: "#8DA7B8", image_url: "/images/occasion_party.jpg" },
      { name: "Dusty Peach", hex: "#D99B82", image_url: "/images/occasion_wedding.jpg" },
    ],
    highlights: [
      { icon: "loom", title: "Handloom Sheer Organza", description: "Weightless Sculptural Drape" },
      { icon: "needle", title: "Scalloped Cutwork", description: "Intricate Badla & Resham" },
      { icon: "dress", title: "Cocktail Silhouette", description: "Graceful Fluid Movement" },
    ],
    available_sizes: ["Free Size (5.5m + 0.8m Blouse)"],
    stock_status: "in_stock",
    stock_count: 3,
    dispatch_time: "Dispatched within 24–48 hours from Surat Atelier",
    specifications: {
      fabric: "Pure Sheer Handloom Organza Silk",
      work: "Hand-cut Scalloped Resham Border with Micro-Zari Highlights",
      pattern: "Minimalist Scattered Floral Motifs",
      fit: "Lightweight Sculptural Drape",
      occasion: "Cocktail Dinners, Wedding Guest, Evening Receptions",
      set_includes: "1 Saree (5.5 Meters) + 1 Heavy Embroidered Blouse Piece (0.8 Meters)",
      product_length: "Saree: 5.5 Meters | Blouse: 0.8 Meters | Width: 44 Inches",
      care_instructions: "Dry clean only. Roll-press recommended for organza pleats.",
    },
    wash_care_bullets: [
      "Dry clean only. Store on wide padded hangers.",
      "Do not spray perfume directly onto delicate organza sheer.",
      "Steam iron or roll-press on low temperature.",
    ],
  },
  {
    id: "e1000000-0000-0000-0000-000000000003",
    name: "Indigo Floral Handblock Printed Suit Set",
    category: "Dresses",
    price: 1299,
    mrp: 1899,
    discount_percent: 32,
    image_url: "/images/product_suit_under1299.jpg",
    gallery_images: [
      "/images/product_suit_under1299.jpg",
      "/images/product_kurta_under1299.jpg",
      "/images/occasion_everyday.jpg",
      "/images/botanical_flowers.jpg",
    ],
    video_url: "https://www.youtube.com/embed/5mGUdDq42iI",
    description: "Breathable pure cotton slub suit set in deep indigo blue, featuring traditional handblock botanical motifs, comfortable straight-fit trousers, and matching lightweight stole.",
    color_variants: [
      { name: "Indigo Blue", hex: "#233D60", image_url: "/images/product_suit_under1299.jpg" },
      { name: "Earthy Sage", hex: "#6A7B69", image_url: "/images/product_kurta_under1299.jpg" },
    ],
    highlights: [
      { icon: "loom", title: "100% Breathable Cotton", description: "Skin-Friendly Cotton Slub" },
      { icon: "needle", title: "Artisan Handblock", description: "Natural Fast Dyes" },
      { icon: "dress", title: "All-Day Comfort Fit", description: "Easy Care & Versatile" },
    ],
    available_sizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
    stock_status: "in_stock",
    stock_count: 12,
    dispatch_time: "Dispatched within 24 hours from Surat Atelier",
    specifications: {
      fabric: "100% Breathable Pure Cotton Slub",
      work: "Authentic Bagru Handblock Botanical Print",
      pattern: "Traditional Indigo Floral Motif",
      fit: "Straight Cut Kurta with Relaxed Comfort Trousers",
      occasion: "Everyday Workwear, Daytime Gatherings, Casual Outings",
      set_includes: "1 Kurta + 1 Pair of Trousers + 1 Cotton Mul Stole",
      product_length: "Kurta Length: 44 Inches | Trouser Length: 38 Inches",
      care_instructions: "Gentle machine wash cold. Wash dark colors separately. Line dry in shade.",
    },
    wash_care_bullets: [
      "Machine wash cold on gentle cycle or hand wash.",
      "Wash dark shades separately for initial washes.",
      "Use mild liquid detergent; avoid bleach or harsh scrubbers.",
      "Warm iron on reverse side.",
    ],
  },
  {
    id: "e1000000-0000-0000-0000-000000000009",
    name: "Sage Minimalist Linen Everyday Kurta",
    category: "Dresses",
    price: 1250,
    mrp: 1750,
    discount_percent: 29,
    image_url: "/images/product_kurta_under1299.jpg",
    gallery_images: [
      "/images/product_kurta_under1299.jpg",
      "/images/product_kurti_under1299.jpg",
      "/images/occasion_everyday.jpg",
    ],
    video_url: "https://www.youtube.com/embed/5mGUdDq42iI",
    description: "Minimalist hand-spun linen kurta in soothing sage green. Tailored with a relaxed silhouette, side slits, and mother-of-pearl button detailing for effortless everyday elegance.",
    color_variants: [
      { name: "Sage Green", hex: "#7E8C78", image_url: "/images/product_kurta_under1299.jpg" },
      { name: "Natural Ivory", hex: "#EBE3D5", image_url: "/images/product_kurti_under1299.jpg" },
    ],
    highlights: [
      { icon: "loom", title: "Pure Handloom Linen", description: "Naturally Breathable Fiber" },
      { icon: "needle", title: "Minimalist Detailing", description: "Mother-of-Pearl Buttons" },
      { icon: "dress", title: "Effortless Comfort", description: "Easy Drape Everyday Fit" },
    ],
    available_sizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
    stock_status: "in_stock",
    stock_count: 9,
    dispatch_time: "Dispatched within 24 hours from Surat Atelier",
    specifications: {
      fabric: "Pure Handloom Linen & Breathable Cotton Blend",
      work: "Minimalist Stitch Detailing & Mother-of-Pearl Accents",
      pattern: "Solid Organic Slub Texture",
      fit: "Relaxed Straight Cut with Side Slits",
      occasion: "Daily Wear, Office Meetings, Casual Brunches",
      set_includes: "1 Handcrafted Everyday Kurta",
      product_length: "Kurta Length: 43 Inches | Sleeve Length: 17 Inches",
      care_instructions: "Gentle hand wash or gentle machine wash cold. Warm iron while slightly damp.",
    },
    wash_care_bullets: [
      "Machine wash cold with mild detergent.",
      "Dry flat in shade to retain linen fiber crispness.",
      "Iron while slightly damp on medium-high heat.",
    ],
  },
];

/**
 * Enriches a standard Product record with all luxury e-commerce specifications.
 */
export function enrichProductToDetailed(product: Product): DetailedProduct {
  const isSaree = product.category === "Sarees" || product.name.toLowerCase().includes("saree");
  const isMen = product.category === "Men's Wear" || product.name.toLowerCase().includes("men") || product.name.toLowerCase().includes("kurta pyjama");
  const isCoord = product.category === "Co-ords" || product.name.toLowerCase().includes("co-ord") || product.name.toLowerCase().includes("suit set");
  const isUnder1299 = product.price <= 1299;

  // Calculate MRP & Discount
  const markup = isUnder1299 ? 1.35 : isSaree ? 1.25 : 1.3;
  const mrp = Math.round(product.price * markup);
  const discount_percent = Math.round(((mrp - product.price) / mrp) * 100);

  // Gallery images with high-res fallbacks
  const primaryImg = resolveProductImage(product.image_url);
  const gallery_images: string[] = [primaryImg];

  if (isSaree) {
    gallery_images.push(
      "/images/handloom_silk_saree.jpg",
      "/images/occasion_traditional.jpg",
      "/images/occasion_wedding.jpg"
    );
  } else if (isUnder1299) {
    gallery_images.push(
      "/images/product_suit_under1299.jpg",
      "/images/product_kurta_under1299.jpg",
      "/images/product_dupatta_under1299.jpg"
    );
  } else if (isMen) {
    gallery_images.push(
      "/images/occasion_traditional.jpg",
      "/images/occasion_everyday.jpg",
      "/images/occasion_party.jpg"
    );
  } else {
    gallery_images.push(
      "/images/royal_occasion_dress.jpg",
      "/images/festive_chanderi_dress.jpg",
      "/images/occasion_festive.jpg"
    );
  }

  // Deduplicate gallery
  const uniqueGallery = Array.from(new Set(gallery_images));

  // Highlights adapted to category
  const highlights = isSaree
    ? [
        { icon: "loom", title: "Pure Handloom Weave", description: "100% Certified Heirloom Silk" },
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

  const available_sizes = isSaree
    ? ["Free Size (5.5m + 0.8m Blouse)"]
    : isMen
    ? ["38 (S)", "40 (M)", "42 (L)", "44 (XL)", "46 (XXL)"]
    : ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

  // Specifications adapted to category
  const specifications = isSaree
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
        fabric: "Pure Surat Raw Silk & Handloom Linen Blend",
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

  const cluster_origin = isSaree
    ? "Surat Zari Guild & Varanasi Weaving Cluster"
    : isMen
    ? "Surat Raw Silk Atelier, Gujarat"
    : isCoord
    ? "Bagru & Sanganer Handblock Cluster"
    : "Surat Handloom Collective";

  const artisan_hours = isSaree ? 128 : isCoord ? 48 : isMen ? 56 : 64;

  const color_variants: ColorVariant[] =
    product.color_variants && product.color_variants.length > 0
      ? product.color_variants
      : [
          { name: "Royal Edition", hex: "#261B13", image_url: primaryImg },
          { name: "Ivory Cream", hex: "#F3ECE1", image_url: "/images/handloom_silk_saree.jpg" },
          { name: "Crimson Red", hex: "#8A181A", image_url: "/images/occasion_wedding.jpg" },
        ];

  return {
    ...product,
    image_url: primaryImg,
    mrp,
    discount_percent,
    gallery_images: uniqueGallery,
    video_url: "https://www.youtube.com/embed/5mGUdDq42iI",
    cluster_origin,
    artisan_hours,
    fall_pico_included: isSaree,
    blouse_customization_available: isSaree,
    highlights,
    available_sizes,
    stock_status: "in_stock",
    stock_count: 5,
    dispatch_time: "Dispatched within 24–48 hours from Surat Atelier",
    specifications,
    wash_care_bullets,
    color_variants,
  };
}

/**
 * Fetches a product by ID from Supabase, or falls back to seed catalog.
 */
export async function fetchProductById(id: string): Promise<DetailedProduct | null> {
  // 1. Check exact match in SEED_CATALOG_PRODUCTS first
  const seedMatch = SEED_CATALOG_PRODUCTS.find((p) => p.id === id);
  if (seedMatch) return seedMatch;

  // 2. Query Supabase
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (data && !error) {
      return enrichProductToDetailed(data as Product);
    }
  } catch (err) {
    console.warn("fetchProductById Supabase lookup notice:", err);
  }

  // 3. Fallback: match by partial ID or return first product
  const partialMatch = SEED_CATALOG_PRODUCTS.find((p) => p.id.includes(id) || id.includes(p.id));
  if (partialMatch) return partialMatch;

  return SEED_CATALOG_PRODUCTS[0];
}

/**
 * Fetches related recommended products ("You May Also Like").
 */
export async function fetchRelatedProducts(
  currentId: string,
  category: ProductCategory,
  limit: number = 4
): Promise<DetailedProduct[]> {
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

  // Fallback to seed catalog
  return SEED_CATALOG_PRODUCTS.filter((p) => p.id !== currentId).slice(0, limit);
}

