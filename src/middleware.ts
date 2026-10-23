import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSuperAdminUser } from "@/lib/adminConstants";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: Avoid calling auth methods between createServerClient and getUser.
  // A simple call to getUser() triggers refresh-token rotation and sets updated cookies.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // 1. Protected Route: /account requires an active customer session
  if (pathname.startsWith("/account")) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 2. Redirect logged-in users away from /login and /register unless explicitly specified
  // (e.g. if they just want to access /account)
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const hasRedirectTo = request.nextUrl.searchParams.has("redirectTo");
  if (isAuthPage && user && !hasRedirectTo) {
    const isSuperAdmin = isSuperAdminUser(user);

    // If admin is signed in, redirect to /admin, otherwise /account
    const destination = isSuperAdmin ? "/admin" : "/account";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
