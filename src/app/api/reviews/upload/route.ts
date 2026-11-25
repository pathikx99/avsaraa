import { NextResponse } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { checkRateLimit } from "@/lib/rateLimit";
import { validateCsrfOrigin } from "@/lib/csrf";
import crypto from "crypto";
import sharp from "sharp";

export async function POST(request: Request) {
  try {
    // CSRF protection for photo uploads
    const csrfCheck = validateCsrfOrigin(request);
    if (!csrfCheck.allowed) {
      return NextResponse.json(
        { success: false, error: `CSRF validation failed: ${csrfCheck.reason}` },
        { status: 403 }
      );
    }
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
    const rateCheck = checkRateLimit(`review-upload:${ip}`, 10, 300);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Upload rate limit exceeded. Please wait a few minutes before uploading more photos.",
        },
        { status: 429 }
      );
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { success: false, error: "Content-Type must be multipart/form-data." },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No image file provided." },
        { status: 400 }
      );
    }

    // Validate MIME type
    const validMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validMimeTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file format. Please upload a JPEG, PNG, or WebP photo.",
        },
        { status: 400 }
      );
    }

    // Max 10MB raw file input allowed (we compress it down to ~100-140KB)
    const MAX_RAW_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_RAW_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: "Photo size exceeds 10MB limit. Please upload a smaller image.",
        },
        { status: 400 }
      );
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());

    // Compress, auto-orient from EXIF, & downscale to WebP (max 1200x1600, quality 80)
    // Preserves Supabase Free Tier 1GB storage and minimizes network egress
    const optimizedBuffer = await sharp(rawBuffer)
      .rotate()
      .resize({
        width: 1200,
        height: 1600,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 80, effort: 4 })
      .toBuffer();

    const filename = `reviews/${Date.now()}-${crypto.randomBytes(6).toString("hex")}.webp`;

    const adminClient = getAdminSupabaseClient();
    const { error: uploadError } = await adminClient.storage
      .from("items")
      .upload(filename, optimizedBuffer, {
        contentType: "image/webp",
        cacheControl: "31536000, immutable",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { success: false, error: "Failed to upload photo to storage." },
        { status: 500 }
      );
    }

    const { data: publicData } = adminClient.storage
      .from("items")
      .getPublicUrl(filename);

    return NextResponse.json({
      success: true,
      url: publicData.publicUrl,
      filename,
      sizeBytes: optimizedBuffer.length,
    });
  } catch (err: unknown) {
    console.error("Review photo upload exception:", err);
    return NextResponse.json(
      { success: false, error: "Unexpected error during photo upload." },
      { status: 500 }
    );
  }
}
