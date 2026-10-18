import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://slovsjusigggadxxkgcs.supabase.co";

const supabaseSecretKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "";

/**
 * Creates an administrative Supabase client using the Secret Key
 * for server-side operations that bypass RLS (e.g. Admin user management).
 *
 * This utility uses `import "server-only"` to prevent any accidental exposure
 * to client-side code bundles.
 */
export function getAdminSupabaseClient() {
  if (!supabaseSecretKey) {
    console.warn(
      "WARNING: SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY is not defined. Admin queries may fail or be restricted by RLS."
    );
  }

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
