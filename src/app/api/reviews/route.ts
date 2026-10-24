import { NextResponse } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { ProductReview } from "@/types/review";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    const supabaseAdmin = getAdminSupabaseClient();
    let query = supabaseAdmin
      .from("product_reviews")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (productId && productId !== "ALL") {
      query = query.eq("product_id", productId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Reviews load database error:", error);
      return NextResponse.json({ success: false, error: "Unable to load reviews." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      reviews: (data as ProductReview[]) || [],
    });
  } catch (err: unknown) {
    console.error("Reviews GET exception:", err);
    return NextResponse.json({ success: false, error: "An unexpected error occurred while loading reviews." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      product_id,
      product_name = "Luxury Handloom Saree",
      customer_name,
      customer_email = null,
      customer_city = null,
      rating,
      title = null,
      comment,
      photos = [],
      user_id = null,
    } = body;

    if (!product_id) {
      return NextResponse.json(
        { success: false, error: "Product identifier is required." },
        { status: 400 }
      );
    }

    if (!customer_name || typeof customer_name !== "string" || customer_name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Please enter your name." },
        { status: 400 }
      );
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json(
        { success: false, error: "Rating must be between 1 and 5 stars." },
        { status: 400 }
      );
    }

    if (!comment || typeof comment !== "string" || comment.trim().length < 5 || comment.length > 3000) {
      return NextResponse.json(
        { success: false, error: "Review must be between 5 and 3,000 characters." },
        { status: 400 }
      );
    }

    // Security (Check 16): Strict photo whitelist - only allow HTTPS images or local /images/ paths.
    // Disallow dangerous data: URIs and SVG files to prevent stored XSS vectors.
    const SAFE_PHOTO_REGEX = /^(\/images\/|https:\/\/)/i;
    const cleanPhotos: string[] = Array.isArray(photos)
      ? photos
          .filter(
            (p) =>
              typeof p === "string" &&
              p.trim().length > 0 &&
              SAFE_PHOTO_REGEX.test(p.trim()) &&
              !p.toLowerCase().includes(".svg") &&
              !p.toLowerCase().includes("javascript:") &&
              !p.toLowerCase().includes("data:")
          )
          .slice(0, 10)
      : [];

    const newReview: Partial<ProductReview> = {
      product_id: String(product_id).slice(0, 100),
      product_name: String(product_name).slice(0, 200),
      customer_name: customer_name.trim().slice(0, 100),
      customer_email: customer_email ? String(customer_email).trim().slice(0, 200) : null,
      customer_city: customer_city ? String(customer_city).trim().slice(0, 100) : null,
      rating: Math.round(numRating),
      title: title ? String(title).trim().slice(0, 150) : null,
      comment: comment.trim().slice(0, 3000),
      photos: cleanPhotos,
      videos: [],
      // Security (Check 11): Public reviews MUST NOT be pre-verified as verified purchases
      verified_purchase: false,
      helpful_count: 0,
      status: "published",
      user_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const supabaseAdmin = getAdminSupabaseClient();
    const { data, error } = await supabaseAdmin
      .from("product_reviews")
      .insert([newReview])
      .select()
      .single();

    if (error) {
      console.error("Reviews submission database error:", error);
      return NextResponse.json(
        { success: false, error: "Unable to submit your review at this time. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Thank you for sharing your royal review!",
      review: data,
    });
  } catch (err: unknown) {
    console.error("Reviews POST exception:", err);
    return NextResponse.json({ success: false, error: "An unexpected error occurred while posting your review." }, { status: 500 });
  }
}
