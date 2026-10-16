export type ProductCategory = "Sarees" | "Dresses" | "New Arrivals" | "Occasion Wear";

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  image_url: string;
  description?: string;
  user_id?: string | null;
  created_at?: string;
}

