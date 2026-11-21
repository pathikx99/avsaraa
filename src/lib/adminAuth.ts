import { headers } from "next/headers";
import crypto from "crypto";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import type { User } from "@supabase/supabase-js";
import { AdminUser } from "@/types/admin";
import { ADMIN_EMAIL, ADMIN_DEFAULT_PASSWORD, isSuperAdminUser } from "@/lib/adminConstants";
import { verifyAdminSession, AdminJwtPayload } from "@/lib/jwtAdmin";

export interface AdminAuthResult {
  authorized: boolean;
  status: number;
  error?: string;
  user?: User;
  adminProfile?: AdminUser;
  adminJwt?: AdminJwtPayload;
}

function safeTimingCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf-8");
  const bufB = Buffer.from(b, "utf-8");
  if (bufA.length !== bufB.length) {
    // Length mismatch: still run a constant-time operation to avoid leaking
    // length information via timing side channels.
    crypto.timingSafeEqual(Buffer.alloc(32, 0), Buffer.alloc(32, 0));
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Returns server-side admin credentials configured from environment variables.
 */
export function getAdminServerCredentials() {
  const isLiveProduction = process.env.VERCEL_ENV === "production";
  const password = process.env.ADMIN_PASSWORD;
  if (
    isLiveProduction &&
    (!password || password === ADMIN_DEFAULT_PASSWORD)
  ) {
    console.error(
      "Critical Security Warning: Insecure default ADMIN_PASSWORD detected in live production deployment."
    );
  }

  return {
    email: (process.env.ADMIN_EMAIL || ADMIN_EMAIL).toLowerCase().trim(),
    password: password || ADMIN_DEFAULT_PASSWORD,
  };
}

/**
 * Validates incoming administrative requests by verifying:
 * 1. Primary: Standalone HttpOnly JWT cookie (`admin-auth`) verified with `jose` with `role === "admin"`.
 * 2. Secondary: Direct Secret / API Key (`x-admin-key`).
 * 3. Fallback: Authenticated Supabase session asserting Super Admin privileges.
 */
export async function authenticateAdminRequest(): Promise<AdminAuthResult> {
  try {
    const headerList = await headers();
    const adminKeyHeader = headerList.get("x-admin-key");

    // 1. Direct Secret / API Key bypass (for server-to-server or secure automation)
    const secretKey =
      process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (
      adminKeyHeader &&
      secretKey &&
      !secretKey.includes("•") &&
      secretKey.length > 20 &&
      safeTimingCompare(adminKeyHeader, secretKey)
    ) {
      return { authorized: true, status: 200 };
    }

    // 2. Primary: Cryptographic JWT session check ('admin-auth' cookie / Bearer token via jose)
    const jwtResult = await verifyAdminSession();
    if (jwtResult.authorized && jwtResult.admin && jwtResult.admin.role === "admin") {
      return {
        authorized: true,
        status: 200,
        adminJwt: jwtResult.admin,
      };
    }

    // 3. Fallback: Supabase Auth session (@supabase/ssr)
    let user: User | null = null;
    try {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        user = data.user;
      }
    } catch {
      // Cookie parsing fallback
    }

    if (user) {
      const userEmail = user.email?.toLowerCase().trim();
      const adminClient = getAdminSupabaseClient();

      // Check admin_users table for active Super Admin
      const { data: adminRecord, error: adminQueryErr } = await adminClient
        .from("admin_users")
        .select("*")
        .or(`user_id.eq.${user.id},email.eq.${userEmail}`)
        .eq("status", "Active")
        .eq("role", "Super Admin")
        .maybeSingle();

      if (!adminQueryErr && adminRecord) {
        return {
          authorized: true,
          status: 200,
          user,
          adminProfile: adminRecord as AdminUser,
        };
      }

      if (isSuperAdminUser(user)) {
        return {
          authorized: true,
          status: 200,
          user,
        };
      }
    }

    return {
      authorized: false,
      status: 401,
      error: "Unauthorized: Standalone Admin session or Super Admin credentials required.",
    };
  } catch (err: unknown) {
    console.error("Administrative authentication error:", err);
    return {
      authorized: false,
      status: 500,
      error: "Authentication verification service error.",
    };
  }
}
