import "server-only";
import crypto from "crypto";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";

export interface StorageUploadResult {
  url: string;
  provider: "cloudflare_r2" | "supabase_storage";
  path: string;
  sizeBytes: number;
  contentType: string;
}

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrlPrefix?: string;
}

/**
 * Checks if Cloudflare R2 credentials are fully configured in the environment.
 */
function getR2Config(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME || process.env.CLOUDFLARE_R2_BUCKET_NAME;
  const publicUrlPrefix = process.env.R2_PUBLIC_URL_PREFIX || process.env.NEXT_PUBLIC_R2_URL;

  if (accountId && accessKeyId && secretAccessKey && bucketName) {
    return {
      accountId: accountId.trim(),
      accessKeyId: accessKeyId.trim(),
      secretAccessKey: secretAccessKey.trim(),
      bucketName: bucketName.trim(),
      publicUrlPrefix: publicUrlPrefix ? publicUrlPrefix.trim().replace(/\/+$/, "") : undefined,
    };
  }
  return null;
}

/**
 * AWS Signature Version 4 HMAC signing helper for Cloudflare R2
 */
function signR2Request(
  method: string,
  urlStr: string,
  headers: Record<string, string>,
  bodyHash: string,
  accessKeyId: string,
  secretAccessKey: string,
  region = "auto"
) {
  const url = new URL(urlStr);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const service = "s3";

  headers["x-amz-date"] = amzDate;
  headers["x-amz-content-sha256"] = bodyHash;
  headers["host"] = url.host;

  // 1. Canonical request
  const sortedHeaderKeys = Object.keys(headers).sort();
  const canonicalHeaders = sortedHeaderKeys
    .map((k) => `${k.toLowerCase()}:${headers[k].trim()}\n`)
    .join("");
  const signedHeaders = sortedHeaderKeys.map((k) => k.toLowerCase()).join(";");

  const canonicalRequest = [
    method,
    url.pathname,
    url.search ? url.search.slice(1) : "",
    canonicalHeaders,
    signedHeaders,
    bodyHash,
  ].join("\n");

  // 2. String to sign
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    crypto.createHash("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n");

  // 3. Signing key
  const kDate = crypto.createHmac("sha256", `AWS4${secretAccessKey}`).update(dateStamp).digest();
  const kRegion = crypto.createHmac("sha256", kDate).update(region).digest();
  const kService = crypto.createHmac("sha256", kRegion).update(service).digest();
  const kSigning = crypto.createHmac("sha256", kService).update("aws4_request").digest();
  const signature = crypto.createHmac("sha256", kSigning).update(stringToSign).digest("hex");

  // 4. Authorization header
  headers["authorization"] = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  return headers;
}

/**
 * Uploads an optimized file buffer directly to Cloudflare R2.
 */
async function uploadToR2(
  buffer: Buffer,
  storagePath: string,
  contentType: string,
  config: R2Config
): Promise<StorageUploadResult> {
  const cleanPath = storagePath.replace(/^\/+/, "");
  const endpoint = `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucketName}/${cleanPath}`;
  const bodyHash = crypto.createHash("sha256").update(buffer).digest("hex");

  const headers: Record<string, string> = {
    "content-type": contentType,
    "cache-control": "public, max-age=31536000, immutable",
  };

  signR2Request("PUT", endpoint, headers, bodyHash, config.accessKeyId, config.secretAccessKey);

  const res = await fetch(endpoint, {
    method: "PUT",
    headers,
    body: new Uint8Array(buffer),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Cloudflare R2 upload failed (${res.status}): ${errorText}`);
  }

  const publicUrl = config.publicUrlPrefix
    ? `${config.publicUrlPrefix}/${cleanPath}`
    : `https://${config.bucketName}.${config.accountId}.r2.dev/${cleanPath}`;

  return {
    url: publicUrl,
    provider: "cloudflare_r2",
    path: cleanPath,
    sizeBytes: buffer.length,
    contentType,
  };
}

/**
 * Uploads an optimized file buffer to Supabase Storage (Items bucket).
 */
async function uploadToSupabaseStorage(
  buffer: Buffer,
  storagePath: string,
  contentType: string
): Promise<StorageUploadResult> {
  const cleanPath = storagePath.replace(/^\/+/, "");
  const adminClient = getAdminSupabaseClient();
  const bucket = "items";

  const { error: uploadError } = await adminClient.storage
    .from(bucket)
    .upload(cleanPath, buffer, {
      contentType,
      cacheControl: "31536000, immutable",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Supabase Storage upload failed: ${uploadError.message}`);
  }

  const { data } = adminClient.storage.from(bucket).getPublicUrl(cleanPath);

  return {
    url: data.publicUrl,
    provider: "supabase_storage",
    path: cleanPath,
    sizeBytes: buffer.length,
    contentType,
  };
}

/**
 * Dual-Mode Media Uploader:
 * 1. Checks if Cloudflare R2 is configured in .env -> uses R2 ($0 egress forever).
 * 2. If R2 is not configured -> seamlessly falls back to Supabase Storage.
 */
export async function uploadMedia(
  buffer: Buffer,
  storagePath: string,
  contentType = "image/webp"
): Promise<StorageUploadResult> {
  const r2Config = getR2Config();

  if (r2Config) {
    try {
      return await uploadToR2(buffer, storagePath, contentType, r2Config);
    } catch (err) {
      console.warn("R2 upload encountered an error, falling back to Supabase Storage:", err);
      return await uploadToSupabaseStorage(buffer, storagePath, contentType);
    }
  }

  return await uploadToSupabaseStorage(buffer, storagePath, contentType);
}

/**
 * Returns current active storage provider info for Admin diagnostic dashboards.
 */
export function getActiveStorageProvider(): "cloudflare_r2" | "supabase_storage" {
  return getR2Config() ? "cloudflare_r2" : "supabase_storage";
}
