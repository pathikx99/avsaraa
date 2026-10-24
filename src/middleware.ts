import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSuperAdminUser } from "@/lib/adminConstants";
import { getSupabaseUrl, getSupabasePublishableKey } from "@/lib/env";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = getSupabaseUrl();
  const publishableKey = getSupabasePublishableKey();

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

  // 1. Protected Route: /admin requires authenticated Super Admin session
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    const isSuperAdmin = isSuperAdminUser(user);
    if (!isSuperAdmin) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/account";
      redirectUrl.searchParams.set("error", "Access Denied: Super Admin authority required.");
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 2. Protected Route: /account requires an active customer session with verified email
  if (pathname.startsWith("/account")) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Security requirement (Check 9): Confirm email verification before granting access
    const isGoogleOAuth = user.app_metadata?.provider === "google";
    const isEmailVerified = Boolean(user.email_confirmed_at || isGoogleOAuth);

    if (!isEmailVerified) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set(
        "error",
        "Please verify your email address to access your account. Check your inbox for the verification link."
      );
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 3. Redirect logged-in users away from /login and /register unless explicitly specified
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const hasRedirectTo = request.nextUrl.searchParams.has("redirectTo");
  if (isAuthPage && user && !hasRedirectTo) {
    const isSuperAdmin = isSuperAdminUser(user);
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
