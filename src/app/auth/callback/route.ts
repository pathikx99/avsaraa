import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const rawNext = requestUrl.searchParams.get("next") ?? "/account";

  // Security: Prevent open redirect vulnerability - next must start with "/" and not "//"
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/account";

  if (code) {
    const cookieStore = await cookies();
    const supabaseUrl =
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      "https://slovsjusigggadxxkgcs.supabase.co";
    const publishableKey =
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      "sb_publishable_TM_iuGMbcMcqHEeRPNET9A_cTwB8lfv";

    const supabase = createServerClient(supabaseUrl, publishableKey, {
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
            // Can be ignored if called from middleware
          }
        },
      },
    });

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // If user came via Google OAuth, ensure profile exists
      try {
        const user = data.user;
        const adminClient = getAdminSupabaseClient();
        const { data: existingProfile } = await adminClient
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (!existingProfile) {
          const fullName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "Avsaraa Member";

          const avatarUrl =
            user.user_metadata?.avatar_url ||
            user.user_metadata?.picture ||
            null;

          await adminClient.from("profiles").upsert({
            id: user.id,
            full_name: fullName,
            email: user.email?.toLowerCase().trim() || null,
            avatar_url: avatarUrl,
            status: "Active",
            membership_tier: "Standard",
            reward_points: 100,
            updated_at: new Date().toISOString(),
          });
        }
      } catch (profileErr) {
        console.warn("Auth callback profile check note:", profileErr);
      }

      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }

    if (error) {
      console.error("Auth callback code exchange error:", error.message);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
      );
    }
  }

  // Fallback if no code present or token was invalid
  return NextResponse.redirect(
    new URL("/login?error=Invalid+or+expired+authentication+link", requestUrl.origin)
  );
}
