import type {
  CalcInputs,
  CalcNumbers,
  CalculationResult,
  Gender,
  IntensityTier,
  MetEstimate,
  Profile,
} from "./types";

export const MILES_TO_KM = 1.60934;
export const MILES_TO_METERS = 1609.34;
export const MPH_TO_METERS_PER_MIN = 26.8224;
export const DATE_OF_BIRTH = "2004-12-08";
export const FIXED_GENDER = "male" as const;

/* ------------------------------------------------------------------ age -- */

/** Age from date-of-birth against the real system date. */
export function calculateAge(dateOfBirth: string, now: Date = new Date()): number {
  const dob = parseISODate(dateOfBirth);
  if (!dob) return 0;
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) age -= 1;
  return Math.max(0, age);
}

function parseISODate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

/* --------------------------------------------------------------- speeds -- */

export function milesToKm(miles: number): number {
  return miles * MILES_TO_KM;
}

export function milesToMeters(miles: number): number {
  return miles * MILES_TO_METERS;
}

/** speed_mph = distance_mi / (duration_min / 60); null when duration is invalid. */
export function calculateSpeedMph(distanceMi: number, durationMin: number): number | null {
  if (!isFinite(durationMin) || durationMin <= 0 || !isFinite(distanceMi) || distanceMi < 0) {
    return null;
  }
  return distanceMi / (durationMin / 60);
}

export function mphToKmh(speedMph: number): number {
  return speedMph * MILES_TO_KM;
}

/** Converts speed to meters per minute; falls back to distance_meters / duration_min when speed is missing. */
export function calculateMetersPerMin(
  speedMph: number | null,
  distanceMi: number,
  durationMin: number,
): number {
  if (!isFinite(durationMin) || durationMin <= 0) return 0;
  if (speedMph !== null && isFinite(speedMph) && speedMph > 0) {
    return speedMph * MPH_TO_METERS_PER_MIN;
  }
  if (isFinite(distanceMi) && distanceMi > 0) {
    return milesToMeters(distanceMi) / durationMin;
  }
  return 0;
}

/* -------------------------------------------------------------- cadence -- */

/** cadence = steps / duration_min (steps/min) */
export function calculateCadence(steps: number, durationMin: number): number {
  if (!isFinite(durationMin) || durationMin <= 0 || !isFinite(steps) || steps <= 0) return 0;
  return steps / durationMin;
}

/* --------------------------------------------------- ACSM MET & calories -- */

export function speedTier(speedKmh: number): IntensityTier {
  if (speedKmh < 4.0) return "slow";
  if (speedKmh < 4.8) return "moderate";
  if (speedKmh <= 5.6) return "brisk";
  return "fast";
}

export function cadenceTier(cadence: number): IntensityTier {
  if (cadence < 100) return "slow";
  if (cadence < 115) return "moderate";
  if (cadence < 130) return "brisk";
  return "fast";
}

/** ACSM Walking Equation (flat surface, grade = 0): VO2 (mL/kg/min) = (0.1 * speed_m_per_min) + 3.5 */
export function calculateWalkingVO2(metersPerMin: number): number {
  return 0.1 * Math.max(0, metersPerMin) + 3.5;
}

/** MET derived from ACSM VO2: MET = VO2 / 3.5 */
export function calculateACSMMet(vo2: number): number {
  return Math.max(1, vo2 / 3.5);
}

export function buildMetEstimate(
  vo2: number,
  speedKmh: number,
  cadence: number | null,
): MetEstimate {
  const met = round2(calculateACSMMet(vo2));
  const tier = speedTier(Math.max(0, speedKmh));
  const validCadence = cadence !== null && cadence > 0 && isFinite(cadence);

  return {
    met,
    speedMet: met,
    cadenceMet: validCadence ? round2(cadence) : null,
    tier,
    cadenceTier: validCadence ? cadenceTier(cadence) : null,
    cadenceAdjusted: false,
  };
}

/**
 * ACSM Gross Calories (includes resting expenditure):
 * Gross Calories = (MET * 3.5 * weight_kg / 200) * duration_min
 */
export function calculateGrossWalkingCalories(
  met: number,
  weightKg: number,
  durationMin: number,
): number {
  return ((met * 3.5 * Math.max(0, weightKg)) / 200) * Math.max(0, durationMin);
}

/**
 * ACSM Active Calories (excludes 1-MET resting expenditure):
 * Active Calories = ((MET - 1) * 3.5 * weight_kg / 200) * duration_min
 */
export function calculateActiveWalkingCalories(
  met: number,
  weightKg: number,
  durationMin: number,
): number {
  return (((met - 1) * 3.5 * Math.max(0, weightKg)) / 200) * Math.max(0, durationMin);
}

/** Stride (cm) = (distance_m / steps) * 100 - null when steps are unknown. */
export function calculateStrideLengthCm(distanceMi: number, steps: number): number | null {
  if (!isFinite(steps) || steps <= 0 || !isFinite(distanceMi) || distanceMi <= 0) return null;
  return ((distanceMi * MILES_TO_METERS) / steps) * 100;
}

