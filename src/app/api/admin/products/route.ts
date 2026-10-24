import { NextResponse } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { authenticateAdminRequest } from "@/lib/adminAuth";

const VALID_CATEGORIES = ["Sarees", "Dresses", "New Arrivals", "Occasion Wear"];
const SAFE_URL_REGEX = /^(\/|https?:\/\/)/i;

export async function GET() {
  try {
    // 1. Authorization Guard
    const auth = await authenticateAdminRequest();
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const supabaseAdmin = getAdminSupabaseClient();
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Products query database error:", error);
      return NextResponse.json({ success: false, error: "Failed to fetch products from catalog." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      products: data || [],
      count: data?.length || 0,
    });
  } catch (err: unknown) {
    console.error("Products GET exception:", err);
    return NextResponse.json({ success: false, error: "An unexpected error occurred while fetching products." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // 1. Authorization Guard
    const auth = await authenticateAdminRequest();
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const supabaseAdmin = getAdminSupabaseClient();
    const body = await request.json();
    const { name, category, price, image_url, description } = body;

    // 2. Strict Input Validation
    if (!name || typeof name !== "string" || name.trim().length < 2 || name.length > 200) {
      return NextResponse.json(
        { success: false, error: "Product name must be between 2 and 200 characters." },
        { status: 400 }
      );
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice < 0 || numericPrice > 10000000) {
      return NextResponse.json(
        { success: false, error: "Price must be a valid number between ₹0 and ₹10,000,000." },
        { status: 400 }
      );
    }

    if (!image_url || typeof image_url !== "string" || !SAFE_URL_REGEX.test(image_url.trim())) {
      return NextResponse.json(
        { success: false, error: "Image URL must be a valid HTTPS web URL or local asset path." },
        { status: 400 }
      );
    }

    const sanitizedDesc = description ? String(description).trim().slice(0, 2000) : null;

    const { data, error } = await supabaseAdmin
      .from("products")
      .insert({
        name: name.trim(),
        category,
        price: numericPrice,
        image_url: image_url.trim(),
        description: sanitizedDesc,
        user_id: auth.user?.id || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Product create database error:", error);
      return NextResponse.json({ success: false, error: "Failed to create product in database." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Product created successfully.",
    });
  } catch (err: unknown) {
    console.error("Product POST exception:", err);
    return NextResponse.json({ success: false, error: "An unexpected error occurred while creating product." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    // 1. Authorization Guard
    const auth = await authenticateAdminRequest();
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const supabaseAdmin = getAdminSupabaseClient();
    const body = await request.json();
    const { id, name, category, price, image_url, description } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { success: false, error: "Product ID is required for update." },
        { status: 400 }
      );
    }

    const updatePayload: Record<string, unknown> = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 2 || name.length > 200) {
        return NextResponse.json({ success: false, error: "Invalid product name length." }, { status: 400 });
      }
      updatePayload.name = name.trim();
    }

    if (category !== undefined) {
      if (!VALID_CATEGORIES.includes(category)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`,
          },
          { status: 400 }
        );
      }
      updatePayload.category = category;
    }

    if (price !== undefined) {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice < 0 || numPrice > 10000000) {
        return NextResponse.json(
          { success: false, error: "Price must be a valid number between ₹0 and ₹10,000,000." },
          { status: 400 }
        );
      }
      updatePayload.price = numPrice;
    }

    if (image_url !== undefined) {
      if (typeof image_url !== "string" || !SAFE_URL_REGEX.test(image_url.trim())) {
        return NextResponse.json(
          { success: false, error: "Image URL must be a valid HTTPS URL or local asset path." },
          { status: 400 }
        );
      }
      updatePayload.image_url = image_url.trim();
    }

    if (description !== undefined) {
      updatePayload.description = description ? String(description).trim().slice(0, 2000) : null;
    }

    const { data, error } = await supabaseAdmin
      .from("products")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Product update database error:", error);
      return NextResponse.json({ success: false, error: "Failed to update product." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      message: "Product updated successfully.",
    });
  } catch (err: unknown) {
    console.error("Product PUT exception:", err);
    return NextResponse.json({ success: false, error: "An unexpected error occurred while updating product." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // 1. Authorization Guard
    const auth = await authenticateAdminRequest();
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const supabaseAdmin = getAdminSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { success: false, error: "Product ID is required for deletion." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Product delete database error:", error);
      return NextResponse.json({ success: false, error: "Failed to delete product." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (err: unknown) {
    console.error("Product DELETE exception:", err);
    return NextResponse.json({ success: false, error: "An unexpected error occurred while deleting product." }, { status: 500 });
  }
}
