import type { BodyProfile } from "../types/bodyProfile.ts";

export interface SizeRecommendation {
  recommendedSize: string;
  matchedAvailableSize: string;
  confidence: "measurement" | "height_weight" | "preference" | "free_size";
  summary: string;
  blouseNote?: string;
}

const STANDARD_LADDER = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;

const SIZE_CHART_BOUNDS: Array<{
  size: (typeof STANDARD_LADDER)[number];
  bustMax: number;
  waistMax: number;
  hipMax: number;
}> = [
  { size: "XS", bustMax: 32.5, waistMax: 26.5, hipMax: 36.5 },
  { size: "S", bustMax: 34.5, waistMax: 28.5, hipMax: 38.5 },
  { size: "M", bustMax: 36.5, waistMax: 30.5, hipMax: 40.5 },
  { size: "L", bustMax: 38.5, waistMax: 32.5, hipMax: 42.5 },
  { size: "XL", bustMax: 40.5, waistMax: 34.5, hipMax: 44.5 },
  { size: "XXL", bustMax: 42.5, waistMax: 36.5, hipMax: 46.5 },
  { size: "XXXL", bustMax: 50, waistMax: 46, hipMax: 54 },
];

function findLadderIndex(value: number, key: "bustMax" | "waistMax" | "hipMax"): number {
  const idx = SIZE_CHART_BOUNDS.findIndex((row) => value <= row[key]);
  return idx >= 0 ? idx : STANDARD_LADDER.length - 1;
}

function mapToClosestAvailableSize(targetSize: string, availableSizes: string[]): string {
  if (!availableSizes || availableSizes.length === 0) return targetSize;

  const exact = availableSizes.find((s) => s.trim().toUpperCase() === targetSize.toUpperCase());
  if (exact) return exact;

  const freeOpt = availableSizes.find((s) => s.toLowerCase().includes("free"));
  if (availableSizes.length === 1 && freeOpt) return freeOpt;

  const targetIdx = STANDARD_LADDER.indexOf(targetSize as (typeof STANDARD_LADDER)[number]);
  if (targetIdx === -1) return availableSizes[0];

  let best = availableSizes[0];
  let bestDist = 999;

  for (const avail of availableSizes) {
    const clean = avail.trim().toUpperCase().replace(/\s+SIZE$/, "");
    const availIdx = STANDARD_LADDER.indexOf(clean as (typeof STANDARD_LADDER)[number]);
    if (availIdx !== -1) {
      const dist = Math.abs(availIdx - targetIdx);
      if (dist < bestDist) {
        bestDist = dist;
        best = avail;
      }
    }
  }

  return best;
}

/**
 * Recommends an ideal AVSARAA size using a customer's saved body profile measurements or height/weight.
 */
export function recommendSizeForProduct(
  profile: Partial<BodyProfile>,
  availableSizes: string[] = ["XS", "S", "M", "L", "XL", "XXL"],
  category?: string
): SizeRecommendation {
  const isSingleFreeSize =
    availableSizes.length === 1 && availableSizes[0].toLowerCase().includes("free");

  let recommendedIndex = -1;
  let confidence: SizeRecommendation["confidence"] = "measurement";
  const reasons: string[] = [];

  const bust = Number(profile.bust_chest_in) || 0;
  const waist = Number(profile.waist_in) || 0;
  const hip = Number(profile.hip_in) || 0;

  if (bust > 0 || waist > 0 || hip > 0) {
    const indices: number[] = [];
    if (bust > 0) {
      indices.push(findLadderIndex(bust, "bustMax"));
      reasons.push(`Bust/Chest ${bust}"`);
    }
    if (waist > 0) {
      indices.push(findLadderIndex(waist, "waistMax"));
      reasons.push(`Waist ${waist}"`);
    }
    if (hip > 0) {
      indices.push(findLadderIndex(hip, "hipMax"));
      reasons.push(`Hip ${hip}"`);
    }
    recommendedIndex = Math.max(...indices);
    confidence = "measurement";
  } else if ((Number(profile.weight_kg) || 0) > 0) {
    const weight = Number(profile.weight_kg);
    const height = Number(profile.height_cm) || 162;
    // Slight adjustment for taller/shorter frame at same weight
    const frameOffset = height >= 170 ? -0.5 : height <= 154 ? 0.5 : 0;
    const effectiveWeight = weight + frameOffset * 3;

    if (effectiveWeight < 50) recommendedIndex = 0; // XS
    else if (effectiveWeight < 56) recommendedIndex = 1; // S
    else if (effectiveWeight < 64) recommendedIndex = 2; // M
    else if (effectiveWeight < 72) recommendedIndex = 3; // L
    else if (effectiveWeight < 80) recommendedIndex = 4; // XL
    else if (effectiveWeight < 90) recommendedIndex = 5; // XXL
    else recommendedIndex = 6; // XXXL

    confidence = "height_weight";
    reasons.push(`${height} cm`, `${weight} kg`);
  } else if (profile.preferred_size) {
    const prefIdx = STANDARD_LADDER.indexOf(
      profile.preferred_size.trim().toUpperCase() as (typeof STANDARD_LADDER)[number]
    );
    recommendedIndex = prefIdx >= 0 ? prefIdx : 2;
    confidence = "preference";
    reasons.push(`Saved preference ${profile.preferred_size}`);
  } else {
    recommendedIndex = 2; // Default balanced M
    confidence = "preference";
  }

  if (profile.fit_preference === "relaxed" && recommendedIndex < STANDARD_LADDER.length - 1) {
    recommendedIndex += 1;
    reasons.push("Relaxed fit (+1)");
  } else if (profile.fit_preference === "snug" && confidence === "height_weight" && recommendedIndex > 0) {
    recommendedIndex -= 1;
    reasons.push("Snug fit");
  }

  const baseSize = STANDARD_LADDER[Math.max(0, Math.min(STANDARD_LADDER.length - 1, recommendedIndex))];
  const matchedAvailableSize = mapToClosestAvailableSize(baseSize, availableSizes);
  const labelPrefix = profile.profile_name ? `For ${profile.profile_name}: ` : "";

  if (isSingleFreeSize || category === "Sarees" && availableSizes.some((s) => s.toLowerCase().includes("free")) && availableSizes.length === 1) {
    return {
      recommendedSize: baseSize,
      matchedAvailableSize: availableSizes[0],
      confidence: "free_size",
      summary: `${labelPrefix}Free-size drape (5.5m) fits comfortably · Tailored blouse guidance: Size ${baseSize}${reasons.length ? ` (${reasons.join(", ")})` : ""}.`,
      blouseNote: `For the included 0.8m unstitched blouse fabric, tailor to your ${baseSize} (${bust ? `${bust}" bust` : "standard"}) fit.`,
    };
  }

  return {
    recommendedSize: baseSize,
    matchedAvailableSize,
    confidence,
    summary: `${labelPrefix}Recommended ${matchedAvailableSize}${reasons.length ? ` based on ${reasons.join(" · ")}` : ""}.`,
  };
}
