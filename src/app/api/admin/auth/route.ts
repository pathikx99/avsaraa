import { NextResponse } from "next/server";
import { headers } from "next/headers";
import crypto from "crypto";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import { ADMIN_EMAIL } from "@/lib/adminConstants";
import { checkRateLimit, resetRateLimit } from "@/lib/rateLimit";

function safeTimingCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf-8");
  const bufB = Buffer.from(b, "utf-8");
  if (bufA.length !== bufB.length) {
    // Perform dummy timing safe compare to avoid timing leak on length
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(request: Request) {
  try {
    const headerList = await headers();
    const forwardedFor = headerList.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown-ip";
    const rateLimitKey = `admin-auth:${ip}`;

    // 1. Rate Limiting Check (Check 18: Maximum 5 attempts per 15 minutes)
    const rateCheck = checkRateLimit(rateLimitKey, 5, 900);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many failed administrative attempts. Access blocked for ${rateCheck.resetSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    const configuredEmail = (process.env.ADMIN_EMAIL || ADMIN_EMAIL).toLowerCase().trim();
    const envPassword = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required." },
        { status: 400 }
      );
    }

    if (!envPassword) {
      console.error("ADMIN_PASSWORD environment variable is not configured.");
      return NextResponse.json(
        { success: false, error: "Server authentication service unavailable." },
        { status: 500 }
      );
    }

    const cleanEmail = String(email).toLowerCase().trim();

    // Constant-time comparison for password and email match
    const emailMatches = safeTimingCompare(cleanEmail, configuredEmail);
    const passwordMatches = safeTimingCompare(String(password), envPassword);

    if (emailMatches && passwordMatches) {
      // Successful authentication: Reset rate limit for this IP
      resetRateLimit(rateLimitKey);

      try {
        const supabaseAdmin = getAdminSupabaseClient();

        // Check if user already exists in Supabase Auth
        const { data: userListData } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = userListData?.users?.find(
          (u) => u.email?.toLowerCase().trim() === configuredEmail
        );

        if (!existingUser) {
          // Provision the user in Supabase Auth using environment credentials
          await supabaseAdmin.auth.admin.createUser({
            email: configuredEmail,
            password: envPassword,
            email_confirm: true,
            user_metadata: { role: "super_admin", full_name: "Kratos Lord" },
            app_metadata: { role: "super_admin" },
          });
        } else {
          // Update password and roles if user already exists
          await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
            password: envPassword,
            email_confirm: true,
            user_metadata: {
              ...(existingUser.user_metadata || {}),
              role: "super_admin",
            },
            app_metadata: {
              ...(existingUser.app_metadata || {}),
              role: "super_admin",
            },
          });
        }

        // Ensure record in public.admin_users exists
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
        console.error("Supabase auth sync error:", provisionErr);
      }

      return NextResponse.json({
        success: true,
        message: "Admin credentials verified against environment configuration.",
        synced: true,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid administrator credentials.",
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
