import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// Load environment variables from .env
function loadEnv() {
  const envPath = path.join(rootDir, ".env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const value = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if secret key has masked characters or missing
if (!supabaseKey || supabaseKey.includes("•") || supabaseKey.includes("...")) {
  supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
}

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase URL or Key in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = process.env.STORAGE_BUCKET || "items";
const TARGET_FOLDER = "items"; // Folder inside the bucket

const DUMMY_IMAGES = [
  "banarasi_silk_saree.jpg",
  "royal_organza_saree.jpg",
  "royal_occasion_dress.jpg",
  "festive_chanderi_dress.jpg",
  "saree_model_hero.jpg",
  "patron_review_bride.jpg",
  "patron_review_emerald.jpg",
  "account_hero.jpg",
  "botanical_flowers.jpg",
  "avsaraa-logo.png",
  "avsaraa_wordmark.png",
  "home_hero_banner.webp",
  "desktop_hero_cinematic_1.jpg",
  "desktop_hero_cinematic_2.jpg",
  "desktop_hero_cinematic_3.jpg",
];

const MIME_MAP = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

async function uploadImages() {
  console.log(`\n======================================================`);
  console.log(`AVSARAA ATELIER - SUPABASE STORAGE UPLOADER`);
  console.log(`======================================================`);
  console.log(`Supabase URL:    ${supabaseUrl}`);
  console.log(`Target Bucket:   ${BUCKET_NAME}`);
  console.log(`Target Folder:   ${TARGET_FOLDER}`);
  console.log(`======================================================\n`);

  // 1. Verify / Create Bucket if permitted
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.warn(`⚠️ Warning checking buckets:`, listError.message);
  } else {
    const exists = buckets?.some((b) => b.name === BUCKET_NAME || b.id === BUCKET_NAME);
    if (!exists) {
      console.log(`Creating bucket '${BUCKET_NAME}' with public access...`);
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 52428800,
      });
      if (createError) {
        console.warn(`Could not create bucket automatically (${createError.message}).`);
        console.warn(`Please ensure you have executed supabase/schema.sql in the Supabase Dashboard SQL editor.`);
      } else {
        console.log(`✅ Bucket '${BUCKET_NAME}' created successfully.`);
      }
    } else {
      console.log(`✅ Found existing bucket '${BUCKET_NAME}'.`);
    }
  }

  const imagesDir = path.join(rootDir, "public", "images");
  const uploadedUrls = {};

  for (const imageName of DUMMY_IMAGES) {
    const localFilePath = path.join(imagesDir, imageName);
    if (!fs.existsSync(localFilePath)) {
      console.warn(`⚠️ Local file not found: ${imageName}`);
      continue;
    }

    const fileBuffer = fs.readFileSync(localFilePath);
    const ext = path.extname(imageName).toLowerCase();
    const contentType = MIME_MAP[ext] || "application/octet-stream";

    // Upload to items/<filename>
    const storagePathWithFolder = `${TARGET_FOLDER}/${imageName}`;
    const storagePathRoot = imageName;

    console.log(`Uploading ${imageName} (${(fileBuffer.length / 1024).toFixed(1)} KB)...`);

    // Upload to folder: items/<imageName>
    const { error: uploadError1 } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePathWithFolder, fileBuffer, {
        contentType,
        upsert: true,
        cacheControl: "3600",
      });

    if (uploadError1) {
      console.error(`  ❌ Failed to upload to ${storagePathWithFolder}:`, uploadError1.message);
    } else {
      console.log(`  ✅ Uploaded to ${BUCKET_NAME}/${storagePathWithFolder}`);
    }

    // Also upload to root: <imageName> for convenience
    await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePathRoot, fileBuffer, {
        contentType,
        upsert: true,
        cacheControl: "3600",
      })
      .catch(() => {});

    const { data: publicData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePathWithFolder);

    uploadedUrls[imageName] = publicData.publicUrl;
  }

  console.log(`\n======================================================`);
  console.log(`UPLOAD SUMMARY & GENERATED PUBLIC URLS`);
  console.log(`======================================================`);
  for (const [name, url] of Object.entries(uploadedUrls)) {
    console.log(`${name}:`);
    console.log(`  -> ${url}`);
  }
  console.log(`======================================================\n`);
}

uploadImages().catch((err) => {
  console.error("Fatal upload error:", err);
  process.exit(1);
});
