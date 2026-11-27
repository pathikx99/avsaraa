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
  sku?: string;
  hsn_code?: string;
  weight_grams?: number;
  cluster_origin?: string;
  status?: "published" | "draft" | "archived";
  slug?: string;
  // Feature extensions
  back_in_stock_notify?: boolean;
  pre_order?: boolean;
  pre_order_available_at?: string;
  pre_order_deposit_percent?: number;
  size_guide_url?: string;
  fit_notes?: string;
  publish_status?: "draft" | "scheduled" | "published" | "archived";
  scheduled_publish_at?: string;
  low_stock_threshold?: number;
  shipping_weight_grams?: number;
  international_shippable?: boolean;
  country_of_origin?: string;
  stock_status?: "in_stock" | "low_stock" | "out_of_stock";
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
    image: "/images/occasion_everyday.jpg",
  },
  {
    id: "festive",
    title: "Festive Edit",
    subtitle: "Zari Silks & Handcrafted Ensembles",
    slug: "festive",
    image: "/images/occasion_festive.jpg",
  },
  {
    id: "wedding-guest",
    title: "Wedding Guest",
    subtitle: "Romantic Organzas & Embroidered Drapes",
    slug: "wedding-guest",
    image: "/images/occasion_wedding.jpg",
  },
  {
    id: "haldi-mehendi",
    title: "Haldi & Mehendi",
    subtitle: "Marigold Yellows & Mirror-Work Sets",
    slug: "haldi-mehendi",
    image: "/images/occasion_haldi.jpg",
  },
  {
    id: "traditional",
    title: "Traditional & Ceremonial",
    subtitle: "Heritage Banarasi Weaves & Gold Kadhwa",
    slug: "traditional",
    image: "/images/occasion_traditional.jpg",
  },
  {
    id: "party",
    title: "Party & Special Occasions",
    subtitle: "Cocktail Drapes & Midnight Couture",
    slug: "party",
    image: "/images/occasion_party.jpg",
  },
];