/* ------------------------------------------------------------- parsing -- */

export type CalcFieldErrors = Partial<Record<keyof CalcInputs, string>>;

/**
 * Validates raw calculator strings. Returns numbers when usable, otherwise a
 * per-field error map. Blank speed means "derive from distance & duration".
 */
export function parseCalcInputs(inputs: CalcInputs): {
  values: CalcNumbers | null;
  errors: CalcFieldErrors;
} {
  const errors: CalcFieldErrors = {};

  const stepsRaw = inputs.steps.trim();
  let steps = 0;
  if (stepsRaw !== "") {
    const n = Number(stepsRaw);
    if (!Number.isFinite(n)) errors.steps = "Enter a number";
    else if (n < 0) errors.steps = "Steps cannot be negative";
    else if (!Number.isInteger(n)) errors.steps = "Steps must be whole";
    else steps = n;
  }

  const distRaw = inputs.distanceMi.trim();
  let distanceMi = NaN;
  if (distRaw === "") errors.distanceMi = "Distance is required";
  else {
    const n = Number(distRaw);
    if (!Number.isFinite(n)) errors.distanceMi = "Enter a number";
    else if (n <= 0) errors.distanceMi = "Distance must be greater than 0";
    else if (n > 200) errors.distanceMi = "Distance looks too large";
    else distanceMi = n;
  }

  const durRaw = inputs.durationMin.trim();
  let durationMin = NaN;
  if (durRaw === "") errors.durationMin = "Duration is required";
  else {
    const n = Number(durRaw);
    if (!Number.isFinite(n)) errors.durationMin = "Enter a number";
    else if (n <= 0) errors.durationMin = "Duration must be greater than 0";
    else if (n > 1440) errors.durationMin = "Duration cannot exceed 1440 min";
    else durationMin = n;
  }

  let speedMph: number | null = null;
  const speedRaw = inputs.speedMph.trim();
  if (speedRaw !== "") {
    const n = Number(speedRaw);
    if (!Number.isFinite(n)) errors.speedMph = "Enter a number";
    else if (n <= 0) errors.speedMph = "Speed must be greater than 0";
    else if (n > 15) errors.speedMph = "Speed above 15 mph is out of range";
    else speedMph = n;
  }

  if (Object.keys(errors).length > 0) return { values: null, errors };

  return {
    values: {
      steps,
      distanceMi,
      durationMin,
      speedMph,
    },
    errors,
  };
}

/* ------------------------------------------------------------ full run -- */

export function signatureOf(values: CalcNumbers, profile: Profile, age: number): string {
  return [
    values.steps,
    values.distanceMi,
    values.durationMin,
    values.speedMph ?? "auto",
    profile.weightKg,
    profile.heightCm,
    age,
    profile.gender,
  ].join("|");
}

export function runCalculation(values: CalcNumbers, profile: Profile): CalculationResult {
  const age = calculateAge(profile.dateOfBirth);
  const gender: Gender = profile.gender === "female" ? "female" : FIXED_GENDER;

  const autoSpeed = calculateSpeedMph(values.distanceMi, values.durationMin);
  const speedSource: "manual" | "auto" = values.speedMph !== null ? "manual" : "auto";
  const speedMph = values.speedMph !== null ? values.speedMph : (autoSpeed ?? 0);

  const speedKmh = mphToKmh(speedMph);
  const metersPerMin = calculateMetersPerMin(values.speedMph, values.distanceMi, values.durationMin);
  const vo2 = calculateWalkingVO2(metersPerMin);
  const rawMet = calculateACSMMet(vo2);

  const cadence = calculateCadence(values.steps, values.durationMin);
  const met = buildMetEstimate(vo2, speedKmh, values.steps > 0 ? cadence : null);

  const grossCalories = calculateGrossWalkingCalories(rawMet, profile.weightKg, values.durationMin);
  const netActiveCalories = calculateActiveWalkingCalories(rawMet, profile.weightKg, values.durationMin);
  const restingCalories = Math.max(0, grossCalories - netActiveCalories);
  const bmrDaily = values.durationMin > 0 ? (restingCalories / values.durationMin) * 1440 : 0;

  return {
    signature: signatureOf(values, profile, age),
    calculatedAt: Date.now(),
    profile: { weightKg: profile.weightKg, heightCm: profile.heightCm, age, gender },
    steps: values.steps,
    distanceMi: values.distanceMi,
    distanceKm: milesToKm(values.distanceMi),
    durationMin: values.durationMin,
    speedMph,
    speedKmh,
    speedSource,
    cadence,
    strideLengthCm: calculateStrideLengthCm(values.distanceMi, values.steps),
    metersPerMin,
    vo2,
    met,
    bmrDaily,
    totalCalories: grossCalories,
    grossCalories,
    restingCalories,
    netActiveCalories,
  };
}

/* --------------------------------------------------------------- utils -- */

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
