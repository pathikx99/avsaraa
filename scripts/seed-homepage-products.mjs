import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const STORAGE_BASE = "https://slovsjusigggadxxkgcs.supabase.co/storage/v1/object/public/items/items";

const PRODUCTS_SEED = [
  // --- UP TO ₹1,299 PRODUCTS ---
  {
    id: "e1000000-0000-0000-0000-000000000001",
    name: "Peach Slub Cotton Embroidered Kurta",
    category: "Dresses",
    price: 999.00,
    image_url: `${STORAGE_BASE}/product_kurta_under1299.jpg`,
    description: "Lightweight, breathable pure cotton slub daily wear kurta adorned with delicate Kashmiri-inspired threadwork and mother-of-pearl buttons.",
    occasion_tags: ["Everyday Essentials", "Festive Edit"],
    color_variants: [
      { name: "Peach", hex: "#F8B195" },
      { name: "Sage Green", hex: "#A8BBA2" },
      { name: "Ivory White", hex: "#FAF5EF" }
    ],
    sales_count: 145,
    product_type: "top",
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: "e1000000-0000-0000-0000-000000000002",
    name: "Royal Ivory Zari Woven Chanderi Dupatta",
    category: "Occasion Wear",
    price: 899.00,
    image_url: `${STORAGE_BASE}/product_dupatta_under1299.jpg`,
    description: "Classic handwoven Chanderi silk blend stole with antique gold zari booti weaving and delicate artisan tassel hem.",
    occasion_tags: ["Festive Edit", "Wedding Guest", "Traditional & Ceremonial Wear"],
    color_variants: [
      { name: "Ivory Gold", hex: "#F3EFE0" },
      { name: "Blush Rose", hex: "#E8C5C8" }
    ],
    sales_count: 182,
    product_type: "standalone",
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: "e1000000-0000-0000-0000-000000000003",
    name: "Indigo Floral Handblock Printed Suit Set",
    category: "Dresses",
    price: 1299.00,
    image_url: `${STORAGE_BASE}/product_suit_under1299.jpg`,
    description: "Artisanal handblock printed Jaipur cotton suit set featuring a notched Mandarin collar kurta and straight cropped pants.",
    occasion_tags: ["Everyday Essentials", "Festive Edit"],
    color_variants: [
      { name: "Powder Blue", hex: "#A0C4E2" },
      { name: "Indigo Navy", hex: "#2C3E50" }
    ],
    sales_count: 210,
    product_type: "set",
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "e1000000-0000-0000-0000-000000000004",
    name: "Mustard Mirror-Work Silk Blend Short Kurti",
    category: "Dresses",
    price: 1199.00,
    image_url: `${STORAGE_BASE}/product_kurti_under1299.jpg`,
    description: "Vibrant festive short kurti with hand-embroidered mirror work yoke and metallic gota patti piping along the cuffs and hem.",
    occasion_tags: ["Haldi & Mehendi", "Festive Edit", "Everyday Essentials"],
    color_variants: [
      { name: "Mustard", hex: "#E5A93C" },
      { name: "Rani Pink", hex: "#D63384" }
    ],
    sales_count: 98,
    product_type: "top",
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "e1000000-0000-0000-0000-000000000005",
    name: "Blush Pink Embroidered Festive Stole",
    category: "Occasion Wear",
    price: 799.00,
    image_url: `${STORAGE_BASE}/product_dupatta_under1299.jpg`,
    description: "Soft viscose silk festive stole with dainty floral threadwork and scalloped border finish.",
    occasion_tags: ["Everyday Essentials", "Festive Edit"],
    color_variants: [
      { name: "Blush", hex: "#FAD2E1" },
      { name: "Champagne", hex: "#F3E5AB" }
    ],
    sales_count: 74,
    product_type: "standalone",
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },

  // --- OCCASION SPECIALS & BESTSELLERS ---
  {
    id: "e0000000-0000-0000-0000-000000000001",
    name: "Royal Banarasi Katan Silk Saree",
    category: "Sarees",
    price: 24999.00,
    image_url: `${STORAGE_BASE}/banarasi_silk_saree.jpg`,
    description: "Authentic handwoven pure Banarasi katan silk saree featuring antique gold zari kadhwa borders and delicate floral jaal artistry.",
    occasion_tags: ["Traditional & Ceremonial Wear", "Wedding Guest", "Festive Edit"],
    color_variants: [
      { name: "Crimson Red", hex: "#8A181A" },
      { name: "Antique Gold", hex: "#CFB53B" }
    ],
    sales_count: 320,
    product_type: "standalone",
    created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
  },
  {
    id: "e0000000-0000-0000-0000-000000000002",
    name: "Emerald Organza Embroidered Saree",
    category: "Sarees",
    price: 18450.00,
    image_url: `${STORAGE_BASE}/royal_organza_saree.jpg`,
    description: "Weightless sheer organza drape adorned with intricate resham threadwork, scalloped borders, and lustrous pearl highlights.",
    occasion_tags: ["Festive Edit", "Wedding Guest", "Party & Special Occasions"],
    color_variants: [
      { name: "Emerald Green", hex: "#0E5A3B" },
      { name: "Mint Frost", hex: "#9BD5C1" }
    ],
    sales_count: 290,
    product_type: "standalone",
    created_at: new Date(Date.now() - 35 * 86400000).toISOString(),
  },
  {
    id: "e0000000-0000-0000-0000-000000000003",
    name: "Heritage Anarkali Silk Gown",
    category: "Occasion Wear",
    price: 28900.00,
    image_url: `${STORAGE_BASE}/royal_occasion_dress.jpg`,
    description: "Regal floor-sweeping Kalidar gown tailored in Surat silk with heritage hand-zardozi embroidery across the neckline and cuffs.",
    occasion_tags: ["Wedding Guest", "Party & Special Occasions", "Festive Edit"],
    color_variants: [
      { name: "Royal Purple", hex: "#4A1942" },
      { name: "Wine Berry", hex: "#6B1D2F" }
    ],
    sales_count: 260,
    product_type: "standalone",
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: "e1000000-0000-0000-0000-000000000006",
    name: "Sunshine Marigold Sharara Ensemble",
    category: "Occasion Wear",
    price: 9400.00,
    image_url: `${STORAGE_BASE}/occasion_haldi.jpg`,
    description: "Joyous three-piece Haldi festive ensemble in luminous yellow georgette silk with flared tiered sharara and gota patti borders.",
    occasion_tags: ["Haldi & Mehendi", "Festive Edit"],
    color_variants: [
      { name: "Haldi Yellow", hex: "#F4C430" },
      { name: "Lime Olive", hex: "#8A9A5B" }
    ],
    sales_count: 140,
    product_type: "set",
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: "e1000000-0000-0000-0000-000000000007",
    name: "Midnight Sequin Cocktail Pre-Draped Saree",
    category: "Occasion Wear",
    price: 16800.00,
    image_url: `${STORAGE_BASE}/occasion_party.jpg`,
    description: "Sensational cocktail party drape featuring metallic micro-sequins on liquid chiffon, paired with a structured designer bustier.",
    occasion_tags: ["Party & Special Occasions"],
    color_variants: [
      { name: "Midnight Navy", hex: "#152238" },
      { name: "Gunmetal", hex: "#2C3539" }
    ],
    sales_count: 175,
    product_type: "standalone",
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: "e1000000-0000-0000-0000-000000000008",
    name: "Pastel Rose Garden Wedding Lehenga",
    category: "Occasion Wear",
    price: 22500.00,
    image_url: `${STORAGE_BASE}/occasion_wedding.jpg`,
    description: "Breathtaking blush rose organza lehenga ensemble with cutdana beadwork, pearl accents, and a gossamer dupatta.",
    occasion_tags: ["Wedding Guest", "Festive Edit"],
    color_variants: [
      { name: "Blush Rose", hex: "#F4C2C2" },
      { name: "Champagne", hex: "#F7E7CE" }
    ],
    sales_count: 165,
    product_type: "standalone",
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: "e1000000-0000-0000-0000-000000000009",
    name: "Sage Minimalist Linen Everyday Kurta",
    category: "Dresses",
    price: 1250.00,
    image_url: `${STORAGE_BASE}/occasion_everyday.jpg`,
    description: "Sleek and contemporary pastel sage linen kurta tailored with clean geometric silhouette and dual-toned trim.",
    occasion_tags: ["Everyday Essentials"],
    color_variants: [
      { name: "Sage Green", hex: "#9CAF88" },
      { name: "Oatmeal", hex: "#E8E2D5" }
    ],
    sales_count: 88,
    product_type: "top",
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: "e0000000-0000-0000-0000-000000000005",
    name: "Royal Zari Bridal Drape",
    category: "New Arrivals",
    price: 34500.00,
    image_url: `${STORAGE_BASE}/saree_model_hero.jpg`,
    description: "Exquisite bridal masterpiece with intricate peacock and floral motifs in pure gold-toned zari, crafted for auspicious celebrations.",
    occasion_tags: ["Wedding Guest", "Traditional & Ceremonial Wear"],
    color_variants: [
      { name: "Vermilion", hex: "#E34234" },
      { name: "Gold", hex: "#D4AF37" }
    ],
    sales_count: 110,
    product_type: "standalone",
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: "e0000000-0000-0000-0000-000000000008",
    name: "Crimson Heritage Bridal Kalidar",
    category: "New Arrivals",
    price: 38000.00,
    image_url: `${STORAGE_BASE}/occasion_traditional.jpg`,
    description: "Opulent crimson bridal silhouette featuring intensive hand-embroidered dabka, sitara, and gota patti craftsmanship.",
    occasion_tags: ["Traditional & Ceremonial Wear", "Wedding Guest"],
    color_variants: [
      { name: "Crimson Red", hex: "#990000" }
    ],
    sales_count: 85,
    product_type: "standalone",
    created_at: new Date(Date.now()).toISOString(),
  }
];

