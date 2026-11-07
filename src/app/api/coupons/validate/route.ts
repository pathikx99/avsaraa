import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { Coupon } from "@/types/order";
import { rateLimitCouponValidation } from "@/lib/rateLimit";

// Built-in active fallback coupons
const FALLBACK_COUPONS: Record<string, Partial<Coupon>> = {
  AVSARAA10: {
    code: "AVSARAA10",
    discount_type: "percentage",
    discount_value: 10,
    min_order_amount: 0,
    max_discount_amount: 10000,
    is_active: true,
    usage_limit: 5000,
    used_count: 42,
  },
  WELCOME500: {
    code: "WELCOME500",
    discount_type: "fixed",
    discount_value: 500,
    min_order_amount: 2999,
    max_discount_amount: 500,
    is_active: true,
    usage_limit: 1000,
    used_count: 18,
  },
};

export async function POST(request: Request) {
  try {
    const headerList = await headers();
    const forwardedFor = headerList.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown-ip";

    // 1. Rate Limiting Protection (15 attempts per minute)
    const rateCheck = rateLimitCouponValidation(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          valid: false,
          message: `Too many coupon validation attempts. Please retry in ${rateCheck.resetSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const rawCode = (body.code || "").trim().toUpperCase();
    const orderSubtotal = Number(body.subtotal) || 0;

    if (!rawCode) {
      return NextResponse.json(
        { valid: false, message: "Please provide a promotion coupon code." },
        { status: 400 }
      );
    }

    // Check currently authenticated user for per-user limits
    let currentUserId: string | null = null;
    try {
      const serverClient = await createSupabaseServerClient();
      const { data: authData } = await serverClient.auth.getUser();
      currentUserId = authData?.user?.id || null;
    } catch {
      // Unauthenticated
    }

    const supabase = getAdminSupabaseClient();
    let coupon: Coupon | null = null;

    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .ilike("code", rawCode)
        .eq("is_active", true)
        .maybeSingle();

      if (!error && data) {
        coupon = data as Coupon;
      }
    } catch {
      // Table fallback
    }

    if (!coupon && FALLBACK_COUPONS[rawCode]) {
      coupon = {
        id: `mock-${rawCode.toLowerCase()}`,
        created_at: new Date().toISOString(),
        used_count: 0,
        ...FALLBACK_COUPONS[rawCode],
      } as Coupon;
    }

    if (!coupon) {
      return NextResponse.json(
        {
          valid: false,
          message: `Coupon code "${rawCode}" is invalid or expired. Try "AVSARAA10" for 10% off.`,
        },
        { status: 404 }
      );
    }

    // 2. Expiry Check (valid_until & valid_from)
    const now = new Date();
    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      return NextResponse.json(
        {
          valid: false,
          message: `Coupon code "${coupon.code}" has expired on ${new Date(coupon.valid_until).toLocaleDateString("en-IN")}.`,
        },
        { status: 400 }
      );
    }

    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      return NextResponse.json(
        {
          valid: false,
          message: `Coupon code "${coupon.code}" is not yet active.`,
        },
        { status: 400 }
      );
    }

    // 3. Global Usage Limit Check
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return NextResponse.json(
        {
          valid: false,
          message: `Promotion code "${coupon.code}" has reached its maximum redemption limit.`,
        },
        { status: 400 }
      );
    }

    // 4. Per-User Usage Limit Check (1 use per customer by default for welcome coupons)
    if (currentUserId && coupon.code === "WELCOME500") {
      try {
        const { count } = await supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("user_id", currentUserId)
          .eq("coupon_code", coupon.code);

        if (count && count >= 1) {
          return NextResponse.json(
            {
              valid: false,
              message: `You have already redeemed promo code "${coupon.code}". Limited to one use per patron.`,
            },
            { status: 400 }
          );
        }
      } catch {
        // Continue if orders query cannot run
      }
    }

    // 5. Minimum Purchase Threshold Check
    if (coupon.min_order_amount && orderSubtotal < coupon.min_order_amount) {
      return NextResponse.json(
        {
          valid: false,
          message: `Code "${coupon.code}" requires a minimum bag value of ₹${coupon.min_order_amount.toLocaleString("en-IN")}.`,
        },
        { status: 400 }
      );
    }

    // 6. Calculate Effective Discount Amount
    let discountAmount = 0;
    if (coupon.discount_type === "percentage") {
      discountAmount = Math.round((orderSubtotal * coupon.discount_value) / 100);
      if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
        discountAmount = coupon.max_discount_amount;
      }
    } else {
      discountAmount = coupon.discount_value;
    }

    discountAmount = Math.min(discountAmount, orderSubtotal);

    return NextResponse.json({
      valid: true,
      message: `Coupon "${coupon.code}" applied successfully!`,
      coupon: {
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discount_amount: discountAmount,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ valid: false, message }, { status: 500 });
  }
}
