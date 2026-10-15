import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { withSupabase, createSupabaseContext } from "@supabase/server";

export { withSupabase, createSupabaseContext };

const supabaseUrl = process.env.SUPABASE_URL || "https://slovsjusigggadxxkgcs.supabase.co";
const publishableKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_TM_iuGMbcMcqHEeRPNET9A_cTwB8lfv";

/**
 * Creates a Supabase Server Client for Server Components and Server Actions in Next.js
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });
}
