import { Product } from "./product";

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  product_data?: Product | null;
  created_at: string;
}
