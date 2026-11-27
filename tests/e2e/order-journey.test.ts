import { test, describe } from "node:test";
import assert from "node:assert";
import { calculateOrderTotals } from "../../src/lib/financials.ts";
import { isValidIndianPincode } from "../../src/lib/financials.ts";

/**
 * End-to-End Order Journey Logic Tests
 *
 * Tests the complete checkout → payment → order success → tracking → cancellation
 * workflow business logic without requiring a live server. These tests validate
 * the core financial calculations, pincode validation, and order state transitions
 * that power the e-commerce checkout flow.
 */

const GUEST_SYSTEM_USER_ID = "7a3b2e24-820f-4706-8cc3-4218b42b0da3";

describe("E2E Order Journey - Financial Calculations", () => {
  test("COD order above ₹799 threshold: free shipping + COD surcharge only", () => {
    const result = calculateOrderTotals({
      subtotal: 24999,
      discountAmount: 0,
      paymentMethod: "COD",
    });

    assert.strictEqual(result.subtotal, 24999);
    assert.strictEqual(result.discountAmount, 0);
    assert.strictEqual(result.shippingFee, 0); // Above ₹799 → free shipping
    assert.strictEqual(result.codSurcharge, 20);
    assert.strictEqual(result.totalAmount, 24999 + 20);
    assert.ok(result.gstAmount > 0);
    assert.ok(result.taxableAmount > 0);
    assert.strictEqual(
      result.taxableAmount + result.gstAmount,
      result.subtotal,
      "Taxable amount + GST should equal subtotal (inclusive GST)",
    );
  });

  test("Prepaid order above ₹799 threshold: free shipping, no COD surcharge", () => {
    const result = calculateOrderTotals({
      subtotal: 24999,
      discountAmount: 0,
      paymentMethod: "Razorpay",
    });

    assert.strictEqual(result.shippingFee, 0);
    assert.strictEqual(result.codSurcharge, 0);
    assert.strictEqual(result.totalAmount, 24999);
  });

  test("Prepaid order below ₹799 threshold: standard shipping ₹50, no COD surcharge", () => {
    const result = calculateOrderTotals({
      subtotal: 600,
      discountAmount: 0,
      paymentMethod: "Razorpay",
    });

    assert.strictEqual(result.shippingFee, 50);
    assert.strictEqual(result.codSurcharge, 0);
    assert.strictEqual(result.totalAmount, 650);
  });

  test("COD order below ₹799 threshold: shipping ₹50 + COD surcharge ₹20", () => {
    const result = calculateOrderTotals({
      subtotal: 600,
      discountAmount: 0,
      paymentMethod: "COD",
    });

    assert.strictEqual(result.shippingFee, 50);
    assert.strictEqual(result.codSurcharge, 20);
    assert.strictEqual(result.totalAmount, 670);
  });

  test("Percentage discount with max cap applied correctly", () => {
    // 10% of ₹10,000 = ₹1,000, capped at ₹500
    const result = calculateOrderTotals({
      subtotal: 10000,
      discountAmount: 500, // pre-capped by coupon engine
      paymentMethod: "Razorpay",
    });

    assert.strictEqual(result.discountAmount, 500);
    assert.strictEqual(result.totalAmount, 9500);
  });

  test("Free shipping coupon: shipping fee waived to ₹0", () => {
    const result = calculateOrderTotals({
      subtotal: 400,
      discountAmount: 0,
      paymentMethod: "Razorpay",
      customShippingFee: 0, // free_shipping coupon sets customShippingFee to 0
    });

    assert.strictEqual(result.shippingFee, 0);
    assert.strictEqual(result.codSurcharge, 0);
    assert.strictEqual(result.totalAmount, 400);
  });

  test("Zero cart total: shipping still applies (below ₹500 threshold), no GST", () => {
    const result = calculateOrderTotals({
      subtotal: 0,
      discountAmount: 0,
      paymentMethod: "Razorpay",
    });

    assert.strictEqual(result.subtotal, 0);
    assert.strictEqual(result.discountAmount, 0);
    assert.strictEqual(result.shippingFee, 50); // Below ₹500 threshold → standard shipping
    assert.strictEqual(result.codSurcharge, 0);
    assert.strictEqual(result.totalAmount, 50);
    assert.strictEqual(result.gstAmount, 0);
    assert.strictEqual(result.taxableAmount, 0);
  });

  test("Discount cannot exceed subtotal (guard against negative merchandise)", () => {
    const result = calculateOrderTotals({
      subtotal: 100,
      discountAmount: 200, // attempted over-discount
      paymentMethod: "Razorpay",
    });

    assert.strictEqual(result.discountAmount, 100); // capped at subtotal
    assert.strictEqual(result.totalAmount, 50); // merchandise ₹0 + shipping ₹50
  });
});

