import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const brainDir = "/home/lord-kratos/.gemini/antigravity-ide/brain/6163d718-5843-4c0a-95d8-c88fab6b25b3";
const publicImagesDir = path.join(rootDir, "public", "images");

// Ensure public/images directory exists
if (!fs.existsSync(publicImagesDir)) {
  fs.mkdirSync(publicImagesDir, { recursive: true });
}

// Map brain files to clean target names
const imageMapping = [
  { pattern: /^occasion_everyday_.*\.jpg$/, target: "occasion_everyday.jpg" },
  { pattern: /^occasion_festive_.*\.jpg$/, target: "occasion_festive.jpg" },
  { pattern: /^occasion_wedding_.*\.jpg$/, target: "occasion_wedding.jpg" },
  { pattern: /^occasion_haldi_.*\.jpg$/, target: "occasion_haldi.jpg" },
  { pattern: /^occasion_traditional_.*\.jpg$/, target: "occasion_traditional.jpg" },
  { pattern: /^occasion_party_.*\.jpg$/, target: "occasion_party.jpg" },
  { pattern: /^product_kurta_under1299_.*\.jpg$/, target: "product_kurta_under1299.jpg" },
  { pattern: /^product_dupatta_under1299_.*\.jpg$/, target: "product_dupatta_under1299.jpg" },
  { pattern: /^product_suit_under1299_.*\.jpg$/, target: "product_suit_under1299.jpg" },
  { pattern: /^product_kurti_under1299_.*\.jpg$/, target: "product_kurti_under1299.jpg" },
];

console.log("1. Copying generated images to public/images/ ...");
const brainFiles = fs.readdirSync(brainDir);
const copiedFiles = [];

for (const map of imageMapping) {
  const match = brainFiles.find((f) => map.pattern.test(f));
  if (match) {
    const src = path.join(brainDir, match);
    const dest = path.join(publicImagesDir, map.target);
    fs.copyFileSync(src, dest);
    copiedFiles.push(map.target);
    console.log(`  -> Copied ${match} => ${map.target}`);
  } else {
    console.warn(`  ! Could not find match for ${map.target}`);
  }
}

// Now connect to Supabase
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY in environment.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const BUCKET = "items";

async function uploadToStorage() {
  console.log("\n2. Uploading assets to Supabase Storage 'items' bucket ...");
  const uploadedUrls = {};

  for (const filename of copiedFiles) {
    const filePath = path.join(publicImagesDir, filename);
    const buffer = fs.readFileSync(filePath);

    // Upload to both items/<filename> and root <filename>
    const destinationPath = `items/${filename}`;
    const { error } = await supabase.storage.from(BUCKET).upload(destinationPath, buffer, {
      contentType: "image/jpeg",
      upsert: true,
      cacheControl: "3600",
    });

    if (error) {
      console.warn(`  ! Error uploading ${destinationPath}:`, error.message);
    } else {
      console.log(`  ✓ Uploaded: ${destinationPath}`);
    }

    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(destinationPath);
    uploadedUrls[filename] = publicData.publicUrl;
  }

  return uploadedUrls;
}

uploadToStorage()
  .then((urls) => {
    console.log("\nStorage Upload Complete. URLs available:");
    console.log(urls);
  })
  .catch((err) => {
    console.error("Error in upload script:", err);
  });
