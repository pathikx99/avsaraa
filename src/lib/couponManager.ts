import fs from "fs";
import path from "path";
import { Coupon } from "@/types/order";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";

interface CouponsMetadata {
  [code: string]: {
    per_user_limit?: number;
  };
}

const METADATA_FILE_PATH = path.join(process.cwd(), "src", "data", "couponsMetadata.json");
const memoryCouponMeta: CouponsMetadata = {};

/**
 * Reads local coupon metadata (per_user_limit).
 */
export function readCouponsMetadata(): CouponsMetadata {
  try {
    if (fs.existsSync(METADATA_FILE_PATH)) {
      const content = fs.readFileSync(METADATA_FILE_PATH, "utf-8");
      const parsed = JSON.parse(content);
      return { ...parsed, ...memoryCouponMeta };
    }
  } catch (err) {
    console.warn("Notice: could not read coupons metadata file (using memory store):", err);
  }
  return { ...memoryCouponMeta };
}

/**
 * Saves coupon metadata (per_user_limit).
 */
export function saveCouponMetadata(code: string, perUserLimit?: number | null) {
  const cleanCode = code.trim().toUpperCase();
  memoryCouponMeta[cleanCode] = {
    ...memoryCouponMeta[cleanCode],
    per_user_limit: perUserLimit && perUserLimit > 0 ? perUserLimit : 1,
  };

  try {
    const meta = readCouponsMetadata();
    meta[cleanCode] = memoryCouponMeta[cleanCode];
    fs.mkdirSync(path.dirname(METADATA_FILE_PATH), { recursive: true });
    fs.writeFileSync(METADATA_FILE_PATH, JSON.stringify(meta, null, 2), "utf-8");
  } catch (err) {
    console.warn("Notice: could not persist coupon metadata to disk (preserved in memory):", err);
  }
}

/**
 * Removes coupon metadata if coupon deleted.
 */
export function removeCouponMetadata(code: string) {
  const cleanCode = code.trim().toUpperCase();
  delete memoryCouponMeta[cleanCode];

  try {
    const meta = readCouponsMetadata();
    if (meta[cleanCode]) {
      delete meta[cleanCode];
      fs.writeFileSync(METADATA_FILE_PATH, JSON.stringify(meta, null, 2), "utf-8");
    }
  } catch (err) {
    console.warn("Notice: could not delete coupon metadata from disk:", err);
  }
}

/**
 * Enriches raw coupon with per_user_limit.
 */
export function enrichCoupon(coupon: Coupon): Coupon {
  const meta = readCouponsMetadata();
  const cleanCode = (coupon.code || "").trim().toUpperCase();
  const perUserLimit =
    coupon.per_user_limit !== undefined && coupon.per_user_limit !== null
      ? coupon.per_user_limit
      : meta[cleanCode]?.per_user_limit !== undefined
      ? meta[cleanCode].per_user_limit
      : 1;

  return {
    ...coupon,
    per_user_limit: perUserLimit,
  };
}

export interface CouponValidationResult {
  valid: boolean;
  message?: string;
  discountAmount?: number;
  coupon?: {
    code: string;
    discount_amount: number;
    discount_type: "percentage" | "fixed";
    discount_value: number;
    max_discount_amount?: number | null;
    min_order_amount: number;
    usage_limit?: number | null;
    per_user_limit?: number | null;
    valid_until?: string | null;
  };
}

/**
 * Full coupon validation engine:
 * - Active check
 * - Expiration date time constraint (valid_until)
 * - Start date constraint (valid_from)
 * - Total usage limit (usage_limit)
 * - Per-user usage limit (orders history query)
 * - Minimum order subtotal requirement (min_order_amount)
 * - Percentage discount with Money Cap (max_discount_amount) OR Fixed discount
 */
