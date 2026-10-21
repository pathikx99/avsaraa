import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";
import type { User } from "@supabase/supabase-js";
import { AdminUser } from "@/types/admin";

export interface AdminAuthResult {
  authorized: boolean;
  status: number;
  error?: string;
  user?: User;
  adminProfile?: AdminUser;
}

/**
 * Validates incoming administrative requests by verifying:
 * 1. A valid Supabase Auth session exists (via Bearer token or cookies).
 * 2. The user belongs to the active admin_users registry or has admin metadata.
 */
export async function authenticateAdminRequest(): Promise<AdminAuthResult> {
  try {
    const headerList = await headers();
    const authHeader = headerList.get("authorization");
    const adminKeyHeader = headerList.get("x-admin-key");

    let user: User | null = null;
    const adminClient = getAdminSupabaseClient();

    // 1. Direct Secret / API Key bypass (for server-to-server or secure automation)
    const secretKey =
      process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (adminKeyHeader && secretKey && adminKeyHeader === secretKey) {
      return { authorized: true, status: 200 };
    }

    // 2. Token-based auth (Bearer <token>)
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "").trim();
      if (token) {
        const { data: tokenData, error: tokenError } = await adminClient.auth.getUser(token);
        if (!tokenError && tokenData?.user) {
          user = tokenData.user;
        }
      }
    }

    // 3. Cookie-based auth fallback (via @supabase/ssr)
    if (!user) {
      try {
        const supabase = await createSupabaseServerClient();
        const { data, error } = await supabase.auth.getUser();
        if (!error && data?.user) {
          user = data.user;
        }
      } catch {
        // Cookie parsing fallback
      }
    }

    // 4. In development mode with no users in DB yet, check for emergency bootstrap
    const { count, error: countErr } = await adminClient
      .from("admin_users")
      .select("*", { count: "exact", head: true });

    const isDatabaseEmpty = !countErr && (count === null || count === 0);

    // If no user is logged in
    if (!user) {
      // In local development, if database has no admins yet, allow bootstrap
      if (isDatabaseEmpty && process.env.NODE_ENV === "development") {
        return {
          authorized: true,
          status: 200,
        };
      }

      return {
        authorized: false,
        status: 401,
        error: "Unauthorized: Administrator session required. Please sign in.",
      };
    }

    // 5. Verify the user is the active Super Admin in admin_users or has Super Admin identity
    const userEmail = user.email?.toLowerCase().trim();

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

    // Check user metadata or default super admin email convention
    const hasSuperAdminMeta =
      user.app_metadata?.role === "super_admin" ||
      user.app_metadata?.role === "admin" ||
      user.user_metadata?.role === "super_admin" ||
      user.user_metadata?.role === "admin" ||
      userEmail === "admin@avsaraa.com";

    if (hasSuperAdminMeta) {
      return {
        authorized: true,
        status: 200,
        user,
      };
    }

    // User is logged in, but not the Super Admin
    return {
      authorized: false,
      status: 403,
      error: `Access Denied: Account (${userEmail}) does not possess Super Admin privileges. Only the single Super Admin can control this platform.`,
      user,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Authentication verification error";
    return {
      authorized: false,
      status: 500,
      error: message,
    };
  }
}
