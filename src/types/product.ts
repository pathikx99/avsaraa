export type ProductCategory = "Sarees" | "Dresses" | "New Arrivals" | "Occasion Wear";

export type OccasionType =
  | "Everyday Essentials"
  | "Festive Edit"
  | "Wedding Guest"
  | "Haldi & Mehendi"
  | "Traditional & Ceremonial Wear"
  | "Party & Special Occasions";

export type ProductType = "standalone" | "top" | "bottom" | "set";

export interface ColorVariant {
  name: string;
  hex: string;
  image_url?: string;
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
