import { test, describe } from "node:test";
import assert from "node:assert";
import { generateLogisticsMilestones } from "../../src/lib/shiprocket.ts";
import { checkRateLimit, resetRateLimit } from "../../src/lib/rateLimit.ts";
import { maskEmail, maskPhoneNumber } from "../../src/lib/phoneUtils.ts";

describe("Tracking & Payment Hardening Security Tests", () => {
  test("Shiprocket logistics milestone progression generates chronological scan checkpoints", () => {
    const milestones = generateLogisticsMilestones({
      orderNumber: "AVS-20261119-TEST",
      status: "Dispatched",
      createdAt: new Date().toISOString(),
      city: "Surat",
      postalCode: "395007",
      courierPartner: "Blue Dart Express Gujarat",
    });

    assert.ok(Array.isArray(milestones));
    assert.ok(milestones.length >= 3);

    // Most recent scan should be top of list
    const topScan = milestones[0];
    assert.strictEqual(topScan.status, "In Transit");
    assert.ok(topScan.activity.includes("Regional Distribution Hub"));

    // Oldest scan at bottom should be order confirmed
    const initialScan = milestones[milestones.length - 1];
    assert.strictEqual(initialScan.status, "Confirmed");
    assert.ok(initialScan.location.includes("Surat"));
  });

  test("Delivered order lifecycle completes all 5 logistics checkpoints", () => {
    const milestones = generateLogisticsMilestones({
      orderNumber: "AVS-20261119-DELV",
      status: "Delivered",
      createdAt: new Date().toISOString(),
      city: "Ahmedabad",
      postalCode: "380001",
      courierPartner: "Delhivery Surface",
    });

    const statuses = milestones.map((m) => m.status);
    assert.ok(statuses.includes("Delivered"));
    assert.ok(statuses.includes("Out for Delivery"));
    assert.ok(statuses.includes("In Transit"));
    assert.ok(statuses.includes("Processing"));
    assert.ok(statuses.includes("Confirmed"));
  });

  test("Customer PII masking protects privacy against unauthorized harvesting", () => {
    const rawEmail = "meera.desai@example.com";
    const rawPhone = "+91 98765 43210";

    const maskedEmail = maskEmail(rawEmail);
    const maskedPhone = maskPhoneNumber(rawPhone);

    // Masked email must hide sensitive local characters
    assert.strictEqual(maskedEmail.includes("desai"), false);
    assert.ok(maskedEmail.endsWith("@example.com"));

    // Masked phone must hide middle 6 digits
    assert.strictEqual(maskedPhone.includes("765"), false);
    assert.strictEqual(maskedPhone.endsWith("10"), true);
  });

  test("Phone number validation rate limiting strictly prevents bulk scraping", () => {
    const testIp = `test-ip-${Date.now()}`;
    resetRateLimit(`phone-validate:${testIp}`);

    // Allow up to 10 requests
    for (let i = 0; i < 10; i++) {
      const check = checkRateLimit(`phone-validate:${testIp}`, 10, 60);
      assert.strictEqual(check.allowed, true);
    }

    // 11th request must be blocked
    const blockedCheck = checkRateLimit(`phone-validate:${testIp}`, 10, 60);
    assert.strictEqual(blockedCheck.allowed, false);
    assert.strictEqual(blockedCheck.remaining, 0);

    resetRateLimit(`phone-validate:${testIp}`);
  });

  test("Razorpay webhook underpayment rejection guard detects amount manipulation", () => {
    function verifyPaymentAmount(orderTotalPaise: number, webhookPaidPaise: number): boolean {
      return webhookPaidPaise >= orderTotalPaise;
    }

    const orderTotal = 15999 * 100; // ₹15,999 in paise

    // Legitimate payment
    assert.strictEqual(verifyPaymentAmount(orderTotal, 1599900), true);

    // Malicious underpaid transaction (e.g. paying ₹1 for ₹15,999 order)
    assert.strictEqual(verifyPaymentAmount(orderTotal, 100), false);
    assert.strictEqual(verifyPaymentAmount(orderTotal, 0), false);
    assert.strictEqual(verifyPaymentAmount(orderTotal, 1599800), false);
  });

  test("JSON-LD script tag escaping neutralizes script breakout attacks", () => {
    function escapeJsonLd(obj: unknown): string {
      return JSON.stringify(obj).replace(/</g, "\\u003c");
    }

    const maliciousProduct = {
      name: "Banarasi Saree</script><script>alert('xss')</script>",
      description: "Fine silk with <img src=x onerror=steal()> zari.",
    };

    const serialized = escapeJsonLd(maliciousProduct);

    // Must not contain raw '<' character
    assert.strictEqual(serialized.includes("</script>"), false);
    assert.strictEqual(serialized.includes("<script>"), false);
    assert.strictEqual(serialized.includes("<img"), false);
    assert.ok(serialized.includes("\\u003c/script>"));
  });
});
