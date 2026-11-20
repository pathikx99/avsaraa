export type ProductCategory =
  | "Sarees"
  | "Dresses"
  | "Co-ords"
  | "Men's Wear"
  | "New Arrivals"
  | "Occasion Wear";

export type OccasionType =
  | "Everyday Essentials"
  | "Festive Edit"
  | "Wedding Guest"
  | "Haldi & Mehendi"
  | "Traditional & Ceremonial Wear"
  | "Party & Special Occasions";

export type ProductType = "standalone" | "top" | "bottom" | "set";

export interface ColorVariantSize {
  size: string;
  stock: number;
  sku?: string;
  price?: number;
}

export interface ColorVariant {
  name: string;
  hex: string;
  image_url?: string;
  primary_image?: string;
  gallery_images?: string[];
  stock?: number;
  sizes?: ColorVariantSize[];
}

export interface ProductHighlight {
  icon?: string;
  title: string;
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  image_url: string;
  description?: string;
  user_id?: string | null;
  created_at?: string;
  // Enhanced fields for homepage v2 & catalog
  occasion_tags?: string[];
  color_variants?: ColorVariant[];
  sales_count?: number;
  product_type?: ProductType;
  gallery_images?: string[];
  available_sizes?: string[];
  size_inventory?: Record<string, number>;
  specifications?: Record<string, unknown>;
  stock_count?: number;
  display_order?: number;
  mrp?: number;
  discount_percent?: number;
  fabric?: string;
  weave?: string;
  video_url?: string;
  highlights?: Array<string | ProductHighlight>;
}

export interface OccasionCategory {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  image: string;
}

export const OCCASIONS_LIST: OccasionCategory[] = [
  {
    id: "everyday",
    title: "Everyday Essentials",
    subtitle: "Breathable Kurtas & Pure Cottons",
    slug: "everyday",
    image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: "festive",
    title: "Festive Edit",
    subtitle: "Zari Silks & Handcrafted Ensembles",
    slug: "festive",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: "wedding-guest",
    title: "Wedding Guest",
    subtitle: "Romantic Organzas & Embroidered Drapes",
    slug: "wedding-guest",
    image: "https://images.unsplash.com/photo-1659293554631-d7a38642c5e3?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: "haldi-mehendi",
    title: "Haldi & Mehendi",
    subtitle: "Marigold Yellows & Mirror-Work Sets",
    slug: "haldi-mehendi",
    image: "https://images.unsplash.com/photo-1610189000544-1f0885c4bbeb?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: "traditional",
    title: "Traditional & Ceremonial",
    subtitle: "Heritage Banarasi Weaves & Gold Kadhwa",
    slug: "traditional",
    image: "https://images.unsplash.com/photo-1641699862936-be9f49b1c38d?auto=format&fit=crop&w=800&q=85",
  },
  {
    id: "party",
    title: "Party & Special Occasions",
    subtitle: "Cocktail Drapes & Midnight Couture",
    slug: "party",
    image: "https://images.unsplash.com/photo-1610189013429-a703f4b245cf?auto=format&fit=crop&w=800&q=85",
  },
];
