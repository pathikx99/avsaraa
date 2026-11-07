import { computeChargeableWeight, computeVolumetricWeight, isValidGujaratPincode } from "@/lib/financials";

export interface PackagingDimension {
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
  deadWeightKg: number;
}

export interface ServiceabilityResult {
  pincode: string;
  serviceable: boolean;
  city: string;
  state: string;
  estimatedDeliveryDays: number;
  courierPartner: string;
  codAvailable: boolean;
  rate: number;
  chargeableWeightKg: number;
  source: "shiprocket_api" | "cache" | "fallback_matrix";
}

// In-Memory Warm Process Cache
const memoryServiceabilityCache = new Map<
  string,
  { data: ServiceabilityResult; cachedAt: number }
>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 Hours

/**
 * Calculates chargeable weight for parcel
 */
export function calculateParcelWeights(dimensions: PackagingDimension): {
  deadWeightKg: number;
  volumetricWeightKg: number;
  chargeableWeightKg: number;
} {
  const vol = computeVolumetricWeight(
    dimensions.lengthCm,
    dimensions.breadthCm,
    dimensions.heightCm
  );
  const chargeable = computeChargeableWeight(
    dimensions.deadWeightKg,
    dimensions.lengthCm,
    dimensions.breadthCm,
    dimensions.heightCm
  );
  return {
    deadWeightKg: dimensions.deadWeightKg,
    volumetricWeightKg: vol,
    chargeableWeightKg: chargeable,
  };
}

/**
 * Two-tier Cached Serviceability Checker
 * Layer 1: In-memory process cache (0ms)
 * Layer 2: API / Dynamic Rule Engine fallback (with Gujarat validation)
 */
export async function getShiprocketServiceability(
  deliveryPincode: string,
  dimensions?: Partial<PackagingDimension>
): Promise<ServiceabilityResult> {
  const cleanPin = String(deliveryPincode).trim();
  const cacheKey = `pincode:${cleanPin}`;

  // Check Layer 1: In-memory Process Cache
  const cached = memoryServiceabilityCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return { ...cached.data, source: "cache" };
  }

  const pkg: PackagingDimension = {
    lengthCm: dimensions?.lengthCm || 35,
    breadthCm: dimensions?.breadthCm || 28,
    heightCm: dimensions?.heightCm || 8,
    deadWeightKg: dimensions?.deadWeightKg || 0.65,
  };

  const { chargeableWeightKg } = calculateParcelWeights(pkg);

  // Validate Gujarat geographic criteria
  const isGujarat = isValidGujaratPincode(cleanPin);

  let result: ServiceabilityResult;

  if (isGujarat) {
    const isSurat = cleanPin.startsWith("395");
    const isAhmedabad = cleanPin.startsWith("380");
    result = {
      pincode: cleanPin,
      serviceable: true,
      city: isSurat ? "Surat Atelier Region" : isAhmedabad ? "Ahmedabad" : "Gujarat Central",
      state: "Gujarat",
      estimatedDeliveryDays: isSurat ? 1 : 2,
      courierPartner: isSurat ? "Avsaraa White Glove Dedicated" : "Blue Dart Express",
      codAvailable: true,
      rate: 45,
      chargeableWeightKg,
      source: "fallback_matrix",
    };
  } else if (/^\d{6}$/.test(cleanPin)) {
    // Valid national pincode (for non-Gujarat deliveries or warnings)
    result = {
      pincode: cleanPin,
      serviceable: true,
      city: cleanPin.startsWith("11") ? "Delhi NCR" : cleanPin.startsWith("40") ? "Mumbai" : "India Rest",
      state: "National",
      estimatedDeliveryDays: 4,
      courierPartner: "Delhivery Surface / Blue Dart",
      codAvailable: true,
      rate: 90,
      chargeableWeightKg,
      source: "fallback_matrix",
    };
  } else {
    result = {
      pincode: cleanPin,
      serviceable: false,
      city: "Unknown",
      state: "Unknown",
      estimatedDeliveryDays: 0,
      courierPartner: "None",
      codAvailable: false,
      rate: 0,
      chargeableWeightKg,
      source: "fallback_matrix",
    };
  }

  // Store into memory cache
  memoryServiceabilityCache.set(cacheKey, { data: result, cachedAt: Date.now() });

  return result;
}
