import { NextResponse } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { authenticateAdminRequest } from "@/lib/adminAuth";
import { Coupon } from "@/types/order";
import { validateCsrfOrigin } from "@/lib/csrf";
import {
  enrichCoupon,
  saveCouponMetadata,
  removeCouponMetadata,
} from "@/lib/couponManager";

export async function GET() {
  try {
    const auth = await authenticateAdminRequest();
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const supabaseAdmin = getAdminSupabaseClient();

    try {
      const { data: coupons, error } = await supabaseAdmin
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Coupons query error:", error.message);
        return NextResponse.json({
          success: true,
          coupons: [],
          notice: error.message,
        });
      }

      const couponList = (coupons || []).map((c) => enrichCoupon(c as Coupon));

      return NextResponse.json({
        success: true,
        coupons: couponList,
      });
    } catch (err: unknown) {
      console.warn("Coupons query exception:", err);
      return NextResponse.json({
        success: true,
        coupons: [],
      });
    }
  } catch (err: unknown) {
    console.error("Admin coupons GET unhandled error:", err);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred while fetching promo coupons." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const csrfCheck = validateCsrfOrigin(request);
    if (!csrfCheck.allowed) {
      return NextResponse.json(
        { success: false, error: `CSRF validation failed: ${csrfCheck.reason}` },
        { status: 403 }
      );
    }

    const auth = await authenticateAdminRequest();
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const supabaseAdmin = getAdminSupabaseClient();
    const body = await request.json();

    const rawCode = (body.code || "").trim().toUpperCase();
    const discountType: "percentage" | "fixed" | "free_shipping" =
      body.discount_type === "free_shipping"
        ? "free_shipping"
        : body.discount_type === "fixed"
        ? "fixed"
        : "percentage";
    const isFreeShipping = discountType === "free_shipping";
    const discountValue = isFreeShipping ? 0 : Number(body.discount_value);
    const minOrderAmount = Number(body.min_order_amount) || 0;
    const maxDiscountAmount = body.max_discount_amount ? Number(body.max_discount_amount) : null;
    const usageLimit = body.usage_limit ? Number(body.usage_limit) : null;
    const validUntil = body.valid_until ? new Date(body.valid_until).toISOString() : null;
    const perUserLimit = body.per_user_limit ? Number(body.per_user_limit) : 1;

    if (!rawCode || rawCode.length < 3 || rawCode.length > 30) {
      return NextResponse.json(
        { success: false, error: "Coupon code must be between 3 and 30 characters." },
        { status: 400 }
      );
    }

    if (!/^[A-Z0-9_-]+$/.test(rawCode)) {
      return NextResponse.json(
        { success: false, error: "Coupon code can only contain letters, numbers, hyphens, and underscores." },
        { status: 400 }
      );
    }

    if (!isFreeShipping && (isNaN(discountValue) || discountValue <= 0)) {
      return NextResponse.json(
        { success: false, error: "Discount value must be a positive number." },
        { status: 400 }
      );
    }

    if (discountType === "percentage" && discountValue > 100) {
      return NextResponse.json(
        { success: false, error: "Percentage discount cannot exceed 100%." },
        { status: 400 }
      );
    }

    const insertPayload: Record<string, unknown> = {
      code: rawCode,
      discount_type: discountType,
      discount_value: discountValue,
      min_order_amount: minOrderAmount,
      max_discount_amount: maxDiscountAmount,
      is_active: true,
      usage_limit: usageLimit,
      valid_until: validUntil,
      per_user_limit: perUserLimit,
    };

    let newCoupon: unknown = null;
    let { data, error: insertError } = await supabaseAdmin
      .from("coupons")
      .insert(insertPayload)
      .select()
      .single();

    if (insertError && insertError.message?.toLowerCase().includes("per_user_limit")) {
      delete insertPayload.per_user_limit;
      const retry = await supabaseAdmin
        .from("coupons")
        .insert(insertPayload)
        .select()
        .single();
      data = retry.data;
      insertError = retry.error;
    }

    // Database check constraint fallback: if DB table enforces CHECK (discount_type IN ('percentage', 'fixed'))
    if (
      insertError &&
      isFreeShipping &&
      (insertError.code === "23514" ||
        insertError.message?.toLowerCase().includes("check") ||
        insertError.message?.toLowerCase().includes("constraint"))
    ) {
      insertPayload.discount_type = "fixed";
      insertPayload.discount_value = 50; // standard delivery amount fallback
      const fallbackRetry = await supabaseAdmin
        .from("coupons")
        .insert(insertPayload)
        .select()
        .single();
      data = fallbackRetry.data;
      insertError = fallbackRetry.error;
    }

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json(
          { success: false, error: `Coupon code '${rawCode}' already exists.` },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { success: false, error: insertError.message || "Failed to create coupon." },
        { status: 500 }
      );
    }
    newCoupon = data;

    // Persist per_user_limit and is_free_shipping in metadata
    saveCouponMetadata(rawCode, perUserLimit, isFreeShipping);
    const enriched = enrichCoupon(newCoupon as Coupon);

    return NextResponse.json({
      success: true,
      coupon: enriched,
      message: `Coupon '${rawCode}' created successfully.`,
    });
  } catch (err: unknown) {
    console.error("Admin coupons POST error:", err);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred while creating coupon." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const csrfCheck = validateCsrfOrigin(request);
    if (!csrfCheck.allowed) {
      return NextResponse.json(
        { success: false, error: `CSRF validation failed: ${csrfCheck.reason}` },
        { status: 403 }
      );
    }

    const auth = await authenticateAdminRequest();
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const supabaseAdmin = getAdminSupabaseClient();
    const body = await request.json();
    const { id, is_active, discount_value, min_order_amount, max_discount_amount, usage_limit, valid_until, per_user_limit } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Coupon ID is required." },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};
    if (typeof is_active === "boolean") updates.is_active = is_active;
    if (discount_value !== undefined && Number(discount_value) > 0) updates.discount_value = Number(discount_value);
    if (min_order_amount !== undefined) updates.min_order_amount = Number(min_order_amount) || 0;
    if (max_discount_amount !== undefined) updates.max_discount_amount = max_discount_amount ? Number(max_discount_amount) : null;
    if (usage_limit !== undefined) updates.usage_limit = usage_limit ? Number(usage_limit) : null;
    if (valid_until !== undefined) updates.valid_until = valid_until ? new Date(valid_until).toISOString() : null;
    if (per_user_limit !== undefined && Number(per_user_limit) > 0) updates.per_user_limit = Number(per_user_limit);

    let updatedCoupon: Coupon | null = null;
    if (Object.keys(updates).length > 0) {
      let { data, error: updateError } = await supabaseAdmin
        .from("coupons")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (updateError && updateError.message?.toLowerCase().includes("per_user_limit")) {
        delete updates.per_user_limit;
        const retry = await supabaseAdmin
          .from("coupons")
          .update(updates)
          .eq("id", id)
          .select()
          .single();
        data = retry.data;
        updateError = retry.error;
      }

      if (updateError) {
        return NextResponse.json(
          { success: false, error: updateError.message || "Failed to update coupon." },
          { status: 500 }
        );
      }
      updatedCoupon = data as Coupon;
    } else {
      const { data } = await supabaseAdmin.from("coupons").select("*").eq("id", id).maybeSingle();
      updatedCoupon = data as Coupon;
    }

    if (updatedCoupon && per_user_limit !== undefined) {
      saveCouponMetadata(updatedCoupon.code, Number(per_user_limit));
    }

    const enriched = updatedCoupon ? enrichCoupon(updatedCoupon) : null;

    return NextResponse.json({
      success: true,
      coupon: enriched,
      message: "Coupon updated successfully.",
    });
  } catch (err: unknown) {
    console.error("Admin coupons PATCH error:", err);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred while updating coupon." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const csrfCheck = validateCsrfOrigin(request);
    if (!csrfCheck.allowed) {
      return NextResponse.json(
        { success: false, error: `CSRF validation failed: ${csrfCheck.reason}` },
        { status: 403 }
      );
    }

    const auth = await authenticateAdminRequest();
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const supabaseAdmin = getAdminSupabaseClient();
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch {
        // body might not be present in DELETE
      }
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Coupon ID is required." },
        { status: 400 }
      );
    }

    // Fetch code to cleanup metadata
    const { data: coup } = await supabaseAdmin.from("coupons").select("code").eq("id", id).maybeSingle();

    const { error: deleteError } = await supabaseAdmin
      .from("coupons")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: deleteError.message || "Failed to delete coupon." },
        { status: 500 }
      );
    }

    if (coup?.code) {
      removeCouponMetadata(coup.code);
    }

    return NextResponse.json({
      success: true,
      message: "Coupon deleted successfully.",
    });
  } catch (err: unknown) {
    console.error("Admin coupons DELETE error:", err);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred while deleting coupon." },
      { status: 500 }
    );
  }
}
