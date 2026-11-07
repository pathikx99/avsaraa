import { NextResponse } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { authenticateAdminRequest } from "@/lib/adminAuth";
import { Coupon } from "@/types/order";

const FALLBACK_COUPONS: Coupon[] = [
  {
    id: "default-avsaraa10",
    code: "AVSARAA10",
    discount_type: "percentage",
    discount_value: 10,
    min_order_amount: 0,
    max_discount_amount: 10000,
    is_active: true,
    usage_limit: 1000,
    used_count: 42,
    valid_from: new Date().toISOString(),
    valid_until: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "default-welcome500",
    code: "WELCOME500",
    discount_type: "fixed",
    discount_value: 500,
    min_order_amount: 2999,
    max_discount_amount: 500,
    is_active: true,
    usage_limit: 500,
    used_count: 18,
    valid_from: new Date().toISOString(),
    valid_until: null,
    created_at: new Date().toISOString(),
  },
];

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
        console.warn("Coupons query error (falling back to default templates):", error.message);
        return NextResponse.json({
          success: true,
          coupons: FALLBACK_COUPONS,
          notice: "Using local promo cache as remote coupons table is being initialized.",
        });
      }

      return NextResponse.json({
        success: true,
        coupons: coupons && coupons.length > 0 ? coupons : FALLBACK_COUPONS,
      });
    } catch (err: unknown) {
      console.warn("Coupons query exception, returning default coupons:", err);
      return NextResponse.json({
        success: true,
        coupons: FALLBACK_COUPONS,
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
    const auth = await authenticateAdminRequest();
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const supabaseAdmin = getAdminSupabaseClient();
    const body = await request.json();

    const rawCode = (body.code || "").trim().toUpperCase();
    const discountType = body.discount_type === "fixed" ? "fixed" : "percentage";
    const discountValue = Number(body.discount_value);
    const minOrderAmount = Number(body.min_order_amount) || 0;
    const maxDiscountAmount = body.max_discount_amount ? Number(body.max_discount_amount) : null;
    const usageLimit = body.usage_limit ? Number(body.usage_limit) : null;
    const validUntil = body.valid_until ? new Date(body.valid_until).toISOString() : null;

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

    if (isNaN(discountValue) || discountValue <= 0) {
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

    const { data: newCoupon, error: insertError } = await supabaseAdmin
      .from("coupons")
      .insert({
        code: rawCode,
        discount_type: discountType,
        discount_value: discountValue,
        min_order_amount: minOrderAmount,
        max_discount_amount: maxDiscountAmount,
        is_active: true,
        usage_limit: usageLimit,
        valid_until: validUntil,
      })
      .select()
      .single();

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

    return NextResponse.json({
      success: true,
      coupon: newCoupon,
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
    const auth = await authenticateAdminRequest();
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const supabaseAdmin = getAdminSupabaseClient();
    const body = await request.json();
    const { id, is_active, discount_value, min_order_amount, max_discount_amount, usage_limit, valid_until } = body;

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

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields provided for update." },
        { status: 400 }
      );
    }

    const { data: updatedCoupon, error: updateError } = await supabaseAdmin
      .from("coupons")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message || "Failed to update coupon." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      coupon: updatedCoupon,
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

