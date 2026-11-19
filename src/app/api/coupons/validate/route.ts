import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { rateLimitCouponValidation } from "@/lib/rateLimit";
import { validateCouponEngine } from "@/lib/couponManager";

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

    // 2. Validate using the unified Promo Code Engine
    const result = await validateCouponEngine({
      code: rawCode,
      subtotal: orderSubtotal,
      userId: currentUserId,
    });

    if (!result.valid) {
      return NextResponse.json(
        {
          valid: false,
          message: result.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      message: `Coupon "${result.coupon?.code}" applied successfully!`,
      coupon: result.coupon,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ valid: false, message }, { status: 500 });
  }
}
