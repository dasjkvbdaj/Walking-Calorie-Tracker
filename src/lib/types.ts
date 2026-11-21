export type Gender = "male";

export interface Profile {
  weightKg: number;
  heightCm: number;
  dateOfBirth: string; // ISO yyyy-mm-dd
  gender: Gender;
}

/** Calculator inputs kept as raw strings so blank/typed states survive navigation. */
export interface CalcInputs {
  steps: string;
  distanceMi: string;
  durationMin: string;
  speedMph: string;
}

/** Validated numeric form of the calculator inputs. */
export interface CalcNumbers {
  steps: number;
  distanceMi: number;
  durationMin: number;
  /** null => derive from distance & duration */
  speedMph: number | null;
}

export type IntensityTier = "slow" | "moderate" | "brisk" | "fast";

export interface MetEstimate {
  met: number;
  speedMet: number;
  cadenceMet: number | null;
  tier: IntensityTier;
  cadenceTier: IntensityTier | null;
  cadenceAdjusted: boolean;
}

export interface CalculationResult {
  /** signature of inputs + profile used for this result */
  signature: string;
  calculatedAt: number;
  profile: { weightKg: number; heightCm: number; age: number; gender: Gender };
  steps: number;
  distanceMi: number;
  distanceKm: number;
  durationMin: number;
  speedMph: number;
  speedKmh: number;
  speedSource: "manual" | "auto";
  cadence: number;
  strideLengthCm: number | null;
  met: MetEstimate;
  bmrDaily: number;
  grossCalories: number;
  restingCalories: number;
  netActiveCalories: number;
}

export interface Workout extends CalculationResult {
  id: string;
  savedAt: number;
}
