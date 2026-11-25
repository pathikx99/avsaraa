import crypto from "crypto";
import { getRedisClient, type RedisLikeClient } from "./redisClient.ts";

export interface StoreOtpParams {
  contact: string;
  otpHash: string;
  channel: "whatsapp" | "email";
  ttlSeconds?: number;
  customRedis?: RedisLikeClient | null;
}

export interface VerifyOtpResult {
  valid: boolean;
  matchedContact?: string;
}

interface StoredOtpRecord {
  otpHash: string;
  channel: string;
  expiresAt?: number;
}

// Local development / offline unit-test fallback store when Redis env vars are absent
const devOtpFallbackStore = new Map<string, StoredOtpRecord>();

function buildOtpKey(contact: string): string {
  return `otp:code:${contact.trim()}`;
}

function timingSafeHexMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf-8");
  const bufB = Buffer.from(b, "utf-8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function parseOtpRecord(raw: unknown): StoredOtpRecord | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as StoredOtpRecord;
      return parsed && typeof parsed.otpHash === "string" ? parsed : null;
    } catch {
      return null;
    }
  }
  if (typeof raw === "object" && "otpHash" in raw) {
    const record = raw as StoredOtpRecord;
    return typeof record.otpHash === "string" ? record : null;
  }
  return null;
}

/**
 * Stores a hashed OTP for a contact in Upstash Redis with automatic expiration.
 * Overwrites any prior unconsumed code for the same contact automatically.
 */
export async function storeOtpCode(params: StoreOtpParams): Promise<void> {
  const { contact, otpHash, channel, ttlSeconds = 300, customRedis } = params;
  const key = buildOtpKey(contact);
  const payload: StoredOtpRecord = { otpHash, channel };
  const redis = customRedis !== undefined ? customRedis : getRedisClient();

  if (redis) {
    await redis.set(key, JSON.stringify(payload), { ex: ttlSeconds });
    return;
  }

  // Non-production offline fallback only (getRedisClient throws in production if unconfigured)
  devOtpFallbackStore.set(key, {
    ...payload,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

/**
 * Removes any pending OTP code for a contact (e.g., provider dispatch failure rollback).
 */
export async function deleteOtpCode(
  contact: string,
  customRedis?: RedisLikeClient | null
): Promise<void> {
  const key = buildOtpKey(contact);
  const redis = customRedis !== undefined ? customRedis : getRedisClient();

  if (redis) {
    await redis.del(key);
    return;
  }

  devOtpFallbackStore.delete(key);
}

/**
 * Verifies a plaintext OTP against stored hashes for candidate contact aliases
 * and atomically consumes the matched Redis key (`DEL > 0`) to prevent double use.
 */
export async function verifyAndConsumeOtpCode(
  contacts: string[],
  candidateOtp: string,
  customRedis?: RedisLikeClient | null
): Promise<VerifyOtpResult> {
  const uniqueContacts = Array.from(
    new Set(contacts.map((c) => c.trim()).filter(Boolean))
  );
  if (uniqueContacts.length === 0 || !candidateOtp) {
    return { valid: false };
  }

  const candidateHash = crypto.createHash("sha256").update(candidateOtp).digest("hex");
  const redis = customRedis !== undefined ? customRedis : getRedisClient();

  if (redis) {
    for (const contact of uniqueContacts) {
      const key = buildOtpKey(contact);
      const raw = await redis.get<unknown>(key);
      const record = parseOtpRecord(raw);
      if (!record?.otpHash) continue;

      if (timingSafeHexMatch(candidateHash, record.otpHash)) {
        // Atomic single-use check: only the caller whose DEL removes the key succeeds
        const deleted = await redis.del(key);
        if (deleted > 0) {
          return { valid: true, matchedContact: contact };
        }
      }
    }
    return { valid: false };
  }

  const now = Date.now();
  for (const contact of uniqueContacts) {
    const key = buildOtpKey(contact);
    const record = devOtpFallbackStore.get(key);
    if (!record) continue;
    if (record.expiresAt && record.expiresAt < now) {
      devOtpFallbackStore.delete(key);
      continue;
    }
    if (timingSafeHexMatch(candidateHash, record.otpHash)) {
      devOtpFallbackStore.delete(key);
      return { valid: true, matchedContact: contact };
    }
  }

  return { valid: false };
}
