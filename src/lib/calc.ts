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

/** Age from date-of-birth against the real system date (turns 22 on 2026-12-08). */
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

/* ------------------------------------------------------- MET estimation -- */

/**
 * Speed (km/h) -> MET, interpolated strictly inside the intensity table:
 * slow < 4.0 km/h -> 2.8
 * moderate 4.0 - 4.8 km/h -> 3.3 - 3.5
 * brisk 4.8 - 5.6 km/h -> 3.8 - 4.3
 * fast > 5.6 km/h -> 5.0 and up (+0.42 MET per km/h, capped at 9)
 */
function speedToMet(speedKmh: number): number {
  if (speedKmh < 4.0) return 2.8;
  if (speedKmh < 4.8) return 3.3 + ((speedKmh - 4.0) / 0.8) * 0.2;
  if (speedKmh < 5.6) return 3.8 + ((speedKmh - 4.8) / 0.8) * 0.5;
  return Math.min(9, 5.0 + (speedKmh - 5.6) * 0.42);
}

/** Cadence (steps/min) -> supporting MET signal. */
const CADENCE_MET_ANCHORS: Array<[number, number]> = [
  [85, 2.4],
  [100, 2.9], // ~ slow
  [115, 3.4], // ~ moderate
  [130, 4.05], // ~ brisk
  [150, 5.0], // ~ fast
  [190, 6.5],
];

function interpolate(anchors: Array<[number, number]>, x: number): number {
  if (x <= anchors[0][0]) return anchors[0][1];
  const last = anchors[anchors.length - 1];
  if (x >= last[0]) return last[1];
  for (let i = 1; i < anchors.length; i++) {
    const [x1, y1] = anchors[i];
    if (x <= x1) {
      const [x0, y0] = anchors[i - 1];
      const t = (x - x0) / (x1 - x0);
      return y0 + t * (y1 - y0);
    }
  }
  return last[1];
}

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

/**
 * MET from walking speed, softened by cadence.
 * Speed sets the base via interpolation across the intensity ranges; cadence can
 * pull the estimate by at most -0.5 / +0.6 MET when steps/min disagrees with pace.
 */
export function estimateWalkingMET(speedKmh: number, cadence: number | null): MetEstimate {
  const clampedSpeed = Math.max(0, speedKmh);
  const speedMet = speedToMet(clampedSpeed);
  const tier = speedTier(clampedSpeed);

  if (cadence === null || cadence <= 0 || !isFinite(cadence)) {
    return {
      met: round2(speedMet),
      speedMet: round2(speedMet),
      cadenceMet: null,
      tier,
      cadenceTier: null,
      cadenceAdjusted: false,
    };
  }

  const cadenceMet = interpolate(CADENCE_MET_ANCHORS, cadence);
  const delta = cadenceMet - speedMet;
  const adjustment = Math.min(0.6, Math.max(-0.5, delta * 0.35));
  const met = Math.min(12, Math.max(1.9, speedMet + adjustment));

  return {
    met: round2(met),
    speedMet: round2(speedMet),
    cadenceMet: round2(cadenceMet),
    tier,
    cadenceTier: cadenceTier(cadence),
    cadenceAdjusted: Math.abs(adjustment) >= 0.05,
  };
}

/* ------------------------------------------------------------ calories -- */

/** ACSM Walking Equation: VO2 (mL/kg/min) = (0.1 * m_per_min) + 3.5 */
export function calculateWalkingVO2(metersPerMin: number): number {
  return 0.1 * Math.max(0, metersPerMin) + 3.5;
}

/** ACSM Walking Total Calories: ((VO2 * weight_kg) / 200) * duration_min */
export function calculateTotalWalkingCalories(
  vo2: number,
  weightKg: number,
  durationMin: number,
): number {
  return ((vo2 * weightKg) / 200) * durationMin;
}

/** Mifflin-St Jeor BMR equation for male or female. */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender = FIXED_GENDER,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === "female" ? base - 161 : base + 5;
}

/** Resting energy spent during the workout window. */
export function calculateRestingCalories(bmrDaily: number, durationMin: number): number {
  return (bmrDaily / 1440) * durationMin;
}

/** Net active calories = total_calories - resting_calories. */
export function calculateNetActiveCalories(totalCalories: number, restingCalories: number): number {
  return totalCalories - restingCalories;
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

  const autoSpeed = calculateSpeedMph(values.distanceMi, values.durationMin);
  const speedSource: "manual" | "auto" = values.speedMph !== null ? "manual" : "auto";
  const speedMph = values.speedMph !== null ? values.speedMph : (autoSpeed ?? 0);

  const speedKmh = mphToKmh(speedMph);
  const metersPerMin = calculateMetersPerMin(values.speedMph, values.distanceMi, values.durationMin);
  const vo2 = calculateWalkingVO2(metersPerMin);

  const cadence = calculateCadence(values.steps, values.durationMin);
  const met = estimateWalkingMET(speedKmh, values.steps > 0 ? cadence : null);

  const totalCalories = calculateTotalWalkingCalories(vo2, profile.weightKg, values.durationMin);
  const bmrDaily = calculateBMR(profile.weightKg, profile.heightCm, age, profile.gender);
  const restingCalories = calculateRestingCalories(bmrDaily, values.durationMin);
  const netActiveCalories = calculateNetActiveCalories(totalCalories, restingCalories);

  return {
    signature: signatureOf(values, profile, age),
    calculatedAt: Date.now(),
    profile: { weightKg: profile.weightKg, heightCm: profile.heightCm, age, gender: profile.gender },
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
    totalCalories,
    grossCalories: totalCalories,
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
