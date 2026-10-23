export type ReviewStatus = "published" | "pending" | "hidden" | "flagged";

export interface ProductReview {
  id: string;
  product_id: string;
  product_name?: string | null;
  user_id?: string | null;
  customer_name: string;
  customer_email?: string | null;
  customer_city?: string | null;
  rating: number; // 1 to 5
  title?: string | null;
  comment: string;
  photos: string[]; // URLs of customer photos
  videos: string[]; // URLs of customer videos
  verified_purchase: boolean;
  helpful_count: number;
  status: ReviewStatus;
  created_at: string;
  updated_at?: string;
}