async function seedProducts() {
  console.log("Seeding rich products into Supabase public.products...");

  // First check if table has new columns
  let hasOccasionTagsColumn = false;
  const { error: testColError } = await supabase
    .from("products")
    .select("occasion_tags")
    .limit(1);

  if (!testColError) {
    hasOccasionTagsColumn = true;
    console.log("✓ Native occasion_tags column detected!");
  } else {
    console.log("Note: Native occasion_tags column not yet present. Storing metadata in description block.");
  }

  for (const p of PRODUCTS_SEED) {
    const metaBlock = `<!--meta:${JSON.stringify({
      occasion_tags: p.occasion_tags,
      color_variants: p.color_variants,
      sales_count: p.sales_count,
      product_type: p.product_type,
    })}-->`;

    // Strip previous metaBlock if already present
    const cleanDescription = p.description.replace(/<!--meta:.*?-->/g, "").trim();
    const finalDescription = `${cleanDescription} ${metaBlock}`;

    const row = {
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      image_url: p.image_url,
      description: finalDescription,
      created_at: p.created_at,
    };

    if (hasOccasionTagsColumn) {
      row.occasion_tags = p.occasion_tags;
      row.color_variants = p.color_variants;
      row.sales_count = p.sales_count;
      row.product_type = p.product_type;
    }

    const { error } = await supabase.from("products").upsert(row, { onConflict: "id" });
    if (error) {
      console.error(`Error inserting ${p.name}:`, error.message);
    } else {
      console.log(`✓ Upserted: ${p.name} (₹${p.price})`);
    }
  }

  console.log("\nProducts seed complete! Total products:", PRODUCTS_SEED.length);
}

seedProducts().catch(console.error);
