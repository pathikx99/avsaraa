/**
 * Environment Configuration & Validation Utility
 * Enforces strict environment variable validation across dev, preview, and production.
 */

export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  if (!url) {
    if (typeof window !== "undefined") {
      console.error("Missing NEXT_PUBLIC_SUPABASE_URL configuration.");
    }
    return "";
  }
  return url;
}

export function getSupabasePublishableKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    if (typeof window !== "undefined") {
      console.error("Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY configuration.");
    }
    return "";
  }
  return key;
}

export function getSupabaseSecretKey(): string {
  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key || key.includes("•") || key.includes("...") || key.trim().length < 20) {
    throw new Error(
      "Configuration Error: SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) is missing, masked, or invalid. Elevated admin operations require a valid service key."
    );
  }
  return key;
}
