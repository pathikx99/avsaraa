import { NextResponse } from "next/server";
import { authenticateAdminRequest } from "@/lib/adminAuth";
import { optimizeProductImage } from "@/lib/imageOptimizer";
import { uploadMedia, getActiveStorageProvider } from "@/lib/storageClient";
import { buildOrganizedStoragePath } from "@/lib/imageOrganizer";
import { validateCsrfOrigin } from "@/lib/csrf";

export async function POST(request: Request) {
  try {
    const csrfCheck = validateCsrfOrigin(request);
    if (!csrfCheck.allowed) {
      return NextResponse.json(
        { success: false, error: `CSRF validation failed: ${csrfCheck.reason}` },
        { status: 403 }
      );
    }

    // 1. Authenticate Admin Request
    const auth = await authenticateAdminRequest();
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
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
    const folder = (formData.get("folder") as string) || "products";
    const productName = (formData.get("product_name") as string) || "";
    const category = (formData.get("category") as string) || "";
    const role = (formData.get("role") as string) || "hero";

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No image file provided for upload." },
        { status: 400 }
      );
    }

    // Validate MIME type
    const validMimes = ["image/jpeg", "image/png", "image/webp", "image/jpg", "image/heic", "image/avif"];
    if (!validMimes.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: "Supported image formats: JPEG, PNG, WebP, AVIF." },
        { status: 400 }
      );
    }

    // Limit raw upload to 15MB
    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "Image file exceeds 15MB limit." },
        { status: 400 }
      );
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());

    // 2. High-performance compression: Convert to WebP, max 1200x1600, strip metadata
    const optimized = await optimizeProductImage(rawBuffer, 1200, 1600, 82);

    // 3. Auto-organize and rename image into structured Cloudflare storage path
    const { storagePath, fileName } = buildOrganizedStoragePath({
      folder,
      category,
      productName,
      originalFileName: file.name,
      role,
    });

    const uploadResult = await uploadMedia(optimized.buffer, storagePath, "image/webp");

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      provider: uploadResult.provider,
      path: uploadResult.path,
      fileName,
      sizeBytes: uploadResult.sizeBytes,
      width: optimized.width,
      height: optimized.height,
      compressionRatio: `${Math.round((1 - optimized.sizeBytes / file.size) * 100)}% smaller`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to process image upload";
    console.error("Admin upload API error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  const auth = await authenticateAdminRequest();
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const provider = getActiveStorageProvider();
  return NextResponse.json({
    activeProvider: provider,
    description:
      provider === "cloudflare_r2"
        ? "Active: Cloudflare R2 ($0 egress fees, 10GB free tier)"
        : "Active: Supabase Storage (1GB free tier). Add R2 credentials to .env to activate Cloudflare.",
  });
}
