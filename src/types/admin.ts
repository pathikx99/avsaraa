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

export interface CustomerOrderItem {
  product_name: string;
  quantity: number;
  total_price: number;
  color?: string | null;
  size?: string | null;
  image_url?: string | null;
}

export interface CustomerOrderSummary {
  id: string;
  user_id: string;
  order_number: string;
  total_amount: number;
  order_status: string;
  created_at: string;
  shipping_address_snapshot?: {
    recipient_name?: string;
    city?: string;
    state?: string;
    phone?: string;
    email?: string;
    address_line1?: string;
    postal_code?: string;
  } | null;
  order_items?: CustomerOrderItem[];
}

export interface CustomerAddressSummary {
  id: string;
  user_id: string;
  recipient_name: string;
  phone_number: string;
  address_line1: string;
  city: string;
  state: string;
  postal_code: string;
  is_default?: boolean;
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
  // CRM Enrichment
  total_spend?: number;
  order_count?: number;
  last_order_date?: string | null;
  first_order_date?: string | null;
  primary_city?: string | null;
  orders?: CustomerOrderSummary[];
  addresses?: CustomerAddressSummary[];
  inquiries?: ContactInquiry[];
  is_guest?: boolean;
  rfm_segment?: "VIP Atelier" | "Repeat Patron" | "Active Patron" | "Guest Buyer" | "Prospective Lead";
  concierge_notes?: string | null;
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
