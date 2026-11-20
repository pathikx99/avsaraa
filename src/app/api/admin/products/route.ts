import { NextResponse } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { authenticateAdminRequest } from "@/lib/adminAuth";
import { ensureColorwayImagesForProduct } from "@/lib/colorwayGenerator";
import { invalidateProductsCache } from "@/app/api/products/route";
import { SEED_CATALOG_PRODUCTS } from "@/lib/productDetailData";
import { sortProductsByShowcase, saveShowcaseOrderedIds } from "@/lib/showcaseOrderManager";

const VALID_CATEGORIES = [
  "Sarees",
  "Dresses",
  "Co-ords",
  "Men's Wear",
  "New Arrivals",
  "Occasion Wear",
];
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

    if (error || !data || data.length === 0) {
      console.warn("Products admin query notice (falling back to seed catalog):", error?.message);
      const sortedSeed = sortProductsByShowcase(SEED_CATALOG_PRODUCTS);
      return NextResponse.json({
        success: true,
        products: sortedSeed,
        count: sortedSeed.length,
        notice: "Using local verified catalog as remote products table is initializing.",
      });
    }

    const sortedData = sortProductsByShowcase(data);
    return NextResponse.json({
      success: true,
      products: sortedData,
      count: sortedData.length,
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

    // 2. Support both Single Product Creation and Bulk Array Ingestion
    const isBulk = Array.isArray(body) || Array.isArray(body?.bulk);
    const rawItems: Array<Record<string, unknown>> = isBulk ? (Array.isArray(body) ? body : body.bulk) : [body];

    if (rawItems.length === 0) {
      return NextResponse.json({ success: false, error: "No products provided for insertion." }, { status: 400 });
    }

    if (rawItems.length > 500) {
      return NextResponse.json(
        { success: false, error: "Maximum 500 products can be bulk imported in a single batch." },
        { status: 400 }
      );
    }

    const validatedPayloads: Record<string, unknown>[] = [];
    for (let i = 0; i < rawItems.length; i++) {
      const item = rawItems[i];
      const prefix = isBulk ? `Product #${i + 1} (${String(item.name || "Untitled")}): ` : "";

      const name = item.name;
      if (!name || typeof name !== "string" || name.trim().length < 2 || name.length > 200) {
        return NextResponse.json(
          { success: false, error: `${prefix}Product name must be between 2 and 200 characters.` },
          { status: 400 }
        );
      }

      const category = String(item.category || "").trim();
      if (!VALID_CATEGORIES.includes(category)) {
        return NextResponse.json(
          {
            success: false,
            error: `${prefix}Invalid category "${category}". Must be one of: ${VALID_CATEGORIES.join(", ")}`,
          },
          { status: 400 }
        );
      }

      const numericPrice = Number(item.price);
      if (isNaN(numericPrice) || numericPrice < 0 || numericPrice > 10000000) {
        return NextResponse.json(
          { success: false, error: `${prefix}Price must be a valid number between ₹0 and ₹10,000,000.` },
          { status: 400 }
        );
      }

      const image_url = item.image_url;
      if (!image_url || typeof image_url !== "string" || !SAFE_URL_REGEX.test(image_url.trim())) {
        return NextResponse.json(
          { success: false, error: `${prefix}Image URL must be a valid HTTPS web URL or local asset path.` },
          { status: 400 }
        );
      }

      const sanitizedDesc = item.description ? String(item.description).trim().slice(0, 2000) : null;
      const gallery = Array.isArray(item.gallery_images) ? item.gallery_images : [];

      const insertPayload: Record<string, unknown> = {
        name: name.trim(),
        category,
        price: numericPrice,
        image_url: image_url.trim(),
        description: sanitizedDesc,
        user_id: auth.user?.id || null,
        created_at: new Date().toISOString(),
      };

      if (item.product_type) insertPayload.product_type = item.product_type;
      if (Array.isArray(item.occasion_tags)) insertPayload.occasion_tags = item.occasion_tags;
      if (gallery.length > 0) insertPayload.gallery_images = gallery;

      let colors = item.color_variants;
      if (typeof colors === "string" && colors.trim().startsWith("[")) {
        try {
          colors = JSON.parse(colors);
        } catch {
          // ignore
        }
      }
      if (Array.isArray(colors)) {
        insertPayload.color_variants = ensureColorwayImagesForProduct(
          image_url.trim(),
          gallery,
          colors
        );
      }

      if (Array.isArray(item.available_sizes)) {
        insertPayload.available_sizes = item.available_sizes;
      } else if (typeof item.available_sizes === "string") {
        insertPayload.available_sizes = item.available_sizes
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }

      if (item.fabric) insertPayload.fabric = String(item.fabric).trim();
      if (item.weave) insertPayload.weave = String(item.weave).trim();
      const specs = (item.specifications && typeof item.specifications === "object") ? { ...(item.specifications as Record<string, unknown>) } : {};
      if (item.size_inventory && typeof item.size_inventory === "object") {
        specs.size_inventory = item.size_inventory;
      }
      if (Object.keys(specs).length > 0) {
        insertPayload.specifications = specs;
      }
      if (item.stock_count !== undefined) {
        insertPayload.stock_count = Math.max(0, parseInt(String(item.stock_count), 10) || 0);
      }
      if (item.mrp !== undefined) insertPayload.mrp = Number(item.mrp) || numericPrice;
      if (item.discount_percent !== undefined) insertPayload.discount_percent = Number(item.discount_percent);
      if (item.video_url) insertPayload.video_url = String(item.video_url).trim();
      if (Array.isArray(item.highlights)) insertPayload.highlights = item.highlights;

      validatedPayloads.push(insertPayload);
    }

    const { data, error } = await supabaseAdmin
      .from("products")
      .insert(validatedPayloads)
      .select();

    if (error) {
      console.error("Product create database error:", error);
      return NextResponse.json({ success: false, error: "Failed to create product in database." }, { status: 500 });
    }

    invalidateProductsCache();

    if (isBulk) {
      return NextResponse.json(
        {
          success: true,
          count: data?.length || 0,
          data,
          message: `Successfully imported ${data?.length || 0} products into catalog.`,
        },
        { status: 201 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data?.[0] || null,
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

    if (body.product_type !== undefined) updatePayload.product_type = body.product_type;
    if (Array.isArray(body.occasion_tags)) updatePayload.occasion_tags = body.occasion_tags;
    const putGallery = Array.isArray(body.gallery_images) ? body.gallery_images : [];
    if (Array.isArray(body.gallery_images)) updatePayload.gallery_images = putGallery;

    let putColors = body.color_variants;
    if (typeof putColors === "string" && putColors.trim().startsWith("[")) {
      try {
        putColors = JSON.parse(putColors);
      } catch {
        // ignore
      }
    }
    if (Array.isArray(putColors)) {
      const heroUrl = image_url ? image_url.trim() : (body.image_url || "");
      updatePayload.color_variants = ensureColorwayImagesForProduct(
        heroUrl,
        putGallery,
        putColors
      );
    }
    if (Array.isArray(body.available_sizes)) updatePayload.available_sizes = body.available_sizes;
    const putSpecs = (body.specifications && typeof body.specifications === "object") ? { ...(body.specifications as Record<string, unknown>) } : {};
    if (body.size_inventory && typeof body.size_inventory === "object") {
      putSpecs.size_inventory = body.size_inventory;
    }
    if (Object.keys(putSpecs).length > 0) {
      updatePayload.specifications = putSpecs;
    }
    if (body.stock_count !== undefined) updatePayload.stock_count = Number(body.stock_count);
    if (body.mrp !== undefined) updatePayload.mrp = Number(body.mrp);
    if (body.discount_percent !== undefined) updatePayload.discount_percent = Number(body.discount_percent);
    if (body.video_url !== undefined) updatePayload.video_url = body.video_url ? String(body.video_url).trim() : null;
    if (Array.isArray(body.highlights)) updatePayload.highlights = body.highlights;

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

    invalidateProductsCache();
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

    invalidateProductsCache();
    return NextResponse.json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (err: unknown) {
    console.error("Product DELETE exception:", err);
    return NextResponse.json({ success: false, error: "An unexpected error occurred while deleting product." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    // 1. Authorization Guard
    const auth = await authenticateAdminRequest();
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const orderedIds = body.orderedIds || body.ordered_ids;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "orderedIds array of product IDs is required for showcase reordering." },
        { status: 400 }
      );
    }

    const success = await saveShowcaseOrderedIds(orderedIds);
    if (!success) {
      return NextResponse.json(
        { success: false, error: "Failed to persist catalog showcase order." },
        { status: 500 }
      );
    }

    invalidateProductsCache();

    return NextResponse.json({
      success: true,
      message: "Catalog showcase ordering updated and published live.",
      count: orderedIds.length,
    });
  } catch (err: unknown) {
    console.error("Admin products PATCH exception:", err);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred while reordering products." },
      { status: 500 }
    );
  }
}
