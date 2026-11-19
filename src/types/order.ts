export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Processing"
  | "Dispatched"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled"
  | "Exchange Requested"
  | "Exchanged";

export type PaymentStatus = "Pending" | "Paid" | "Failed" | "Refunded";

export type PaymentMethod = "Online Card / UPI" | "Razorpay" | "Cashfree" | "COD";

export interface AddressSnapshot {
  recipient_name: string;
  phone_number: string;
  email?: string | null;
  is_guest?: boolean;
  address_line1: string;
  address_line2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  address_type?: string;
}

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id?: string | null;
  product_name: string;
  image_url: string;
  size?: string;
  color?: string;
  tailored_blouse?: boolean;
  unit_price: number;
  quantity: number;
  total_price: number;
  created_at?: string;
}

export interface Order {
  id: string;
  user_id: string;
  shipping_address_id?: string | null;
  shipping_address_snapshot: AddressSnapshot;
  order_number: string;
  subtotal: number;
  discount_amount: number;
  shipping_fee: number;
  total_amount: number;
  coupon_code?: string | null;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  notes?: string | null;
  tracking_number?: string | null;
  courier_partner?: string | null;
  estimated_delivery?: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_amount: number;
  max_discount_amount?: number | null;
  is_active: boolean;
  usage_limit?: number | null;
  used_count: number;
  per_user_limit?: number | null;
  valid_from?: string;
  valid_until?: string | null;
  created_at: string;
}

export interface PaymentRecord {
  id?: string;
  order_id: string;
  gateway: string;
  transaction_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  raw_payload?: Record<string, unknown>;
  created_at?: string;
}

export interface CreateOrderPayload {
  shipping_address_id?: string;
  shipping_address_snapshot: AddressSnapshot;
  items: Array<{
    product_id?: string;
    product_name: string;
    image_url: string;
    size?: string;
    color?: string;
    tailored_blouse?: boolean;
    unit_price: number;
    quantity: number;
  }>;
  coupon_code?: string;
  payment_method: PaymentMethod;
  notes?: string;
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    confirm_close?: boolean;
    ondismiss?: () => void;
  };
  handler?: (response: RazorpaySuccessResponse) => void | Promise<void>;
}

export interface RazorpayFailureResponse {
  error?: {
    code?: string;
    description?: string;
    source?: string;
    step?: string;
    reason?: string;
    metadata?: Record<string, unknown>;
  };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => {
      open: () => void;
      on: (event: string, callback: (response: RazorpayFailureResponse) => void) => void;
    };
  }
}

