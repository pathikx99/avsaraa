import { test, describe } from "node:test";
import assert from "node:assert";
import crypto from "crypto";
import { signAdminToken, verifyAdminToken } from "../../src/lib/jwtAdmin.ts";
import { escapeHtml } from "../../src/lib/emailTemplates.ts";

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
});
