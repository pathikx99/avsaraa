import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSuperAdminUser } from "@/lib/adminConstants";
import { getSupabaseUrl, getSupabasePublishableKey } from "@/lib/env";
import { verifyAdminToken, ADMIN_COOKIE_NAME } from "@/lib/jwtAdmin";

export async function proxy(request: NextRequest) {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // 1. Protected Route: /admin requires standalone 'admin-auth' JWT OR Super Admin session
  if (pathname.startsWith("/admin")) {
    const adminCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    let isAdminJwtValid = false;

    if (adminCookie) {
      const jwtResult = await verifyAdminToken(adminCookie);
      if (jwtResult.valid && jwtResult.payload?.role === "admin") {
        isAdminJwtValid = true;
      }
    }

    // If no valid admin JWT, fallback to Supabase user session check
    if (!isAdminJwtValid) {
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
  }

  // 2. Protected Route: /account requires an active customer session with verified email
  if (pathname.startsWith("/account")) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(redirectUrl);
    }

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

  // 3. /checkout supports both Guest Checkout and Authenticated Checkout (no forced redirect)

  // 4. Redirect logged-in users away from /login and /register unless explicitly specified
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const hasRedirectTo = request.nextUrl.searchParams.has("redirectTo");
  if (isAuthPage && user && !hasRedirectTo) {
    const isSuperAdmin = isSuperAdminUser(user);
    const destination = isSuperAdmin ? "/admin" : "/account";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // 5. Product Detail Pre-Check: return real HTTP 404 for non-existent product IDs before App Shell streams
  if (pathname.startsWith("/products/")) {
    const rawId = pathname.slice("/products/".length).split("/")[0]?.trim();
    if (rawId) {
      const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const SEED_PRODUCT_IDS = new Set([
        "e0000000-0000-0000-0000-000000000001",
        "e0000000-0000-0000-0000-000000000002",
        "e0000000-0000-0000-0000-000000000003",
        "e0000000-0000-0000-0000-000000000004",
        "e0000000-0000-0000-0000-000000000005",
      ]);

      if (!SEED_PRODUCT_IDS.has(rawId)) {
        if (!UUID_REGEX.test(rawId)) {
          return NextResponse.rewrite(new URL("/_not-found", request.url), { status: 404 });
        }
        const { data: product } = await supabase
          .from("products")
          .select("id")
          .eq("id", rawId)
          .maybeSingle();

        if (!product) {
          return NextResponse.rewrite(new URL("/_not-found", request.url), { status: 404 });
        }
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
