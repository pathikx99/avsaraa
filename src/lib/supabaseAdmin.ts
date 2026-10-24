import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl, getSupabaseSecretKey } from "@/lib/env";

/**
 * Creates an administrative Supabase client using the Secret / Service Role Key
 * for server-side operations that bypass RLS (e.g. Admin user management).
 *
 * This utility uses `import "server-only"` to prevent any accidental exposure
 * to client-side code bundles.
 */
export function getAdminSupabaseClient() {
  const supabaseUrl = getSupabaseUrl();
  const secretKey = getSupabaseSecretKey();

  return createClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
