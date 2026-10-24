import { NextResponse } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { authenticateAdminRequest } from "@/lib/adminAuth";
import { ProductReview } from "@/types/review";

export async function GET(request: Request) {
  try {
    const auth = await authenticateAdminRequest();
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error || "Admin authentication required" },
        { status: auth.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const productId = searchParams.get("productId");

    const supabaseAdmin = getAdminSupabaseClient();
    let query = supabaseAdmin
      .from("product_reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (status && status !== "ALL") {
      query = query.eq("status", status);
    }
    if (productId && productId !== "ALL") {
      query = query.eq("product_id", productId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Reviews query database error:", error);
      return NextResponse.json({ success: false, error: "Failed to fetch reviews." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      reviews: (data as ProductReview[]) || [],
    });
  } catch (err: unknown) {
    console.error("Reviews GET exception:", err);
    return NextResponse.json({ success: false, error: "An unexpected error occurred while fetching reviews." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await authenticateAdminRequest();
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error || "Admin authentication required" },
        { status: auth.status }
      );
    }

    const { searchParams } = new URL(request.url);
    let reviewId = searchParams.get("id");

    if (!reviewId) {
      try {
        const body = await request.json();
        reviewId = body.id;
      } catch {
        // query param is primary
      }
    }

    if (!reviewId) {
      return NextResponse.json(
        { success: false, error: "Review ID is required for deletion." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getAdminSupabaseClient();
    const { error } = await supabaseAdmin
      .from("product_reviews")
      .delete()
      .eq("id", reviewId);

    if (error) {
      console.error("Supabase review deletion error:", error);
      return NextResponse.json({ success: false, error: "Failed to delete review." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Customer review removed successfully.",
      deletedId: reviewId,
    });
  } catch (err: unknown) {
    console.error("Review DELETE exception:", err);
    return NextResponse.json({ success: false, error: "An unexpected error occurred while deleting review." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await authenticateAdminRequest();
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.error || "Admin authentication required" },
        { status: auth.status }
      );
    }

    const body = await request.json();
    const { id, status, verified_purchase } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Review ID is required." },
        { status: 400 }
      );
    }

    const VALID_STATUSES = ["published", "pending", "hidden", "flagged"];
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (status !== undefined) updates.status = status;
    if (verified_purchase !== undefined) updates.verified_purchase = Boolean(verified_purchase);

    const supabaseAdmin = getAdminSupabaseClient();
    const { data, error } = await supabaseAdmin
      .from("product_reviews")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Review update database error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update review status." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Review updated successfully.",
      review: data,
    });
  } catch (err: unknown) {
    console.error("Review PATCH exception:", err);
    return NextResponse.json({ success: false, error: "An unexpected error occurred while updating review." }, { status: 500 });
  }
}
