import { NextResponse } from "next/server";
import { headers } from "next/headers";
import crypto from "crypto";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { ADMIN_EMAIL, ADMIN_DEFAULT_PASSWORD } from "@/lib/adminConstants";
import { checkRateLimit, resetRateLimit } from "@/lib/rateLimit";
import { signAdminToken, verifyAdminSession, ADMIN_COOKIE_NAME } from "@/lib/jwtAdmin";

function safeTimingCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf-8");
  const bufB = Buffer.from(b, "utf-8");
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function GET() {
  try {
    const session = await verifyAdminSession();
    if (!session.authorized || !session.admin) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    return NextResponse.json({
      authenticated: true,
      admin: session.admin,
      token: session.token,
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const headerList = await headers();
    const forwardedFor = headerList.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown-ip";
    const rateLimitKey = `admin-auth:${ip}`;

    // 1. Rate Limiting Check (Maximum 10 attempts per 15 minutes)
    const rateCheck = checkRateLimit(rateLimitKey, 10, 900);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many failed administrative attempts. Access blocked for ${rateCheck.resetSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { email, password } = body;

    const configuredEmail = (process.env.ADMIN_EMAIL || ADMIN_EMAIL).toLowerCase().trim();
    const envPassword = process.env.ADMIN_PASSWORD || ADMIN_DEFAULT_PASSWORD;

    if (
      process.env.VERCEL_ENV === "production" &&
      (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD === ADMIN_DEFAULT_PASSWORD)
    ) {
      console.error("FATAL: Insecure default ADMIN_PASSWORD detected in live production deployment.");
      return NextResponse.json(
        {
          success: false,
          error: "Administrative access unavailable: Secure ADMIN_PASSWORD must be configured in production deployment.",
        },
        { status: 500 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: "Master password is required." },
        { status: 400 }
      );
    }

    // Email is optional when logging into /admin directly with the master password
    const cleanEmail = email ? String(email).toLowerCase().trim() : configuredEmail;

    // Constant-time comparison for password and email match
    const emailMatches = safeTimingCompare(cleanEmail, configuredEmail);
    const passwordMatches = safeTimingCompare(String(password), envPassword);

    if (emailMatches && passwordMatches) {
      // Successful authentication: Reset rate limit for this IP
      resetRateLimit(rateLimitKey);

      // Sign Cryptographic Admin JWT with strict role: "admin"
      const jwtToken = await signAdminToken({
        email: configuredEmail,
        role: "admin",
        full_name: "Super Admin",
        department: "Executive Leadership",
      });

      // Synchronize Supabase Auth & admin_users record in the background
      try {
        const supabaseAdmin = getAdminSupabaseClient();
        const { data: existingAdmin } = await supabaseAdmin
          .from("admin_users")
          .select("id")
          .eq("email", configuredEmail)
          .maybeSingle();

        if (!existingAdmin) {
          try {
            await supabaseAdmin.auth.admin.createUser({
              email: configuredEmail,
              password: envPassword,
              email_confirm: true,
              user_metadata: { role: "super_admin", full_name: "Kratos Lord" },
              app_metadata: { role: "super_admin" },
            });
          } catch {
            // User may already exist in auth.users
          }
        }

        await supabaseAdmin.from("admin_users").upsert(
          {
            email: configuredEmail,
            full_name: "Kratos Lord",
            role: "Super Admin",
            department: "Executive Leadership",
            status: "Active",
            permissions: [
              "all:super_admin",
              "products:manage",
              "customers:manage",
              "inquiries:manage",
              "system:admin",
            ],
            notes: "Configured Super Admin authenticated via environment credentials.",
          },
          { onConflict: "email" }
        );
      } catch (provisionErr) {
        console.warn("Notice: Background admin profile sync note:", provisionErr);
      }

      const response = NextResponse.json({
        success: true,
        message: "Admin credentials verified against cryptographic authority.",
        token: jwtToken,
      });

      // Set standalone HttpOnly JWT cookie 'admin-auth'
      response.cookies.set({
        name: ADMIN_COOKIE_NAME,
        value: jwtToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 12 * 60 * 60, // 12 hours
      });

      return response;
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid master password. Access denied.",
      },
      { status: 401 }
    );
  } catch (err: unknown) {
    console.error("Admin authentication exception:", err);
    return NextResponse.json(
      { success: false, error: "Authentication processing failed. Please try again later." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: "Admin session terminated.",
  });

  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
