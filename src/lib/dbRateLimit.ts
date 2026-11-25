/**
 * Distributed Rate Limiter backed by Upstash Redis.
 * Works across Vercel serverless instances with automatic TTL expiration.
 * Falls back to an in-memory window store only in non-production / offline test runs.
 */

import { getRedisClient, type RedisLikeClient } from "./redisClient.ts";

export interface DbRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
}

const devRateLimitFallback = new Map<string, { count: number; resetAt: number }>();

function checkInMemoryRateLimit(
  identifier: string,
  maxAttempts: number,
  windowSeconds: number
): DbRateLimitResult {
  const now = Date.now();
  const existing = devRateLimitFallback.get(identifier);

  if (!existing || now > existing.resetAt) {
    devRateLimitFallback.set(identifier, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    });
    return {
      allowed: true,
      remaining: Math.max(0, maxAttempts - 1),
      resetSeconds: windowSeconds,
    };
  }

  const resetSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  if (existing.count >= maxAttempts) {
    return { allowed: false, remaining: 0, resetSeconds };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, maxAttempts - existing.count),
    resetSeconds,
  };
}

/**
 * Checks and enforces a rate limit across serverless instances using Upstash Redis.
 */
export async function checkDbRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowSeconds: number = 900,
  customRedis?: RedisLikeClient | null
): Promise<DbRateLimitResult> {
  const redisKey = `rl:${identifier}`;

  try {
    const redis = customRedis !== undefined ? customRedis : getRedisClient();

    if (!redis) {
      return checkInMemoryRateLimit(identifier, maxAttempts, windowSeconds);
    }

    const count = await redis.incr(redisKey);
    let resetSeconds = windowSeconds;

    if (count === 1) {
      await redis.expire(redisKey, windowSeconds);
    } else {
      const ttl = await redis.ttl(redisKey);
      if (ttl < 0) {
        await redis.expire(redisKey, windowSeconds);
        resetSeconds = windowSeconds;
      } else {
        resetSeconds = Math.max(1, ttl);
      }
    }

    if (count > maxAttempts) {
      return {
        allowed: false,
        remaining: 0,
        resetSeconds,
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, maxAttempts - count),
      resetSeconds,
    };
  } catch (err) {
    console.warn("[RateLimit] Redis rate limit notice:", err);
    return {
      allowed: true,
      remaining: Math.max(0, maxAttempts - 1),
      resetSeconds: windowSeconds,
    };
  }
}

/**
 * Resets (deletes) the rate limit counter for an identifier.
 */
export async function resetDbRateLimit(
  identifier: string,
  customRedis?: RedisLikeClient | null
): Promise<void> {
  const redisKey = `rl:${identifier}`;
  try {
    const redis = customRedis !== undefined ? customRedis : getRedisClient();
    if (redis) {
      await redis.del(redisKey);
      return;
    }
  } catch (err) {
    console.warn("[RateLimit] Failed resetting Redis counter:", err);
  }
  devRateLimitFallback.delete(identifier);
}
