/**
 * Administrator Constants & Security Configuration
 * Centralizes all admin credential environment configuration for Avsaraa.
 */

export const ADMIN_EMAIL: string = (
  (typeof process !== "undefined" && process.env?.ADMIN_EMAIL) ||
  "web.avsaraa@gmail.com"
)
  .toLowerCase()
  .trim();

export interface AdminUserLike {
  email?: string | null;
  email_confirmed_at?: string | null;
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown> | null;
}

/**
 * Validates whether an email string matches the configured Super Admin email.
 * This is primarily intended for server-side verification.
 */
export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return (
    normalized === ADMIN_EMAIL ||
    normalized === "web.avsaraa@gmail.com" ||
    normalized === "contact.avsaraa@gmail.com" ||
    normalized === "admin@avsaraa.com"
  );
}

/**
 * Validates whether a Supabase user entity possesses Super Admin authority.
 * Checks against Supabase auth roles (app_metadata only) which are tamper-proof.
 * Falls back to verified server-side email verification with confirmed email check.
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

  // Reject explicitly unconfirmed accounts (unless Google OAuth verified)
  const isGoogleOAuth = user.app_metadata?.provider === "google";
  if (user.email_confirmed_at === null && !isGoogleOAuth) {
    return false;
  }

  if (typeof window === "undefined" && isSuperAdminEmail(user.email)) {
    return true;
  }

  return false;
}
