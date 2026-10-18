export type AdminRole =
  | "Super Admin"
  | "Admin"
  | "Product Manager"
  | "Store Manager"
  | "Support Lead";

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
  membership_tier: string;
  reward_points?: number;
  preferred_currency?: string;
  created_at: string;
  updated_at: string;
}
