import { test, describe } from "node:test";
import assert from "node:assert";
import {
  computeInclusiveGst,
  computeCourierFee,
  computeCodSurcharge,
  isValidGujaratPincode,
  isValidIndianPincode,
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

  test("Courier fee enforces ₹799 free delivery threshold", () => {
    assert.strictEqual(FREE_DELIVERY_THRESHOLD, 799);
    // Under ₹799 threshold incurs ₹50 courier fee
    assert.strictEqual(computeCourierFee(798), 50);
    assert.strictEqual(computeCourierFee(499), 50);
    assert.strictEqual(computeCourierFee(0), 50);

    // ₹799 or above qualifies for complimentary delivery (₹0)
    assert.strictEqual(computeCourierFee(799), 0);
    assert.strictEqual(computeCourierFee(1299), 0);
    assert.strictEqual(computeCourierFee(15000), 0);
  });

  test("Cash on Delivery (COD) surcharge strictly applies ₹20", () => {
    assert.strictEqual(computeCodSurcharge("COD"), COD_SURCHARGE);
    assert.strictEqual(computeCodSurcharge("COD"), 20);
    assert.strictEqual(computeCodSurcharge("Razorpay"), 0);
    assert.strictEqual(computeCodSurcharge("Razorpay"), 0);
  });

  test("Pan-India pincode verification accepts all valid 6-digit Indian PINs (100000–999999) and Gujarat helper detects intra-state range", () => {
    // Valid Pan-India 6-digit PINs across states
    assert.strictEqual(isValidIndianPincode("395007"), true); // Gujarat Hub
    assert.strictEqual(isValidIndianPincode("380001"), true); // Ahmedabad
    assert.strictEqual(isValidIndianPincode("110001"), true); // Delhi
    assert.strictEqual(isValidIndianPincode(400001), true);   // Mumbai (numeric)
    assert.strictEqual(isValidIndianPincode("560001"), true); // Bengaluru
    assert.strictEqual(isValidIndianPincode("700001"), true); // Kolkata

    // Invalid Indian PINs rejected
    assert.strictEqual(isValidIndianPincode("012345"), false); // Leading 0 invalid
    assert.strictEqual(isValidIndianPincode("12345"), false);  // Too short
    assert.strictEqual(isValidIndianPincode("1234567"), false);// Too long
    assert.strictEqual(isValidIndianPincode("abc"), false);
    assert.strictEqual(isValidIndianPincode(""), false);

    // Intra-state Gujarat helper still identifies 360000–399999 for GST/local dispatch
    assert.strictEqual(isValidGujaratPincode("395007"), true);
    assert.strictEqual(isValidGujaratPincode("360000"), true);
    assert.strictEqual(isValidGujaratPincode("399999"), true);
    assert.strictEqual(isValidGujaratPincode("110001"), false);
    assert.strictEqual(isValidGujaratPincode("400001"), false);
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
    // Scenario 1: Subtotal ₹400 with COD -> Shipping ₹50, COD ₹20 -> Total ₹470
    const ord1 = calculateOrderTotals({
      subtotal: 400,
      discountAmount: 0,
      paymentMethod: "COD",
    });
    assert.strictEqual(ord1.shippingFee, 50);
    assert.strictEqual(ord1.codSurcharge, 20);
    assert.strictEqual(ord1.totalAmount, 470);

    // Scenario 2: Subtotal ₹1050 with Online Card -> Free shipping, COD ₹0 -> Total ₹1050
    const ord2 = calculateOrderTotals({
      subtotal: 1050,
      discountAmount: 0,
      paymentMethod: "Razorpay",
    });
    assert.strictEqual(ord2.shippingFee, 0);
    assert.strictEqual(ord2.codSurcharge, 0);
    assert.strictEqual(ord2.totalAmount, 1050);
    // Scenario 3: Subtotal ₹400 with Free Shipping Promo (customShippingFee: 0) and Prepaid -> Shipping ₹0, COD ₹0 -> Total ₹400
    const ord3 = calculateOrderTotals({
      subtotal: 400,
      discountAmount: 0,
      paymentMethod: "Razorpay",
      customShippingFee: 0,
    });
    assert.strictEqual(ord3.shippingFee, 0);
    assert.strictEqual(ord3.codSurcharge, 0);
    assert.strictEqual(ord3.totalAmount, 400);
  });
});
