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

  for (let attempt = 0; attempt < 3; attempt++) {
    // Query active rows without maybeSingle() so concurrent duplicate inserts never crash
    const { data: activeRows, error: queryErr } = await adminClient
      .from("rate_limit_counters")
      .select("id, count, reset_at")
      .eq("identifier", identifier)
      .gt("reset_at", nowIso)
      .order("count", { ascending: false })
      .limit(5);

    if (queryErr) {
      return { allowed: true, remaining: maxAttempts - 1, resetSeconds: windowSeconds };
    }

    const existing = activeRows && activeRows.length > 0 ? activeRows[0] : null;

    if (!existing) {
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
        return { allowed: true, remaining: maxAttempts - 1, resetSeconds: windowSeconds };
      }

      return {
        allowed: true,
        remaining: Math.max(0, maxAttempts - 1),
        resetSeconds: windowSeconds,
      };
    }

    // Aggregate counts if concurrent initial requests created duplicate active rows
    const currentCount = activeRows.reduce((sum, row) => Math.max(sum, Number(row.count || 0)), 0);
    const resetMs = new Date(existing.reset_at).getTime();
    const resetSeconds = Math.max(1, Math.ceil((resetMs - nowMs) / 1000));

    if (currentCount >= maxAttempts) {
      return { allowed: false, remaining: 0, resetSeconds };
    }

    // Conditionally increment matching the observed count to avoid lost updates
    const { data: updatedRows, error: updateErr } = await adminClient
      .from("rate_limit_counters")
      .update({ count: currentCount + 1 })
      .eq("id", existing.id)
      .eq("count", Number(existing.count || 0))
      .select("count");

    if (updateErr) {
      return { allowed: true, remaining: Math.max(0, maxAttempts - currentCount - 1), resetSeconds };
    }

    if (updatedRows && updatedRows.length > 0) {
      return {
        allowed: true,
        remaining: Math.max(0, maxAttempts - (currentCount + 1)),
        resetSeconds,
      };
    }
  }

  return { allowed: false, remaining: 0, resetSeconds: windowSeconds };
}

/**
 * Resets (deletes) the rate limit counter for an identifier.
 */
export async function resetDbRateLimit(identifier: string): Promise<void> {
  const adminClient = getAdminSupabaseClient();
  await adminClient.from("rate_limit_counters").delete().eq("identifier", identifier);
}
