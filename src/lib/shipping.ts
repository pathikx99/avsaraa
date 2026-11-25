import {
  computeChargeableWeight,
  computeVolumetricWeight,
  isValidGujaratPincode,
  isValidIndianPincode,
} from "@/lib/financials";

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

  // Validate Pan-India 6-digit pincode & regional tier
  const isGujarat = isValidGujaratPincode(cleanPin);
  const isValidPin = isValidIndianPincode(cleanPin);

  let result: ServiceabilityResult;

  if (isGujarat) {
    const isSurat = cleanPin.startsWith("395");
    const isAhmedabad = cleanPin.startsWith("380");
    result = {
      pincode: cleanPin,
      serviceable: true,
      city: isSurat ? "Surat Atelier Region" : isAhmedabad ? "Ahmedabad" : "Gujarat",
      state: "Gujarat",
      estimatedDeliveryDays: isSurat ? 1 : 2,
      courierPartner: isSurat ? "Avsaraa White Glove Dedicated" : "Blue Dart Express",
      codAvailable: true,
      rate: 50,
      chargeableWeightKg,
      source: "fallback_matrix",
    };
  } else if (isValidPin) {
    const cityMap: Array<[string, string, string, number]> = [
      ["11", "Delhi NCR", "Delhi", 3],
      ["40", "Mumbai", "Maharashtra", 3],
      ["41", "Pune", "Maharashtra", 3],
      ["56", "Bengaluru", "Karnataka", 4],
      ["50", "Hyderabad", "Telangana", 4],
      ["60", "Chennai", "Tamil Nadu", 4],
      ["70", "Kolkata", "West Bengal", 4],
      ["30", "Jaipur", "Rajasthan", 3],
    ];
    const matched = cityMap.find(([prefix]) => cleanPin.startsWith(prefix));
    result = {
      pincode: cleanPin,
      serviceable: true,
      city: matched ? matched[1] : "Serviceable City (Pan-India)",
      state: matched ? matched[2] : "India",
      estimatedDeliveryDays: matched ? matched[3] : 5,
      courierPartner: "Shiprocket Air Express",
      codAvailable: true,
      rate: 50,
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
