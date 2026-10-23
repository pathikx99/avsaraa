export type AdminRole = "Super Admin";

export type AdminStatus = "Active" | "Inactive" | "Suspended";

export interface AdminUser {
  id: string;
  user_id?: string | null;
  full_name: string;
  email: string;
  role: AdminRole;
  department: string;
  phone_number?: string | null;
  avatar_url?: string | null;
  status: AdminStatus;
  permissions: string[];
  notes?: string | null;
  last_active?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerProfile {
  id: string;
  full_name: string;
  email: string | null;
  phone_number: string | null;
  avatar_url?: string | null;
  status?: "Active" | "Inactive" | "Suspended";
  membership_tier: string;
  reward_points?: number;
  preferred_currency?: string;
  created_at: string;
  updated_at: string;
}

export interface ContactInquiry {
  id: string;
  user_id?: string | null;
  full_name: string;
  email: string;
  phone_number?: string | null;
  subject: string;
  message: string;
  status: "Unread" | "In Progress" | "Resolved" | "Archived";
  created_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  status: "Subscribed" | "Unsubscribed";
  source?: string;
  created_at: string;
}

export type { ProductReview, ReviewStatus } from "./review";
export type { WishlistItem } from "./wishlist";
