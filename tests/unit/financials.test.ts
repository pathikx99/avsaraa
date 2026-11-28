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
  STANDARD_COURIER_FEE,
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

  test("Courier fee charges ₹250 unless a free-shipping promo is applied", () => {
    assert.strictEqual(STANDARD_COURIER_FEE, 250);
    // Without promo code, shipping never becomes free automatically
    assert.strictEqual(computeCourierFee(499), 250);
    assert.strictEqual(computeCourierFee(799), 250);
    assert.strictEqual(computeCourierFee(2499), 250);
    assert.strictEqual(computeCourierFee(15000), 250);

    // Only free-shipping promo waives delivery fee to ₹0
    assert.strictEqual(computeCourierFee(2499, STANDARD_COURIER_FEE, true), 0);
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
    // Scenario 1: Subtotal ₹400 with COD, no promo -> Shipping ₹250, COD ₹20 -> Total ₹670
    const ord1 = calculateOrderTotals({
      subtotal: 400,
      discountAmount: 0,
      paymentMethod: "COD",
    });
    assert.strictEqual(ord1.shippingFee, 250);
    assert.strictEqual(ord1.shippingDiscount, 0);
    assert.strictEqual(ord1.codSurcharge, 20);
    assert.strictEqual(ord1.totalAmount, 670);

    // Scenario 2: Subtotal ₹2499 with Online Card, NO promo -> Shipping ₹250 still applies -> Total ₹2749
    const ord2 = calculateOrderTotals({
      subtotal: 2499,
      discountAmount: 0,
      paymentMethod: "Razorpay",
    });
    assert.strictEqual(ord2.baseShippingFee, 250);
    assert.strictEqual(ord2.shippingFee, 250);
    assert.strictEqual(ord2.shippingDiscount, 0);
    assert.strictEqual(ord2.codSurcharge, 0);
    assert.strictEqual(ord2.totalAmount, 2749);

    // Scenario 3: Subtotal ₹2499 with Free Shipping Promo (customShippingFee: 0) -> Shipping ₹250 - ₹250 discount = ₹0 -> Total ₹2499
    const ord3 = calculateOrderTotals({
      subtotal: 2499,
      discountAmount: 0,
      paymentMethod: "Razorpay",
      customShippingFee: 0,
    });
    assert.strictEqual(ord3.baseShippingFee, 250);
    assert.strictEqual(ord3.shippingDiscount, 250);
    assert.strictEqual(ord3.shippingFee, 0);
    assert.strictEqual(ord3.codSurcharge, 0);
    assert.strictEqual(ord3.totalAmount, 2499);
  });
});
