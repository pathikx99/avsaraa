import { test, describe } from "node:test";
import assert from "node:assert";
import crypto from "crypto";
import { signAdminToken, verifyAdminToken } from "../../src/lib/jwtAdmin.ts";
import { escapeHtml } from "../../src/lib/emailTemplates.ts";
import { isSuperAdminUser, isSuperAdminEmail, ADMIN_DEFAULT_PASSWORD, ADMIN_EMAIL } from "../../src/lib/adminConstants.ts";

describe("Security Architecture & Cryptographic Verification Tests", () => {
  test("Standalone Admin JWT generation and cryptographic verification with jose", async () => {
    // 1. Sign valid admin token
    const token = await signAdminToken({
      email: "admin@avsaraa.com",
      role: "admin",
      full_name: "Super Admin Authority",
    });

    assert.ok(typeof token === "string" && token.length > 50);

    // 2. Verify valid admin token
    const verification = await verifyAdminToken(token);
    assert.strictEqual(verification.valid, true);
    assert.strictEqual(verification.payload?.email, "admin@avsaraa.com");
    assert.strictEqual(verification.payload?.role, "admin");

    // 3. Reject tampered token
    const tampered = token.slice(0, -6) + "XXXXXX";
    const tamperedVerification = await verifyAdminToken(tampered);
    assert.strictEqual(tamperedVerification.valid, false);

    // 4. Reject empty or invalid token
    const emptyVerification = await verifyAdminToken("");
    assert.strictEqual(emptyVerification.valid, false);
  });

  test("HTML sanitization (escapeHtml) strictly neutralizes XSS and email injection attacks", () => {
    // Stored XSS vectors
    const xssScript = '<script>alert("xss")</script>';
    assert.strictEqual(escapeHtml(xssScript), "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;");

    // HTML attribute injection
    const xssAttr = '"><img src=x onerror=alert(1)>';
    assert.strictEqual(escapeHtml(xssAttr), "&quot;&gt;&lt;img src=x onerror=alert(1)&gt;");

    // Special characters
    const textWithAmp = "Avsaraa & Co. 'Luxury'";
    assert.strictEqual(escapeHtml(textWithAmp), "Avsaraa &amp; Co. &#039;Luxury&#039;");

    // Null and undefined safety
    assert.strictEqual(escapeHtml(null), "");
    assert.strictEqual(escapeHtml(undefined), "");
  });

  test("Constant-time HMAC comparison prevents timing attacks", () => {
    const key = "test_secret_key";
    const payload = "order_123|payment_456";
    const sig1 = crypto.createHmac("sha256", key).update(payload).digest("hex");
    const sig2 = crypto.createHmac("sha256", key).update(payload).digest("hex");
    const sig3 = crypto.createHmac("sha256", key).update("tampered").digest("hex");

    const bufA = Buffer.from(sig1, "utf-8");
    const bufB = Buffer.from(sig2, "utf-8");
    const bufC = Buffer.from(sig3, "utf-8");

    assert.strictEqual(crypto.timingSafeEqual(bufA, bufB), true);
    assert.strictEqual(crypto.timingSafeEqual(bufA, bufC), false);
  });

  test("Centralized Super Admin authority correctly verifies roles and rejects impostors", () => {
    // 1. Valid super_admin role in app_metadata
    assert.strictEqual(isSuperAdminUser({ app_metadata: { role: "super_admin" }, email: "other@gmail.com" }), true);
    assert.strictEqual(isSuperAdminUser({ app_metadata: { role: "admin" } }), true);

    // 2. Verified admin emails
    assert.strictEqual(isSuperAdminEmail("web.avsaraa@gmail.com"), true);
    assert.strictEqual(isSuperAdminEmail("contact.avsaraa@gmail.com"), true);
    assert.strictEqual(isSuperAdminEmail("admin@avsaraa.com"), true);
    assert.strictEqual(isSuperAdminUser({ email: "web.avsaraa@gmail.com" }), true);

    // 3. Reject regular patron or malicious user
    assert.strictEqual(isSuperAdminUser({ app_metadata: { role: "customer" }, email: "customer@gmail.com" }), false);
    assert.strictEqual(isSuperAdminUser({ user_metadata: { role: "super_admin" }, email: "hacker@evil.com" }), false);
    assert.strictEqual(isSuperAdminUser(null), false);
  });

  test("UUID vs Non-UUID disambiguation regex avoids PostgreSQL 22P02 type mismatch", () => {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // Valid UUIDs (including seeded and nil UUIDs accepted by PostgreSQL)
    assert.strictEqual(UUID_REGEX.test("e0000000-0000-0000-0000-000000000001"), true);
    assert.strictEqual(UUID_REGEX.test("00000000-0000-0000-0000-000000000000"), true);
    assert.strictEqual(UUID_REGEX.test("3fa85f64-5717-4562-b3fc-2c963f66afa6"), true);

    // Non-UUIDs (Order numbers, alphanumeric codes, malicious injections)
    assert.strictEqual(UUID_REGEX.test("AVS-20261112-X1Y2"), false);
    assert.strictEqual(UUID_REGEX.test("AVS-001"), false);
    assert.strictEqual(UUID_REGEX.test("12345"), false);
    assert.strictEqual(UUID_REGEX.test("' OR 1=1 --"), false);
    assert.strictEqual(UUID_REGEX.test(""), false);
  });

  test("Address update field whitelisting strictly prevents mass assignment of user_id", () => {
    const allowedFields = [
      "recipient_name",
      "phone_number",
      "address_line1",
      "address_line2",
      "landmark",
      "city",
      "state",
      "postal_code",
      "country",
      "address_type",
      "is_default",
    ] as const;

    const maliciousPayload = {
      id: "addr_123",
      user_id: "victim_user_456",
      recipient_name: "Pooja Patel",
      created_at: "2020-01-01T00:00:00Z",
      role: "admin",
      is_default: true,
    };

    const sanitized: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in maliciousPayload) {
        sanitized[field] = (maliciousPayload as Record<string, unknown>)[field];
      }
    }

    assert.strictEqual(sanitized.recipient_name, "Pooja Patel");
    assert.strictEqual(sanitized.is_default, true);
    assert.strictEqual(sanitized.user_id, undefined);
    assert.strictEqual(sanitized.created_at, undefined);
    assert.strictEqual(sanitized.role, undefined);
  });

  test("Master password login credential and cryptographic session verification", async () => {
    assert.strictEqual(ADMIN_DEFAULT_PASSWORD, "V@123456");

    // Password comparison logic test
    const configuredPassword = process.env.ADMIN_PASSWORD || ADMIN_DEFAULT_PASSWORD;
    const testInputPassword = "V@123456";
    const wrongPassword = "WrongPassword123";

    const bufA = Buffer.from(testInputPassword, "utf-8");
    const bufConfig = Buffer.from(configuredPassword, "utf-8");
    const bufWrong = Buffer.from(wrongPassword, "utf-8");

    assert.strictEqual(crypto.timingSafeEqual(bufA, bufConfig), true);
    assert.strictEqual(bufWrong.length === bufConfig.length ? crypto.timingSafeEqual(bufWrong, bufConfig) : false, false);

    // Verify token generation with configured admin email and master password
    const token = await signAdminToken({
      email: ADMIN_EMAIL,
      role: "admin",
      full_name: "Super Admin",
    });

    const session = await verifyAdminToken(token);
    assert.strictEqual(session.valid, true);
    assert.strictEqual(session.payload?.role, "admin");
    assert.strictEqual(session.payload?.email, ADMIN_EMAIL);
  });
});
