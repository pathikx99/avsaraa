/**
 * Administrator Constants & Security Configuration
 * Centralizes all admin credential environment configuration for Avsaraa.
 */

export const ADMIN_EMAIL: string = (
  (typeof process !== "undefined" && process.env?.ADMIN_EMAIL) ||
  "admin@avsaraa.com"
)
  .toLowerCase()
  .trim();

export interface AdminUserLike {
  email?: string | null;
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown> | null;
}

/**
 * Validates whether an email string matches the configured Super Admin email.
 * This is primarily intended for server-side verification.
 */
export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase().trim() === ADMIN_EMAIL;
}

/**
 * Validates whether a Supabase user entity possesses Super Admin authority.
 * Checks against Supabase auth roles (app_metadata only) which are tamper-proof.
 * Falls back to server-side email verification if running on server.
 */
export function isSuperAdminUser(user?: AdminUserLike | null): boolean {
  if (!user) return false;

  const appRole = user.app_metadata?.role;
  if (
    typeof appRole === "string" &&
    (appRole.toLowerCase() === "super_admin" || appRole.toLowerCase() === "admin")
  ) {
    return true;
  }

  // Server-side check against ADMIN_EMAIL
  if (typeof window === "undefined" && isSuperAdminEmail(user.email)) {
    return true;
  }

  return false;
}
