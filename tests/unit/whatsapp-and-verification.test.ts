import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { sendWhatsAppOtp } from "../../src/lib/whatsappService.ts";
import {
  issueContactProofToken,
  verifyContactProofToken,
  validateOrderContacts,
  isContactProofTokenConsumed,
  consumeContactProofTokens,
} from "../../src/lib/contactVerification.ts";
import {
  storeOtpCode,
  deleteOtpCode,
  verifyAndConsumeOtpCode,
} from "../../src/lib/otpStore.ts";
import {
  checkDbRateLimit,
  resetDbRateLimit,
} from "../../src/lib/dbRateLimit.ts";
import type { RedisLikeClient } from "../../src/lib/redisClient.ts";

describe("WhatsApp Service & Dual-Contact Verification Suite", () => {
  describe("1. WhatsApp OTP Messaging Service", () => {
    it("Rejects invalid mobile numbers with meaningful validation error", async () => {
      const res = await sendWhatsAppOtp({ to: "123", otp: "555555" });
      assert.equal(res.success, false);
      assert.match(res.error || "", /must be between 10 and 15 digits/i);
    });

    it("Dispatches WhatsApp OTP in graceful simulation mode when credentials not set", async () => {
      const origToken = process.env.WHATSAPP_ACCESS_TOKEN;
      delete process.env.WHATSAPP_ACCESS_TOKEN;
      try {
        const res = await sendWhatsAppOtp({ to: "9876543210", otp: "847291" });
        assert.equal(res.success, true);
        assert.equal(res.simulated, true);
        assert.ok(res.messageId?.startsWith("wa_sim_"));
      } finally {
        if (origToken) process.env.WHATSAPP_ACCESS_TOKEN = origToken;
      }
    });

    it("Accepts properly formatted E.164 Indian mobile number", async () => {
      const origToken = process.env.WHATSAPP_ACCESS_TOKEN;
      delete process.env.WHATSAPP_ACCESS_TOKEN;
      try {
        const res = await sendWhatsAppOtp({ to: "+919876543210", otp: "123456" });
        assert.equal(res.success, true);
        assert.equal(res.simulated, true);
      } finally {
        if (origToken) process.env.WHATSAPP_ACCESS_TOKEN = origToken;
      }
    });

    it("Rejects sending OTP to business sender mobile number", async () => {
      const res = await sendWhatsAppOtp({ to: "9429243344", otp: "123456" });
      assert.equal(res.success, false);
      assert.match(res.error || "", /Cannot send verification OTP to the business sender number/i);
    });

    it("Auto-retries Meta WhatsApp template with URL Copy-Code button when #131008 is returned", async () => {
      const envRef = process.env as Record<string, string | undefined>;
      const origToken = envRef.WHATSAPP_ACCESS_TOKEN;
      const origPhoneId = envRef.WHATSAPP_PHONE_NUMBER_ID;
      const origTpl = envRef.WHATSAPP_TEMPLATE_NAME;
      const origHasBtn = envRef.WHATSAPP_TEMPLATE_HAS_BUTTON;
      const origFetch = globalThis.fetch;

      envRef.WHATSAPP_ACCESS_TOKEN = "meta-test-token";
      envRef.WHATSAPP_PHONE_NUMBER_ID = "123456789";
      envRef.WHATSAPP_TEMPLATE_NAME = "avsaraa_auth_otp";
      delete envRef.WHATSAPP_TEMPLATE_HAS_BUTTON;

      const recordedBodies: Array<Record<string, unknown>> = [];
      globalThis.fetch = (async (_input: string | URL | Request, init?: RequestInit) => {
        const parsed = JSON.parse(String(init?.body || "{}")) as Record<string, unknown>;
        recordedBodies.push(parsed);

        if (recordedBodies.length === 1) {
          return new Response(
            JSON.stringify({
              error: {
                message: "(#131008) Required parameter is missing",
                code: 131008,
                error_data: { details: "buttons: Button at index 0 of type Url requires a parameter" },
              },
            }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ messages: [{ id: "wamid.retry.ok" }] }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }) as typeof fetch;

      try {
        const res = await sendWhatsAppOtp({ to: "9876543210", otp: "654321" });
        assert.equal(res.success, true);
        assert.equal(res.messageId, "wamid.retry.ok");
        assert.equal(recordedBodies.length, 2);

        const firstTpl = recordedBodies[0].template as { components?: Array<{ type: string }> };
        const secondTpl = recordedBodies[1].template as { components?: Array<{ type: string; sub_type?: string }> };
        assert.equal(firstTpl.components?.some((c) => c.type === "button"), false);
        assert.equal(secondTpl.components?.some((c) => c.type === "button" && c.sub_type === "url"), true);
      } finally {
        globalThis.fetch = origFetch;
        if (origToken !== undefined) envRef.WHATSAPP_ACCESS_TOKEN = origToken;
        else delete envRef.WHATSAPP_ACCESS_TOKEN;
        if (origPhoneId !== undefined) envRef.WHATSAPP_PHONE_NUMBER_ID = origPhoneId;
        else delete envRef.WHATSAPP_PHONE_NUMBER_ID;
        if (origTpl !== undefined) envRef.WHATSAPP_TEMPLATE_NAME = origTpl;
        else delete envRef.WHATSAPP_TEMPLATE_NAME;
        if (origHasBtn !== undefined) envRef.WHATSAPP_TEMPLATE_HAS_BUTTON = origHasBtn;
        else delete envRef.WHATSAPP_TEMPLATE_HAS_BUTTON;
      }
    });
  });

  describe("2. Cryptographic Contact Proof Tokens", () => {
    it("Issues and verifies valid phone proof token", () => {
      const phone = "+919876543210";
      const token = issueContactProofToken(phone, "order_phone");
      assert.ok(token);

      const check = verifyContactProofToken(token, phone, "order_phone");
      assert.equal(check.valid, true);
    });

    it("Issues and verifies valid email proof token", () => {
      const email = "priya.sharma@example.com";
      const token = issueContactProofToken(email, "order_email");
      assert.ok(token);

      const check = verifyContactProofToken(token, email, "order_email");
      assert.equal(check.valid, true);
    });

    it("Strictly rejects token when contact does not match", () => {
      const token = issueContactProofToken("+919876543210", "order_phone");
      const check = verifyContactProofToken(token, "+919999999999", "order_phone");
      assert.equal(check.valid, false);
      assert.match(check.error || "", /different contact/i);
    });

    it("Strictly rejects forged or tampered token signatures", () => {
      const token = issueContactProofToken("user@example.com", "order_email");
      const tampered = token.slice(0, -4) + "abcd";
      const check = verifyContactProofToken(tampered, "user@example.com", "order_email");
      assert.equal(check.valid, false);
      assert.match(check.error || "", /cryptographic signature/i);
    });

    it("Strictly rejects expired proof tokens", () => {
      const email = "user@example.com";
      const token = issueContactProofToken(email, "order_email");
      // Simulate checking with maxAgeMs = -1 (already expired)
      const check = verifyContactProofToken(token, email, "order_email", -1000);
      assert.equal(check.valid, false);
      assert.match(check.error || "", /expired/i);
    });

    it("Strictly rejects token when purpose does not match expected purpose", () => {
      const contact = "rohan@example.com";
      const token = issueContactProofToken(contact, "order_email");
      // Try to present order_email token for order_phone
      const check = verifyContactProofToken(token, contact, "order_phone");
      assert.equal(check.valid, false);
      assert.match(check.error || "", /purpose mismatch/i);
    });

    it("Detects single-use token consumption and prevents token replay", async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const storage: Record<string, any> = {};
      const mockClient = {
        from: () => ({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          insert: async (data: any) => {
            storage[data.otp_hash] = data;
            return { error: null };
          },
          select: () => ({
            eq: (_col: string, val: string) => ({
              limit: async () => ({
                data: storage[val] ? [storage[val]] : [],
                error: null,
              }),
            }),
          }),
        }),
      };

      const phone = "+919876543210";
      const token = issueContactProofToken(phone, "order_phone");

      // Initially not consumed
      const consumedBefore = await isContactProofTokenConsumed(token, mockClient);
      assert.equal(consumedBefore, false);

      // Consume token
      await consumeContactProofTokens({ phone_token: token }, mockClient);

      // Now consumed
      const consumedAfter = await isContactProofTokenConsumed(token, mockClient);
      assert.equal(consumedAfter, true);
    });
  });

  describe("3. Order Dual-Contact Verification Engine", () => {
    it("Rejects order when neither WhatsApp phone nor email is verified", () => {
      const check = validateOrderContacts({
        phone: "9876543210",
        email: "rohan@example.com",
        verificationTokens: {
          phone_token: undefined,
          email_token: undefined,
        },
      });

      assert.equal(check.valid, false);
      assert.match(check.error || "", /Both WhatsApp mobile number and email address/i);
    });

    it("Rejects order when WhatsApp phone token is missing or invalid", () => {
      const email = "rohan@example.com";
      const emailToken = issueContactProofToken(email, "order_email");

      const check = validateOrderContacts({
        phone: "9876543210",
        email,
        verificationTokens: {
          phone_token: undefined,
          email_token: emailToken,
        },
      });

      assert.equal(check.valid, false);
      assert.match(check.error || "", /verified via WhatsApp OTP/i);
    });

    it("Rejects order when email token is missing or invalid", () => {
      const phone = "+919876543210";
      const phoneToken = issueContactProofToken(phone, "order_phone");

      const check = validateOrderContacts({
        phone,
        email: "rohan@example.com",
        verificationTokens: {
          phone_token: phoneToken,
          email_token: undefined,
        },
      });

      assert.equal(check.valid, false);
      assert.match(check.error || "", /verified via Email OTP/i);
    });

    it("Accepts order when both valid WhatsApp and Email tokens are provided", () => {
      const phone = "+919876543210";
      const email = "rohan@example.com";

      const phoneToken = issueContactProofToken(phone, "order_phone");
      const emailToken = issueContactProofToken(email, "order_email");

      const check = validateOrderContacts({
        phone,
        email,
        verificationTokens: {
          phone_token: phoneToken,
          email_token: emailToken,
        },
      });

      assert.equal(check.valid, true);
      assert.equal(check.phoneVerified, true);
      assert.equal(check.emailVerified, true);
    });

    it("Accepts order for authenticated user with pre-verified session credentials", () => {
      const phone = "+919876543210";
      const email = "ananya@example.com";

      const check = validateOrderContacts({
        phone,
        email,
        user: {
          id: "u-12345",
          email,
          email_confirmed_at: new Date().toISOString(),
          phone,
          phone_confirmed_at: new Date().toISOString(),
        },
        userProfile: {
          phone_number: phone,
          phone_verified: true,
          email,
        },
      });

      assert.equal(check.valid, true);
      assert.equal(check.phoneVerified, true);
      assert.equal(check.emailVerified, true);
    });

    it("Rejects synthetic @phone.avsaraa.in as verified user email for orders", () => {
      const phone = "+919876543210";
      const phoneToken = issueContactProofToken(phone, "order_phone");
      const check = validateOrderContacts({
        phone,
        email: "919876543210@phone.avsaraa.in",
        verificationTokens: {
          phone_token: phoneToken,
          email_token: undefined,
        },
        user: {
          id: "u-whatsapp",
          email: "919876543210@phone.avsaraa.in",
          email_confirmed_at: new Date().toISOString(),
          phone,
          phone_confirmed_at: new Date().toISOString(),
        },
      });

      assert.equal(check.valid, false);
      assert.equal(check.emailVerified, false);
      assert.match(check.error || "", /verified via Email OTP/i);
    });

    it("Strictly rejects unverified profile phone number from bypassing phone verification", () => {
      const phone = "+919876543210";
      const email = "priya@example.com";
      const emailToken = issueContactProofToken(email, "order_email");

      const check = validateOrderContacts({
        phone,
        email,
        verificationTokens: {
          email_token: emailToken,
        },
        user: {
          id: "u-12345",
          email,
          email_confirmed_at: new Date().toISOString(),
          phone: null,
          phone_confirmed_at: null,
        },
        userProfile: {
          phone_number: phone,
          phone_verified: false, // Not verified!
          email,
        },
      });

      assert.equal(check.valid, false);
      assert.equal(check.phoneVerified, false);
      assert.match(check.error || "", /verified via WhatsApp OTP/i);
    });

    it("Production mode strictly rejects unverified contacts even when ENABLE_TEST_OTP is set", () => {
      const envRef = process.env as Record<string, string | undefined>;
      const origNodeEnv = envRef.NODE_ENV;
      const origTestOtp = envRef.ENABLE_TEST_OTP;
      envRef.NODE_ENV = "production";
      envRef.ENABLE_TEST_OTP = "true";

      try {
        const check = validateOrderContacts({
          phone: "9876543210",
          email: "guest@example.com",
        });
        assert.equal(check.valid, false);
        assert.match(check.error || "", /Both WhatsApp mobile number and email address/i);
      } finally {
        envRef.NODE_ENV = origNodeEnv;
        if (origTestOtp !== undefined) {
          envRef.ENABLE_TEST_OTP = origTestOtp;
        } else {
          delete envRef.ENABLE_TEST_OTP;
        }
      }
    });
  });

  describe("4. Upstash Redis OTP, Replay Protection & Rate Limiting", () => {
    function createMockRedis(): RedisLikeClient {
      const store = new Map<string, { value: string; expiresAt: number | null }>();
      const purgeIfExpired = (k: string) => {
        const entry = store.get(k);
        if (entry?.expiresAt && entry.expiresAt <= Date.now()) {
          store.delete(k);
          return null;
        }
        return entry || null;
      };

      return {
        async get<T = unknown>(key: string): Promise<T | null> {
          const entry = purgeIfExpired(key);
          return (entry ? (entry.value as unknown as T) : null);
        },
        async set(key: string, value: string, opts?: { ex?: number; nx?: boolean }) {
          purgeIfExpired(key);
          if (opts?.nx && store.has(key)) return null;
          store.set(key, {
            value,
            expiresAt: opts?.ex ? Date.now() + opts.ex * 1000 : null,
          });
          return "OK";
        },
        async del(...keys: string[]) {
          let count = 0;
          for (const k of keys) {
            if (store.delete(k)) count++;
          }
          return count;
        },
        async exists(...keys: string[]) {
          let count = 0;
          for (const k of keys) {
            if (purgeIfExpired(k)) count++;
          }
          return count;
        },
        async incr(key: string) {
          const existing = purgeIfExpired(key);
          const next = (existing ? Number(existing.value) : 0) + 1;
          store.set(key, {
            value: String(next),
            expiresAt: existing?.expiresAt ?? null,
          });
          return next;
        },
        async expire(key: string, seconds: number) {
          const existing = store.get(key);
          if (!existing) return 0;
          existing.expiresAt = Date.now() + seconds * 1000;
          return 1;
        },
        async ttl(key: string) {
          const existing = purgeIfExpired(key);
          if (!existing) return -2;
          if (!existing.expiresAt) return -1;
          return Math.max(1, Math.ceil((existing.expiresAt - Date.now()) / 1000));
        },
      };
    }

    it("Stores OTP hash in Redis, verifies atomically once, and blocks reuse or rollback", async () => {
      const mockRedis = createMockRedis();
      const otpHash = crypto.createHash("sha256").update("482910").digest("hex");

      await storeOtpCode({
        contact: "+918732993344",
        otpHash,
        channel: "whatsapp",
        ttlSeconds: 300,
        customRedis: mockRedis,
      });

      const wrong = await verifyAndConsumeOtpCode(["+918732993344"], "000000", mockRedis);
      assert.equal(wrong.valid, false);

      const ok = await verifyAndConsumeOtpCode(["8732993344", "+918732993344"], "482910", mockRedis);
      assert.equal(ok.valid, true);
      assert.equal(ok.matchedContact, "+918732993344");

      const replay = await verifyAndConsumeOtpCode(["+918732993344"], "482910", mockRedis);
      assert.equal(replay.valid, false);

      await storeOtpCode({
        contact: "patron@example.com",
        otpHash,
        channel: "email",
        customRedis: mockRedis,
      });
      await deleteOtpCode("patron@example.com", mockRedis);
      const afterDelete = await verifyAndConsumeOtpCode(["patron@example.com"], "482910", mockRedis);
      assert.equal(afterDelete.valid, false);
    });

    it("Enforces single-use proof token replay protection via Redis SET NX EX", async () => {
      const mockRedis = createMockRedis();
      const phoneToken = issueContactProofToken("+918732993344", "order_phone");

      assert.equal(await isContactProofTokenConsumed(phoneToken, mockRedis), false);

      const firstConsume = await consumeContactProofTokens({ phone_token: phoneToken }, mockRedis);
      assert.equal(firstConsume.success, true);
      assert.equal(await isContactProofTokenConsumed(phoneToken, mockRedis), true);

      const secondConsume = await consumeContactProofTokens({ phone_token: phoneToken }, mockRedis);
      assert.equal(secondConsume.success, false);
      assert.equal(secondConsume.duplicate, true);
    });

    it("Enforces distributed rate limit counters and resets via Redis", async () => {
      const mockRedis = createMockRedis();
      const key = "otp-send:+918732993344";

      const r1 = await checkDbRateLimit(key, 2, 300, mockRedis);
      assert.equal(r1.allowed, true);
      assert.equal(r1.remaining, 1);

      const r2 = await checkDbRateLimit(key, 2, 300, mockRedis);
      assert.equal(r2.allowed, true);
      assert.equal(r2.remaining, 0);

      const r3 = await checkDbRateLimit(key, 2, 300, mockRedis);
      assert.equal(r3.allowed, false);
      assert.equal(r3.remaining, 0);

      await resetDbRateLimit(key, mockRedis);
      const r4 = await checkDbRateLimit(key, 2, 300, mockRedis);
      assert.equal(r4.allowed, true);
    });
  });
});
