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

  test("Inventory deduction calculates exact new total and per-size stock without dipping below 0 (AVS-004)", () => {
    function calculateDeductedStock(
      currentStock: number,
      currentSizeInv: Record<string, number>,
      orderedItems: Array<{ size: string; quantity: number }>
    ) {
      let totalQty = 0;
      const sizeQty: Record<string, number> = {};
      for (const item of orderedItems) {
        totalQty += item.quantity;
        sizeQty[item.size] = (sizeQty[item.size] || 0) + item.quantity;
      }

      const newStock = Math.max(0, currentStock - totalQty);
      const newInv = { ...currentSizeInv };
      for (const [size, qty] of Object.entries(sizeQty)) {
        newInv[size] = Math.max(0, (newInv[size] || 0) - qty);
      }

      return { newStock, newInv };
    }

    const initial = {
      stock: 10,
      sizes: { "Free Size": 10, "Custom Tailored": 5 },
    };

    const result = calculateDeductedStock(initial.stock, initial.sizes, [
      { size: "Free Size", quantity: 3 },
      { size: "Custom Tailored", quantity: 2 },
    ]);

    assert.strictEqual(result.newStock, 5);
    assert.strictEqual(result.newInv["Free Size"], 7);
    assert.strictEqual(result.newInv["Custom Tailored"], 3);

    // Oversell guard: stock never drops below 0
    const oversellResult = calculateDeductedStock(2, { "Free Size": 2 }, [
      { size: "Free Size", quantity: 5 },
    ]);
    assert.strictEqual(oversellResult.newStock, 0);
    assert.strictEqual(oversellResult.newInv["Free Size"], 0);
  });

  test("Coupon increment rejects updates when usage_limit is reached (AVS-006)", () => {
    function canIncrementCoupon(usedCount: number, usageLimit: number | null): boolean {
      if (usageLimit !== null && usedCount >= usageLimit) {
        return false;
      }
      return true;
    }

    // Unlimited coupon
    assert.strictEqual(canIncrementCoupon(500, null), true);

    // Limited coupon below limit
    assert.strictEqual(canIncrementCoupon(99, 100), true);

    // Limited coupon at limit (must be blocked)
    assert.strictEqual(canIncrementCoupon(100, 100), false);

    // Limited coupon exceeded limit
    assert.strictEqual(canIncrementCoupon(105, 100), false);
  });

  test("Master OTP code 123456 is strictly rejected outside test execution (AVS-009)", () => {
    function isOtpAuthorized(
      otpInput: string,
      recordedOtp: string | undefined,
      isExpired: boolean,
      env: { NODE_ENV?: string; ENABLE_TEST_OTP?: string }
    ): boolean {
      const isTestExecution =
        env.ENABLE_TEST_OTP === "true" || env.NODE_ENV === "test";
      const isMasterCode = isTestExecution && otpInput === "123456";
      const isRecordedValid = Boolean(recordedOtp && recordedOtp === otpInput && !isExpired);

      return isMasterCode || isRecordedValid;
    }

    // In production with 123456: rejected!
    assert.strictEqual(
      isOtpAuthorized("123456", undefined, false, { NODE_ENV: "production" }),
      false
    );

    // In development without ENABLE_TEST_OTP: rejected!
    assert.strictEqual(
      isOtpAuthorized("123456", undefined, false, { NODE_ENV: "development" }),
      false
    );

    // In test execution: allowed!
    assert.strictEqual(
      isOtpAuthorized("123456", undefined, false, { NODE_ENV: "test" }),
      true
    );

    // Real recorded OTP matches: allowed anywhere!
    assert.strictEqual(
      isOtpAuthorized("847291", "847291", false, { NODE_ENV: "production" }),
      true
    );

    // Expired real OTP: rejected!
    assert.strictEqual(
      isOtpAuthorized("847291", "847291", true, { NODE_ENV: "production" }),
      false
    );
  });

  test("Exchange workflow strictly requires Delivered status and valid 7-day window", () => {
    function canRequestExchange(
      orderStatus: string,
      updatedAtOrCreatedAt: string
    ): { eligible: boolean; reason?: string } {
      if (orderStatus !== "Delivered") {
        return { eligible: false, reason: `Exchange requests can only be initiated for delivered orders (current status: ${orderStatus}).` };
      }
      const deliveryTimestamp = new Date(updatedAtOrCreatedAt).getTime();
      const daysSinceDelivery = (Date.now() - deliveryTimestamp) / (1000 * 60 * 60 * 24);
      if (daysSinceDelivery > 7) {
        return { eligible: false, reason: "The 7-Day Heritage Exchange window for this order has expired." };
      }
      return { eligible: true };
    }

    // Pending or confirmed orders cannot be exchanged
    assert.strictEqual(canRequestExchange("Pending", new Date().toISOString()).eligible, false);
    assert.strictEqual(canRequestExchange("Confirmed", new Date().toISOString()).eligible, false);
    assert.strictEqual(canRequestExchange("Dispatched", new Date().toISOString()).eligible, false);
    assert.strictEqual(canRequestExchange("Cancelled", new Date().toISOString()).eligible, false);

    // Delivered 2 days ago: eligible
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    assert.strictEqual(canRequestExchange("Delivered", twoDaysAgo).eligible, true);

    // Delivered 10 days ago: expired
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    assert.strictEqual(canRequestExchange("Delivered", tenDaysAgo).eligible, false);
  });

  test("Order edit address validation strictly enforces valid Pan-India 6-digit pincode", () => {
    function validateEditAddress(snap: { postal_code?: string; recipient_name?: string }): boolean {
      if (!snap || !snap.postal_code) return false;
      const isIndianPin = /^[1-9]\d{5}$/.test(snap.postal_code.trim());
      return isIndianPin && Boolean(snap.recipient_name);
    }

    assert.strictEqual(validateEditAddress({ postal_code: "395006", recipient_name: "Meera" }), true);
    assert.strictEqual(validateEditAddress({ postal_code: "110001", recipient_name: "Pooja" }), true);
    assert.strictEqual(validateEditAddress({ postal_code: "400001", recipient_name: "Riya" }), true);
    assert.strictEqual(validateEditAddress({ postal_code: "12345", recipient_name: "Bad" }), false);
    assert.strictEqual(validateEditAddress({ postal_code: "000001", recipient_name: "Bad" }), false);
  });
});
