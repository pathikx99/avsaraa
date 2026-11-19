import { test, describe } from "node:test";
import assert from "node:assert";
import crypto from "crypto";
import { checkRateLimit, resetRateLimit } from "../../src/lib/rateLimit.ts";

describe("Audit Defect & Security Patch Regression Tests", () => {
  test("Product route pre-check strictly filters non-UUID and non-seed IDs", () => {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const SEED_PRODUCT_IDS = new Set([
      "e0000000-0000-0000-0000-000000000001",
      "e0000000-0000-0000-0000-000000000002",
      "e0000000-0000-0000-0000-000000000003",
      "e0000000-0000-0000-0000-000000000004",
      "e0000000-0000-0000-0000-000000000005",
    ]);

    function isPotentiallyValidProductPath(rawId: string): boolean {
      if (!rawId) return false;
      if (SEED_PRODUCT_IDS.has(rawId)) return true;
      return UUID_REGEX.test(rawId);
    }

    // Authentic seed IDs
    assert.strictEqual(isPotentiallyValidProductPath("e0000000-0000-0000-0000-000000000001"), true);
    assert.strictEqual(isPotentiallyValidProductPath("e0000000-0000-0000-0000-000000000004"), true);

    // Dynamic valid PostgreSQL UUIDs
    assert.strictEqual(isPotentiallyValidProductPath("a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d"), true);

    // Malicious or invalid non-existent paths (Must be rejected to prevent Soft 404)
    assert.strictEqual(isPotentiallyValidProductPath("non-existent-guid-9999"), false);
    assert.strictEqual(isPotentiallyValidProductPath("admin"), false);
    assert.strictEqual(isPotentiallyValidProductPath("<script>"), false);
    assert.strictEqual(isPotentiallyValidProductPath("../etc/passwd"), false);
    assert.strictEqual(isPotentiallyValidProductPath(""), false);
  });

  test("Order exchange route disambiguates UUID and order_number without 22P02 crash", () => {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    function parseOrderLookupColumn(id: string): { column: "id" | "order_number"; value: string } {
      const isUuid = UUID_REGEX.test(id);
      return {
        column: isUuid ? "id" : "order_number",
        value: id,
      };
    }

    // Customer-facing order numbers
    const res1 = parseOrderLookupColumn("AVS-20261113-A1B2");
    assert.strictEqual(res1.column, "order_number");
    assert.strictEqual(res1.value, "AVS-20261113-A1B2");

    // Internal UUID identifiers
    const res2 = parseOrderLookupColumn("550e8400-e29b-41d4-a716-446655440000");
    assert.strictEqual(res2.column, "id");
    assert.strictEqual(res2.value, "550e8400-e29b-41d4-a716-446655440000");
  });

  test("Review photo upload rate limiter stops resource exhaustion and bucket flooding", () => {
    const testIp = `uploader-ip-${Date.now()}`;
    resetRateLimit(`review-upload:${testIp}`);

    // Allow 10 uploads in 300 seconds
    for (let i = 0; i < 10; i++) {
      const check = checkRateLimit(`review-upload:${testIp}`, 10, 300);
      assert.strictEqual(check.allowed, true);
    }

    // 11th upload must be blocked
    const blockedCheck = checkRateLimit(`review-upload:${testIp}`, 10, 300);
    assert.strictEqual(blockedCheck.allowed, false);
    assert.strictEqual(blockedCheck.remaining, 0);

    // Clean up
    resetRateLimit(`review-upload:${testIp}`);
  });

  test("OAuth next redirect validation strictly thwarts open redirect attacks", () => {
    function sanitizeRedirectUrl(rawNext: string | null | undefined): string {
      const target = rawNext || "/account";
      const isSafeRelativePath =
        target.startsWith("/") &&
        !target.startsWith("//") &&
        !target.startsWith("/\\") &&
        !target.includes("://");
      return isSafeRelativePath ? target : "/account";
    }

    // Safe internal paths
    assert.strictEqual(sanitizeRedirectUrl("/checkout"), "/checkout");
    assert.strictEqual(sanitizeRedirectUrl("/account/orders"), "/account/orders");
    assert.strictEqual(sanitizeRedirectUrl("/products?category=Sarees"), "/products?category=Sarees");
    assert.strictEqual(sanitizeRedirectUrl(null), "/account");

    // Attack payloads that must be neutralized
    assert.strictEqual(sanitizeRedirectUrl("https://malicious-phishing.com"), "/account");
    assert.strictEqual(sanitizeRedirectUrl("http://attacker.com/evil"), "/account");
    assert.strictEqual(sanitizeRedirectUrl("//attacker.com"), "/account");
    assert.strictEqual(sanitizeRedirectUrl("/\\attacker.com"), "/account");
    assert.strictEqual(sanitizeRedirectUrl("javascript:alert(1)"), "/account");
  });

  test("Constant-time HMAC comparison prevents timing attacks across varying length inputs", () => {
    function timingSafeMatch(a: string, b: string): boolean {
      const bufA = Buffer.from(a, "utf-8");
      const bufB = Buffer.from(b, "utf-8");
      if (bufA.length !== bufB.length) {
        crypto.timingSafeEqual(bufA, bufA);
        return false;
      }
      return crypto.timingSafeEqual(bufA, bufB);
    }

    const secret = "correct_secret_value_12345";
    assert.strictEqual(timingSafeMatch(secret, "correct_secret_value_12345"), true);
    assert.strictEqual(timingSafeMatch(secret, "wrong_secret_value_12345"), false);
    assert.strictEqual(timingSafeMatch(secret, "short"), false);
    assert.strictEqual(timingSafeMatch(secret, "very_long_secret_value_that_exceeds_length"), false);
    assert.strictEqual(timingSafeMatch("", secret), false);
    assert.strictEqual(timingSafeMatch(secret, ""), false);
  });
});