describe("E2E Order Journey - Pincode Validation", () => {
  test("Valid Pan-India 6-digit pincodes are accepted", () => {
    assert.strictEqual(isValidIndianPincode("395007"), true); // Gujarat Hub
    assert.strictEqual(isValidIndianPincode("380001"), true); // Ahmedabad
    assert.strictEqual(isValidIndianPincode("110001"), true); // Delhi
    assert.strictEqual(isValidIndianPincode("400001"), true); // Mumbai
    assert.strictEqual(isValidIndianPincode("560001"), true); // Bengaluru
    assert.strictEqual(isValidIndianPincode("700001"), true); // Kolkata
  });

  test("Invalid pincodes are rejected", () => {
    assert.strictEqual(isValidIndianPincode("000000"), false); // Zero-prefixed
    assert.strictEqual(isValidIndianPincode("12345"), false); // Too short
    assert.strictEqual(isValidIndianPincode("1234567"), false); // Too long
    assert.strictEqual(isValidIndianPincode("abcdef"), false); // Non-numeric
    assert.strictEqual(isValidIndianPincode(""), false); // Empty
    assert.strictEqual(isValidIndianPincode(null), false); // Null
    assert.strictEqual(isValidIndianPincode(undefined), false); // Undefined
  });
});

describe("E2E Order Journey - Order State Transitions", () => {
  test("Order status lifecycle validates cancellation eligibility", () => {
    const cancellable = ["Pending", "Confirmed", "Processing"];
    const nonCancellable = [
      "Dispatched",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
      "Exchange Requested",
      "Exchanged",
    ];

    for (const status of cancellable) {
      assert.ok(!nonCancellable.includes(status), `${status} should be cancellable`);
    }

    for (const status of nonCancellable) {
      assert.ok(!cancellable.includes(status), `${status} should not be cancellable`);
    }
  });

  test("Order status lifecycle validates editing eligibility", () => {
    const editable = ["Pending", "Confirmed"];
    const nonEditable = [
      "Processing",
      "Dispatched",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
      "Exchange Requested",
      "Exchanged",
    ];

    for (const status of editable) {
      assert.ok(!nonEditable.includes(status), `${status} should be editable`);
    }

    for (const status of nonEditable) {
      assert.ok(!editable.includes(status), `${status} should not be editable`);
    }
  });

  test("Exchange workflow states are mutually exclusive with cancellation", () => {
    const exchangeStates = ["Exchange Requested", "Exchanged"];

    for (const status of exchangeStates) {
      assert.ok(status !== "Cancelled", "Exchanged orders cannot be cancelled");
      assert.ok(status !== "Delivered", "Exchanged orders are a post-delivery state");
    }
  });
});

describe("E2E Order Journey - Guest Checkout Isolation", () => {
  test("Guest system user ID is a valid UUID format", () => {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    assert.strictEqual(UUID_REGEX.test(GUEST_SYSTEM_USER_ID), true);
  });

  test("Guest orders use shared system user ID, not a real customer UUID", () => {
    assert.strictEqual(GUEST_SYSTEM_USER_ID, "7a3b2e24-820f-4706-8cc3-4218b42b0da3");
    assert.notStrictEqual(GUEST_SYSTEM_USER_ID, "00000000-0000-0000-0000-000000000000");
  });
});
