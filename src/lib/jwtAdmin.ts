import * as jose from "jose";
import { ADMIN_EMAIL } from "./adminConstants.ts";

export const ADMIN_COOKIE_NAME = "admin-auth";
export const ADMIN_TOKEN_EXPIRY = "12h";

function getJwtSecret(): Uint8Array {
  const rawSecret =
    process.env.ADMIN_JWT_SECRET ||
    process.env.ADMIN_PASSWORD ||
    process.env.SUPABASE_SECRET_KEY ||
    "avsaraa_super_secret_admin_jwt_signature_key_2026";
  return new TextEncoder().encode(rawSecret.padEnd(32, "#"));
}

export interface AdminJwtPayload {
  email: string;
  role: "admin";
  full_name?: string;
  department?: string;
}

/**
 * Signs a cryptographic JWT for an authenticated admin session.
 */
export async function signAdminToken(payload: AdminJwtPayload): Promise<string> {
  const secret = getJwtSecret();
  return await new jose.SignJWT({
    email: payload.email.toLowerCase().trim(),
    role: "admin",
    full_name: payload.full_name || "Super Admin",
    department: payload.department || "Executive Leadership",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(payload.email.toLowerCase().trim())
    .setIssuedAt()
    .setExpirationTime(ADMIN_TOKEN_EXPIRY)
    .sign(secret);
}

/**
 * Cryptographically verifies an admin JWT token string.
 */
export async function verifyAdminToken(token: string): Promise<{
  valid: boolean;
  payload?: AdminJwtPayload;
  error?: string;
}> {
  if (!token || typeof token !== "string") {
    return { valid: false, error: "Missing admin token" };
  }

  try {
    const secret = getJwtSecret();
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });

    if (payload.role !== "admin") {
      return { valid: false, error: "Invalid role: admin required" };
    }

    return {
      valid: true,
      payload: {
        email: String(payload.email || payload.sub || ADMIN_EMAIL),
        role: "admin",
        full_name: payload.full_name as string | undefined,
        department: payload.department as string | undefined,
      },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Token verification failed";
    return { valid: false, error: message };
  }
}

/**
 * Verifies admin session from incoming request or Next.js cookie store.
 */
export async function verifyAdminSession(
  request?: {
    cookies?: { get(name: string): { value: string } | string | undefined };
    headers?: Headers | { get(name: string): string | null };
  } | Request
): Promise<{
  authorized: boolean;
  admin?: AdminJwtPayload;
  error?: string;
}> {
  let token: string | undefined;

  // 1. Try from request cookies
  if (request && "cookies" in request && typeof request.cookies?.get === "function") {
    const cookie = request.cookies.get(ADMIN_COOKIE_NAME);
    if (cookie) {
      token = typeof cookie === "string" ? cookie : cookie.value;
    }
  }

  // 2. Try from Request headers
  if (!token && request && "headers" in request && request.headers) {
    const authHeader =
      typeof request.headers.get === "function" ? request.headers.get("authorization") : null;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }
  }

  // 3. Fallback to Next.js cookies() dynamically
  if (!token) {
    try {
      const nextHeaders = await import("next/headers.js");
      const cookieStore = await nextHeaders.cookies();
      const cookie = cookieStore.get(ADMIN_COOKIE_NAME);
      if (cookie?.value) {
        token = cookie.value;
      }
    } catch {
      // In standalone, edge proxy, or test context
    }
  }

  if (!token) {
    return { authorized: false, error: "No admin session cookie or token provided" };
  }

  const result = await verifyAdminToken(token);
  if (!result.valid || !result.payload) {
    return { authorized: false, error: result.error || "Admin authentication invalid" };
  }

  return { authorized: true, admin: result.payload };
}
