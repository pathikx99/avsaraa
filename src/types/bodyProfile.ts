export type BodyGender = "female" | "male" | "other";
export type FitPreference = "snug" | "regular" | "relaxed";

export interface BodyProfile {
  id: string;
  profile_name: string;
  gender: BodyGender;
  height_cm: number | null;
  weight_kg: number | null;
  bust_chest_in: number | null;
  waist_in: number | null;
  hip_in: number | null;
  shoulder_in?: number | null;
  fit_preference: FitPreference;
  preferred_size?: string;
  is_default?: boolean;
  updated_at?: string;
}

export const BODY_PROFILE_PRESETS = ["My Profile", "Mother", "Sister", "Wife"] as const;
