import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { withSupabase, createSupabaseContext } from "@supabase/server";
import { getSupabaseUrl, getSupabasePublishableKey } from "@/lib/env";

export { withSupabase, createSupabaseContext };

/**
 * Creates a Supabase Server Client for Server Components and Server Actions in Next.js
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const supabaseUrl = getSupabaseUrl();
  const publishableKey = getSupabasePublishableKey();

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
