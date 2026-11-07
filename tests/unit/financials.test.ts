import { test, describe } from "node:test";
import assert from "node:assert";
import {
  computeInclusiveGst,
  computeCourierFee,
  computeCodSurcharge,
  isValidGujaratPincode,
  computeVolumetricWeight,
  computeChargeableWeight,
  calculateOrderTotals,
  FREE_DELIVERY_THRESHOLD,
  COD_SURCHARGE,
} from "../../src/lib/financials.ts";

describe("E-Commerce Financials & Calculations Unit Tests", () => {
  test("Inclusive 5% GST calculation accurately computes Tax = (Amount * 0.05) / 1.05", () => {
    // ₹1050 item at 5% inclusive GST should yield ₹1000 taxable and ₹50 GST
    const res1 = computeInclusiveGst(1050);
    assert.strictEqual(res1.gstAmount, 50);
    assert.strictEqual(res1.taxableAmount, 1000);
    assert.strictEqual(res1.taxableAmount + res1.gstAmount, 1050);

    // ₹2100 item
    const res2 = computeInclusiveGst(2100);
    assert.strictEqual(res2.gstAmount, 100);
    assert.strictEqual(res2.taxableAmount, 2000);

    // Zero or negative handling
    const resZero = computeInclusiveGst(0);
    assert.strictEqual(resZero.gstAmount, 0);
    assert.strictEqual(resZero.taxableAmount, 0);
  });

  test("Courier fee enforces ₹500 free delivery threshold", () => {
    assert.strictEqual(FREE_DELIVERY_THRESHOLD, 500);
    // Under ₹500 threshold incurs ₹50 courier fee
    assert.strictEqual(computeCourierFee(499), 50);
    assert.strictEqual(computeCourierFee(0), 50);

    // ₹500 or above qualifies for complimentary delivery (₹0)
    assert.strictEqual(computeCourierFee(500), 0);
    assert.strictEqual(computeCourierFee(1299), 0);
    assert.strictEqual(computeCourierFee(15000), 0);
  });

  test("Cash on Delivery (COD) surcharge strictly applies ₹10", () => {
    assert.strictEqual(computeCodSurcharge("COD"), COD_SURCHARGE);
    assert.strictEqual(computeCodSurcharge("Online Card / UPI"), 0);
    assert.strictEqual(computeCodSurcharge("Razorpay"), 0);
  });

  test("Gujarat pincode verification strictly enforces 360000–399999 boundary", () => {
    // Valid Gujarat pincodes
    assert.strictEqual(isValidGujaratPincode("395007"), true); // Surat
    assert.strictEqual(isValidGujaratPincode("380001"), true); // Ahmedabad
    assert.strictEqual(isValidGujaratPincode("360001"), true); // Rajkot
    assert.strictEqual(isValidGujaratPincode(390001), true);   // Vadodara (numeric)
    assert.strictEqual(isValidGujaratPincode("360000"), true); // Lower bound
    assert.strictEqual(isValidGujaratPincode("399999"), true); // Upper bound

    // Invalid non-Gujarat pincodes
    assert.strictEqual(isValidGujaratPincode("110001"), false); // Delhi
    assert.strictEqual(isValidGujaratPincode("400001"), false); // Mumbai
    assert.strictEqual(isValidGujaratPincode("560001"), false); // Bengaluru
    assert.strictEqual(isValidGujaratPincode("359999"), false); // Below lower bound
    assert.strictEqual(isValidGujaratPincode("400000"), false); // Above upper bound
    assert.strictEqual(isValidGujaratPincode("abc"), false);
    assert.strictEqual(isValidGujaratPincode(""), false);
  });

  test("3D Volumetric Weight and Chargeable Weight calculation", () => {
    // Box: 50cm x 40cm x 25cm -> 50000 / 5000 = 10.0 kg volumetric
    const vol = computeVolumetricWeight(50, 40, 25);
    assert.strictEqual(vol, 10);

    // If actual dead weight is 4kg, chargeable weight is greater (10kg)
    const chargeable1 = computeChargeableWeight(4, 50, 40, 25);
    assert.strictEqual(chargeable1, 10);

    // If actual dead weight is 15kg, chargeable weight is dead weight (15kg)
    const chargeable2 = computeChargeableWeight(15, 50, 40, 25);
    assert.strictEqual(chargeable2, 15);
  });

  test("calculateOrderTotals orchestrates subtotal, discounts, shipping, COD, and GST without drift", () => {
    // Scenario 1: Subtotal ₹400 with COD -> Shipping ₹50, COD ₹10 -> Total ₹460
    const ord1 = calculateOrderTotals({
      subtotal: 400,
      discountAmount: 0,
      paymentMethod: "COD",
    });
    assert.strictEqual(ord1.shippingFee, 50);
    assert.strictEqual(ord1.codSurcharge, 10);
    assert.strictEqual(ord1.totalAmount, 460);

    // Scenario 2: Subtotal ₹1050 with Online Card -> Free shipping, COD ₹0 -> Total ₹1050
    const ord2 = calculateOrderTotals({
      subtotal: 1050,
      discountAmount: 0,
      paymentMethod: "Online Card / UPI",
    });
    assert.strictEqual(ord2.shippingFee, 0);
    assert.strictEqual(ord2.codSurcharge, 0);
    assert.strictEqual(ord2.totalAmount, 1050);
    assert.strictEqual(ord2.gstAmount, 50);
    assert.strictEqual(ord2.taxableAmount, 1000);
  });
});