export async function validateCouponEngine({
  code,
  subtotal,
  userId,
  contact,
}: {
  code: string;
  subtotal: number;
  userId?: string | null;
  contact?: string | null;
}): Promise<CouponValidationResult> {
  const rawCode = (code || "").trim().toUpperCase();
  if (!rawCode) {
    return { valid: false, message: "Please enter a promotion code." };
  }

  const supabase = getAdminSupabaseClient();
  let couponData: Coupon | null = null;

  try {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .ilike("code", rawCode)
      .eq("is_active", true)
      .maybeSingle();

    if (!error && data) {
      couponData = enrichCoupon(data as Coupon);
    }
  } catch (err) {
    console.error("Coupon lookup error:", err);
  }

  if (!couponData) {
    return {
      valid: false,
      message: `Promotion code "${rawCode}" is invalid, inactive, or not found.`,
    };
  }

  const now = new Date();

  // 1. Time Constraint: Expiry Date (valid_until)
  if (couponData.valid_until && new Date(couponData.valid_until) < now) {
    const expiryDateFormatted = new Date(couponData.valid_until).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return {
      valid: false,
      message: `Promo code "${couponData.code}" expired on ${expiryDateFormatted}.`,
    };
  }

  // 2. Start Date Constraint (valid_from)
  if (couponData.valid_from && new Date(couponData.valid_from) > now) {
    return {
      valid: false,
      message: `Promo code "${couponData.code}" is not yet active.`,
    };
  }

  // 3. Total Usage Limit (across all customers)
  if (couponData.usage_limit && couponData.used_count >= couponData.usage_limit) {
    return {
      valid: false,
      message: `Promo code "${couponData.code}" has reached its maximum total redemptions (${couponData.usage_limit} uses).`,
    };
  }

  // 4. Per-User Usage Limit (exempt system guest account from shared user limit, check contact for guests)
  const GUEST_SYSTEM_USER_ID = "7a3b2e24-820f-4706-8cc3-4218b42b0da3";
  const userLimit = couponData.per_user_limit || 1;
  if (userId && userId !== GUEST_SYSTEM_USER_ID) {
    try {
      const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .ilike("coupon_code", couponData.code);

      if (count !== null && count >= userLimit) {
        return {
          valid: false,
          message: `You have already redeemed promo code "${couponData.code}" the maximum allowed (${userLimit} time${userLimit > 1 ? "s" : ""}).`,
        };
      }
    } catch (err) {
      console.warn("Per-user limit order check notice:", err);
    }
  } else if (contact && contact.trim()) {
    try {
      const cleanContact = contact.trim().toLowerCase();
      const isEmail = cleanContact.includes("@");
      const { data: contactOrders } = await supabase
        .from("orders")
        .select("id, shipping_address_snapshot")
        .ilike("coupon_code", couponData.code);

      if (contactOrders) {
        const matches = contactOrders.filter((o) => {
          const snap = o.shipping_address_snapshot as { email?: string; phone_number?: string } | null;
          if (isEmail && snap?.email) {
            return snap.email.toLowerCase().trim() === cleanContact;
          }
          if (!isEmail && snap?.phone_number) {
            const digits = snap.phone_number.replace(/\D/g, "").slice(-10);
            return digits === cleanContact.replace(/\D/g, "").slice(-10);
          }
          return false;
        });

        if (matches.length >= userLimit) {
          return {
            valid: false,
            message: `You have already redeemed promo code "${couponData.code}" the maximum allowed (${userLimit} time${userLimit > 1 ? "s" : ""}).`,
          };
        }
      }
    } catch (cErr) {
      console.warn("Guest per-contact limit order check notice:", cErr);
    }
  }

  // 5. Minimum Order Amount Requirement
  const minRequired = couponData.min_order_amount || 0;
  if (minRequired > 0 && subtotal < minRequired) {
    return {
      valid: false,
      message: `Promo code "${couponData.code}" requires a minimum bag value of ₹${minRequired.toLocaleString("en-IN")}. Add ₹${(minRequired - subtotal).toLocaleString("en-IN")} more to apply.`,
    };
  }

  // 6. Calculate Discount Amount
  let discountAmount = 0;
  if (couponData.discount_type === "percentage") {
    // Percentage with Money Cap
    discountAmount = Math.round((subtotal * couponData.discount_value) / 100);
    if (couponData.max_discount_amount && discountAmount > couponData.max_discount_amount) {
      discountAmount = couponData.max_discount_amount;
    }
  } else {
    // Fixed Rupee Discount
    discountAmount = Math.min(couponData.discount_value, subtotal);
  }

  return {
    valid: true,
    discountAmount,
    coupon: {
      code: couponData.code,
      discount_amount: discountAmount,
      discount_type: couponData.discount_type,
      discount_value: couponData.discount_value,
      max_discount_amount: couponData.max_discount_amount || null,
      min_order_amount: couponData.min_order_amount || 0,
      usage_limit: couponData.usage_limit || null,
      per_user_limit: userLimit,
      valid_until: couponData.valid_until || null,
    },
  };
}
