import { Redis } from "@upstash/redis";

/**
 * Minimal Redis command interface needed by OTP, rate limit, and proof-token stores.
 * Satisfied by `@upstash/redis` and lightweight unit-test mocks.
 */
export interface RedisLikeClient {
  get<T = unknown>(key: string): Promise<T | null>;
  set(
    key: string,
    value: string,
    opts?: { ex?: number; nx?: boolean }
  ): Promise<unknown>;
  del(...keys: string[]): Promise<number>;
  exists(...keys: string[]): Promise<number>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  ttl(key: string): Promise<number>;
}

let cachedClient: Redis | null = null;
let cachedSignature = "";

/**
 * Returns true when Upstash Redis REST credentials are present in environment variables.
 */
export function isRedisConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  );
}

/**
 * Returns a singleton Upstash Redis REST client suitable for Vercel serverless routes.
 * Throws in production if credentials are missing; returns null in non-production offline mode.
 */
export function getRedisClient(): RedisLikeClient | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim() || "";
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim() || "";

  if (!url || !token) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Critical Security Configuration: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be configured in production."
      );
    }
    return null;
  }

  const sig = `${url}:${token.slice(0, 8)}`;
  if (!cachedClient || cachedSignature !== sig) {
    cachedClient = new Redis({ url, token });
    cachedSignature = sig;
  }

  return cachedClient as unknown as RedisLikeClient;
}
