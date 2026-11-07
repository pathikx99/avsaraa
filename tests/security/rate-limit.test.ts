import { test, describe } from "node:test";
import assert from "node:assert";
import {
  checkRateLimit,
  resetRateLimit,
  rateLimitOtpSend,
  rateLimitOtpVerify,
  rateLimitCustomerLogin,
  rateLimitCouponValidation,
  rateLimitOrderTracking,
} from "../../src/lib/rateLimit.ts";

describe("Rate Limiting & Brute-Force Defense Tests", () => {
  test("Sliding window rate limiter enforces maximum attempt thresholds", () => {
    const testKey = `test-client-${Date.now()}`;
    resetRateLimit(testKey);

    // Allow 3 attempts within 60 seconds
    const r1 = checkRateLimit(testKey, 3, 60);
    assert.strictEqual(r1.allowed, true);
    assert.strictEqual(r1.remaining, 2);

    const r2 = checkRateLimit(testKey, 3, 60);
    assert.strictEqual(r2.allowed, true);
    assert.strictEqual(r2.remaining, 1);

    const r3 = checkRateLimit(testKey, 3, 60);
    assert.strictEqual(r3.allowed, true);
    assert.strictEqual(r3.remaining, 0);

    // 4th attempt must be rejected
    const r4 = checkRateLimit(testKey, 3, 60);
    assert.strictEqual(r4.allowed, false);
    assert.strictEqual(r4.remaining, 0);

    // Resetting unblocks immediately
    resetRateLimit(testKey);
    const r5 = checkRateLimit(testKey, 3, 60);
    assert.strictEqual(r5.allowed, true);
  });

  test("Specialized rate limit helpers maintain independent scopes", () => {
    const id = "patron@test.com";
    const otp1 = rateLimitOtpSend(id);
    assert.strictEqual(otp1.allowed, true);

    const otpVerify = rateLimitOtpVerify(id);
    assert.strictEqual(otpVerify.allowed, true);

    const loginCheck = rateLimitCustomerLogin("192.168.1.1");
    assert.strictEqual(loginCheck.allowed, true);

    const track1 = rateLimitOrderTracking("192.168.1.1");
    assert.strictEqual(track1.allowed, true);

    const coupon1 = rateLimitCouponValidation("192.168.1.1");
    assert.strictEqual(coupon1.allowed, true);
  });
});
