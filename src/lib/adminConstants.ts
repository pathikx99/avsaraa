/**
 * Administrator Constants & Security Configuration
 * Centralizes all admin credential environment configuration for Avsaraa.
 */

export const ADMIN_EMAIL: string = (
  process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
  process.env.ADMIN_EMAIL ||
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
 * Validates whether an email string matches the configured Super Admin email from environment variables.
 */
export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase().trim() === ADMIN_EMAIL;
}

/**
 * Validates whether a Supabase user entity possesses Super Admin authority.
 * Checks against configured environment email and Supabase auth roles (app_metadata / user_metadata).
 */
export function isSuperAdminUser(user?: AdminUserLike | null): boolean {
  if (!user) return false;
  if (isSuperAdminEmail(user.email)) return true;

  const appRole = user.app_metadata?.role;
  if (
    typeof appRole === "string" &&
    (appRole.toLowerCase() === "super_admin" || appRole.toLowerCase() === "admin")
  ) {
    return true;
  }

  const userRole = user.user_metadata?.role;
  if (
    typeof userRole === "string" &&
    (userRole.toLowerCase() === "super_admin" || userRole.toLowerCase() === "admin")
  ) {
    return true;
  }

  return false;
}
