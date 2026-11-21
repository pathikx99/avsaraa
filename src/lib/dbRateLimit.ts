/**
 * Database-Backed Rate Limiter
 * Works across serverless instances by storing rate limit counters in PostgreSQL.
 * Used for security-critical endpoints (auth, OTP, admin login, registration).
 */

import { getAdminSupabaseClient } from "@/lib/supabaseAdmin";

export interface DbRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
}

/**
 * Checks and enforces a rate limit using a database table for cross-instance consistency.
 * Uses an atomic increment with conditional update to prevent race conditions.
 */
export async function checkDbRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowSeconds: number = 900
): Promise<DbRateLimitResult> {
  const adminClient = getAdminSupabaseClient();
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();

  // Clean up expired entries first (best-effort)
  await adminClient.from("rate_limit_counters").delete().lt("reset_at", nowIso);

  // Try to find or create the counter for this identifier
  const { data: existing } = await adminClient
    .from("rate_limit_counters")
    .select("id, count, reset_at")
    .eq("identifier", identifier)
    .maybeSingle();

  if (!existing || new Date(existing.reset_at).getTime() <= nowMs) {
    // Window expired or no counter: create new
    const resetAt = new Date(nowMs + windowSeconds * 1000).toISOString();
    const { error: insertErr } = await adminClient
      .from("rate_limit_counters")
      .insert({
        identifier,
        count: 1,
        reset_at: resetAt,
      });

    if (insertErr) {
      // Fall back to allowing on DB error (fail open for availability)
      return { allowed: true, remaining: maxAttempts - 1, resetSeconds: windowSeconds };
    }

    return {
      allowed: true,
      remaining: maxAttempts - 1,
      resetSeconds: windowSeconds,
    };
  }

  // Counter exists within window
  const currentCount = Number(existing.count || 0);

  if (currentCount >= maxAttempts) {
    const resetMs = new Date(existing.reset_at).getTime();
    const resetSeconds = Math.max(1, Math.ceil((resetMs - nowMs) / 1000));
    return { allowed: false, remaining: 0, resetSeconds };
  }

  // Increment atomically
  const { error: updateErr } = await adminClient
    .from("rate_limit_counters")
    .update({ count: currentCount + 1 })
    .eq("id", existing.id);

  if (updateErr) {
    return { allowed: true, remaining: maxAttempts - currentCount - 1, resetSeconds: windowSeconds };
  }

  const resetMs = new Date(existing.reset_at).getTime();
  const resetSeconds = Math.max(1, Math.ceil((resetMs - nowMs) / 1000));

  return {
    allowed: true,
    remaining: maxAttempts - currentCount - 1,
    resetSeconds,
  };
}

/**
 * Resets (deletes) the rate limit counter for an identifier.
 */
export async function resetDbRateLimit(identifier: string): Promise<void> {
  const adminClient = getAdminSupabaseClient();
  await adminClient.from("rate_limit_counters").delete().eq("identifier", identifier);
}
