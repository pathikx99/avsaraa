import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSuperAdminUser } from "@/lib/adminConstants";
import { getSupabaseUrl, getSupabasePublishableKey } from "@/lib/env";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Fast-path: /api/* routes handle their own session/JWT/webhook auth without redundant Supabase Auth latency.
  // /admin handles its own standalone Super Admin JWT Security Gate.
  if (pathname.startsWith("/api/") || pathname.startsWith("/admin")) {
    return NextResponse.next({ request });
  }

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

  // 1. Protected Route: /account requires an active customer session with verified email or WhatsApp phone
  if (pathname.startsWith("/account")) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    const isGoogleOAuth = user.app_metadata?.provider === "google";
    const isPhoneVerified = Boolean(
      user.phone_confirmed_at ||
      user.user_metadata?.auth_provider === "whatsapp_otp"
    );
    const isEmailVerified = Boolean(user.email_confirmed_at || isGoogleOAuth);

    if (!isEmailVerified && !isPhoneVerified) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set(
        "error",
        "Please verify your email address or mobile number to access your account."
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
      const SKU_REGEX = /^AVS-[A-Z]{3}-\d{4}-\d{4,}$/i;
      const isUuid = UUID_REGEX.test(rawId);
      const isSku = SKU_REGEX.test(rawId);

      if (!isUuid && !isSku) {
        return NextResponse.rewrite(new URL("/_not-found", request.url), { status: 404 });
      }
      try {
        const { data: product, error } = isUuid
          ? await supabase.from("products").select("id").eq("id", rawId).maybeSingle()
          : await supabase.from("products").select("id").eq("specifications->>sku", rawId.toUpperCase()).maybeSingle();

        if (!error && !product) {
          return NextResponse.rewrite(new URL("/_not-found", request.url), { status: 404 });
        }
      } catch {
        // If query fails due to network/cold-start, let the product route handle it
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
