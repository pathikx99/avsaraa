import "server-only";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://slovsjusigggadxxkgcs.supabase.co";

const rawSecretKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "";

// Fallback if key is empty or a masked placeholder string (e.g. contains bullets or dots)
const isMaskedOrInvalid =
  !rawSecretKey ||
  rawSecretKey.includes("•") ||
  rawSecretKey.includes("...");

const publishableKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_TM_iuGMbcMcqHEeRPNET9A_cTwB8lfv";

const supabaseSecretKey = isMaskedOrInvalid ? publishableKey : rawSecretKey;

/**
 * Creates an administrative Supabase client using the Secret Key
 * for server-side operations that bypass RLS (e.g. Admin user management).
 *
 * This utility uses `import "server-only"` to prevent any accidental exposure
 * to client-side code bundles.
 */
export function getAdminSupabaseClient() {
  if (isMaskedOrInvalid) {
    console.warn(
      "NOTICE: Using publishable key fallback because SUPABASE_SECRET_KEY is masked or unset."
    );
  }

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
