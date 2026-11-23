import { NextResponse } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { ProductReview } from "@/types/review";
import { rateLimitReviews } from "@/lib/rateLimit";
import { validateCsrfOrigin } from "@/lib/csrf";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    const supabase = getAdminSupabaseClient();
    if (!supabase) {
      return NextResponse.json({
        success: true,
        reviews: [],
      });
    }

    let query = supabase
      .from("product_reviews")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (productId && productId !== "ALL") {
      query = query.eq("product_id", productId);
    }

    const { data, error } = await query;

    if (error) {
      console.warn("Reviews load notice (graceful empty return):", error.message);
      return NextResponse.json({
        success: true,
        reviews: [],
      });
    }

    return NextResponse.json({
      success: true,
      reviews: (data as ProductReview[]) || [],
    });
  } catch (err: unknown) {
    console.error("Reviews GET exception:", err);
    return NextResponse.json({
      success: true,
      reviews: [],
    });
  }
}

export async function POST(request: Request) {
  try {
    // CSRF protection for review submissions
    const csrfCheck = validateCsrfOrigin(request);
    if (!csrfCheck.allowed) {
      return NextResponse.json(
        { success: false, error: `CSRF validation failed: ${csrfCheck.reason}` },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      product_id,
      product_name = "Luxury Handloom Saree",
      customer_name,
      customer_city = null,
      rating,
      title = null,
      comment,
      photos = [],
    } = body;

    // 1. Detect Authenticated User Session (never trust a client-supplied user_id)
    let authUserId: string | null = null;
    let authUserEmail: string | null = null;
    try {
      const serverClient = await createSupabaseServerClient();
      let user = (await serverClient.auth.getUser()).data.user;

      if (!user) {
        const authHeader = request.headers.get("authorization");
        if (authHeader?.startsWith("Bearer ")) {
          const token = authHeader.substring(7);
          const { data: jwtData } = await serverClient.auth.getUser(token);
          if (jwtData?.user) {
            user = jwtData.user;
          }
        }
      }

      if (user) {
        authUserId = user.id;
        authUserEmail = user.email || authUserEmail;
      }
    } catch {
      // Unauthenticated session fallback
    }

    // 2. Rate Limiting Protection (5 reviews per minute per IP / User)
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
    const rateLimitId = authUserId ? String(authUserId) : ip;
    const rateCheck = rateLimitReviews(rateLimitId);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many review submissions. Please wait a few moments before posting another review.",
        },
        { status: 429 }
      );
    }

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

    // 3. Security: Strict photo whitelist - only allow HTTPS images or local /images/ paths
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
          .slice(0, 5)
      : [];

    const adminClient = getAdminSupabaseClient();

    // 4. Verified Purchase Verification
    // Check if the user has an existing order containing this product_id
    let verifiedPurchase = false;
    try {
      const targetProductId = String(product_id).trim();
      const matchedOrderIds: string[] = [];

      if (authUserId) {
        const { data: userOrders } = await adminClient
          .from("orders")
          .select("id")
          .eq("user_id", authUserId)
          .neq("order_status", "Cancelled");

        if (userOrders) {
          for (const ord of userOrders) {
            matchedOrderIds.push(ord.id);
          }
        }
      }

      if (authUserEmail) {
        const cleanEmail = authUserEmail.toLowerCase().trim();
        const { data: allOrders } = await adminClient
          .from("orders")
          .select("id, shipping_address_snapshot")
          .neq("order_status", "Cancelled");

        if (allOrders) {
          for (const ord of allOrders) {
            const snap = ord.shipping_address_snapshot as { email?: string; phone_number?: string } | null;
            if (snap?.email?.toLowerCase().trim() === cleanEmail && !matchedOrderIds.includes(ord.id)) {
              matchedOrderIds.push(ord.id);
            }
          }
        }
      }

      if (matchedOrderIds.length > 0) {
        const { data: items } = await adminClient
          .from("order_items")
          .select("id")
          .in("order_id", matchedOrderIds)
          .eq("product_id", targetProductId)
          .limit(1);

        if (items && items.length > 0) {
          verifiedPurchase = true;
        }
      }
    } catch (checkErr) {
      console.warn("Verified purchase check notice:", checkErr);
    }

    const newReview: Partial<ProductReview> = {
      product_id: String(product_id).slice(0, 100),
      product_name: String(product_name).slice(0, 200),
      customer_name: customer_name.trim().slice(0, 100),
      customer_email: authUserEmail ? String(authUserEmail).trim().slice(0, 200) : null,
      customer_city: customer_city ? String(customer_city).trim().slice(0, 100) : null,
      rating: Math.round(numRating),
      title: title ? String(title).trim().slice(0, 150) : null,
      comment: comment.trim().slice(0, 3000),
      photos: cleanPhotos,
      verified_purchase: verifiedPurchase,
      helpful_count: 0,
      status: verifiedPurchase ? "published" : "pending",
      user_id: authUserId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await adminClient
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
      message: verifiedPurchase
        ? "Thank you! Your verified review and photos have been published."
        : "Thank you for sharing your review! Our atelier concierge will review and publish your feedback shortly.",
      review: data,
    });
  } catch (err: unknown) {
    console.error("Reviews POST exception:", err);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred while posting your review." },
      { status: 500 }
    );
  }
}
