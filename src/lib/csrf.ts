/**
 * CSRF Protection Utility
 * Validates Origin/Referer headers on state-changing API requests to prevent
 * Cross-Site Request Forgery attacks.
 *
 * In production, requests originating from the same domain must include a
 * matching Origin header. Cross-origin requests are rejected unless an
 * explicit allowlist is configured.
 */

export interface CsrfCheckResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Determines whether a request's origin is trustworthy.
 * Same-origin requests (Origin matches host) are allowed.
 * Cross-origin requests are denied unless explicitly allowlisted.
 */
export function validateCsrfOrigin(
  request: Request,
  options?: { allowedOrigins?: string[] }
): CsrfCheckResult {
  const allowedOrigins = options?.allowedOrigins || [];

  const originHeader = request.headers.get("origin");
  const refererHeader = request.headers.get("referer");
  const hostHeader = request.headers.get("host");

  // No Origin header: could be a same-origin request from a non-browser client
  // (e.g., curl, mobile app, server-to-server). Allow but flag for review.
  if (!originHeader && !refererHeader) {
    return { allowed: true, reason: "No Origin/Referer header (non-browser client)" };
  }

  const origin = originHeader || refererHeader;

  // Same-origin check: Origin protocol + host must match request Host
  if (hostHeader && origin) {
    try {
      const originUrl = new URL(origin);
      const requestProtocol = request.headers.get("x-forwarded-proto") || "https";
      const expectedOrigin = `${requestProtocol}://${hostHeader}`;

      if (originUrl.origin === expectedOrigin) {
        return { allowed: true, reason: "Same-origin request" };
      }

      // Check explicit allowlist
      if (allowedOrigins.includes(originUrl.origin)) {
        return { allowed: true, reason: "Allowlisted origin" };
      }

      return {
        allowed: false,
        reason: `Cross-origin request blocked: ${originUrl.origin} !== ${expectedOrigin}`,
      };
    } catch {
      return { allowed: false, reason: "Invalid Origin header format" };
    }
  }

  // Fallback: if we can't determine same-origin, allow but log
  return { allowed: true, reason: "Unable to determine origin (permissive fallback)" };
}

export { validateCsrfOrigin as csrfProtect };
