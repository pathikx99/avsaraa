/**
 * Financials, Taxation, Logistics & Geography Utilities for Avsaraa E-Commerce
 */

export const FREE_DELIVERY_THRESHOLD = 500;
export const STANDARD_COURIER_FEE = 50;
export const COD_SURCHARGE = 10;
export const GST_RATE = 0.05; // 5% inclusive GST

/**
 * Validates Gujarat pincode range (360000 to 399999).
 */
export function isValidGujaratPincode(pincode: string | number | undefined | null): boolean {
  if (!pincode) return false;
  const clean = String(pincode).trim();
  if (!/^\d{6}$/.test(clean)) return false;
  const numeric = parseInt(clean, 10);
  return numeric >= 360000 && numeric <= 399999;
}

/**
 * Calculates server-side inclusive 5% GST without rounding drift.
 * Tax = (Amount * 0.05) / 1.05
 */
export function computeInclusiveGst(amount: number): {
  taxableAmount: number;
  gstAmount: number;
  rate: number;
} {
  const safeAmount = Math.max(0, Number(amount) || 0);
  if (safeAmount === 0) {
    return { taxableAmount: 0, gstAmount: 0, rate: GST_RATE };
  }
  // Formula: Tax = (Amount * 0.05) / 1.05
  const gstRaw = (safeAmount * GST_RATE) / (1 + GST_RATE);
  // Round to 2 decimal places (paise)
  const gstAmount = Math.round(gstRaw * 100) / 100;
  const taxableAmount = Math.round((safeAmount - gstAmount) * 100) / 100;
  return {
    taxableAmount,
    gstAmount,
    rate: GST_RATE,
  };
}

/**
 * Computes courier delivery fee based on subtotal.
 * Free delivery threshold: ₹500
 */
export function computeCourierFee(subtotal: number, baseFee: number = STANDARD_COURIER_FEE): number {
  const safeSubtotal = Math.max(0, Number(subtotal) || 0);
  if (safeSubtotal >= FREE_DELIVERY_THRESHOLD) {
    return 0;
  }
  return baseFee;
}

/**
 * Computes COD surcharge: ₹10 for Cash on Delivery, ₹0 for prepaid
 */
export function computeCodSurcharge(paymentMethod: string): number {
  return paymentMethod === "COD" ? COD_SURCHARGE : 0;
}

/**
 * Calculates 3D Volumetric Weight in Kilograms.
 * Standard domestic courier formula: (Length cm * Breadth cm * Height cm) / 5000
 */
export function computeVolumetricWeight(
  lengthCm: number,
  breadthCm: number,
  heightCm: number
): number {
  const l = Math.max(0, Number(lengthCm) || 0);
  const b = Math.max(0, Number(breadthCm) || 0);
  const h = Math.max(0, Number(heightCm) || 0);
  const volumetricKg = (l * b * h) / 5000;
  return Math.round(volumetricKg * 1000) / 1000;
}

/**
 * Calculates chargeable weight: Greater of actual dead weight vs volumetric weight
 */
export function computeChargeableWeight(
  deadWeightKg: number,
  lengthCm: number,
  breadthCm: number,
  heightCm: number
): number {
  const dead = Math.max(0, Number(deadWeightKg) || 0);
  const vol = computeVolumetricWeight(lengthCm, breadthCm, heightCm);
  return Math.max(dead, vol);
}

/**
 * Comprehensive Order Financial Calculation
 */
export function calculateOrderTotals(params: {
  subtotal: number;
  discountAmount?: number;
  paymentMethod: string;
  customShippingFee?: number;
}): {
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  codSurcharge: number;
  totalAmount: number;
  gstAmount: number;
  taxableAmount: number;
} {
  const subtotal = Math.max(0, Number(params.subtotal) || 0);
  const discountAmount = Math.min(subtotal, Math.max(0, Number(params.discountAmount) || 0));
  const discountedSubtotal = subtotal - discountAmount;

  const shippingFee =
    params.customShippingFee !== undefined
      ? Math.max(0, params.customShippingFee)
      : computeCourierFee(discountedSubtotal);

  const codSurcharge = computeCodSurcharge(params.paymentMethod);
  const totalAmount = Math.max(0, discountedSubtotal + shippingFee + codSurcharge);

  // Inclusive GST on the merchandise after discounts
  const { gstAmount, taxableAmount } = computeInclusiveGst(discountedSubtotal);

  return {
    subtotal,
    discountAmount,
    shippingFee,
    codSurcharge,
    totalAmount,
    gstAmount,
    taxableAmount,
  };
}
