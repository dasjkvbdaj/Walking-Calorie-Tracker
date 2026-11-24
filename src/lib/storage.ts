import { DATE_OF_BIRTH, FIXED_GENDER, runCalculation } from "./calc";
import type { CalcInputs, CalcNumbers, Profile, Workout } from "./types";

export type ThemeMode = "dark" | "light";

export const STORAGE_KEYS = {
  profile: "walkTrackerProfile",
  history: "walkTrackerHistory",
  calculatorInputs: "walkTrackerCalculatorInputs",
  theme: "walkTrackerTheme",
} as const;

export const DEFAULT_PROFILE: Profile = {
  weightKg: 113.2,
  heightCm: 177,
  dateOfBirth: DATE_OF_BIRTH,
  gender: FIXED_GENDER,
};

export const DEFAULT_CALC_INPUTS: CalcInputs = {
  steps: "",
  distanceMi: "",
  durationMin: "",
  speedMph: "",
};

/* ------------------------------------------------------- safe low-level -- */

function readRaw(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode / quota) - fail silently, app still works */
  }
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/* ---------------------------------------------------------------- theme -- */

export function loadTheme(): ThemeMode {
  const stored = readRaw(STORAGE_KEYS.theme);
  return stored === "light" || stored === "dark" ? stored : "dark";
}

export function saveTheme(theme: ThemeMode): void {
  writeRaw(STORAGE_KEYS.theme, theme);
}

/* -------------------------------------------------------------- profile -- */

export function loadProfile(): Profile {
  const stored = readRaw(STORAGE_KEYS.profile);
  if (!stored || typeof stored !== "object") return { ...DEFAULT_PROFILE };
  const s = stored as Partial<Profile>;

  const weightKg = isFiniteNumber(s.weightKg) ? clamp(s.weightKg, 30, 300) : DEFAULT_PROFILE.weightKg;
  const heightCm = isFiniteNumber(s.heightCm) ? clamp(s.heightCm, 80, 260) : DEFAULT_PROFILE.heightCm;
  const gender = s.gender === "female" || s.gender === "male" ? s.gender : FIXED_GENDER;
  const dateOfBirth = typeof s.dateOfBirth === "string" && s.dateOfBirth ? s.dateOfBirth : DATE_OF_BIRTH;

  return {
    weightKg: round1dp(weightKg),
    heightCm: round1dp(heightCm),
    dateOfBirth,
    gender,
  };
}

export function saveProfile(profile: Profile): void {
  writeRaw(STORAGE_KEYS.profile, {
    weightKg: profile.weightKg,
    heightCm: profile.heightCm,
    dateOfBirth: profile.dateOfBirth,
    gender: profile.gender,
  });
}

/* -------------------------------------------------------------- history -- */

function isWorkout(v: unknown): v is Workout {
  if (!v || typeof v !== "object") return false;
  const w = v as Partial<Workout>;
  return (
    typeof w.id === "string" &&
    isFiniteNumber(w.savedAt) &&
    isFiniteNumber(w.distanceMi) &&
    isFiniteNumber(w.durationMin)
  );
}

/** Recalculates a saved workout using the current ACSM + Mifflin-St Jeor BMR equation. */
export function recalculateWorkout(workout: Workout, fallbackProfile?: Profile): Workout {
  const profile: Profile = {
    weightKg: isFiniteNumber(workout.profile?.weightKg)
      ? workout.profile.weightKg
      : (fallbackProfile?.weightKg ?? DEFAULT_PROFILE.weightKg),
    heightCm: isFiniteNumber(workout.profile?.heightCm)
      ? workout.profile.heightCm
      : (fallbackProfile?.heightCm ?? DEFAULT_PROFILE.heightCm),
    dateOfBirth: fallbackProfile?.dateOfBirth ?? DATE_OF_BIRTH,
    gender:
      workout.profile?.gender === "female" || workout.profile?.gender === "male"
        ? workout.profile.gender
        : (fallbackProfile?.gender ?? FIXED_GENDER),
  };

  const manualSpeed =
    workout.speedSource === "manual" && isFiniteNumber(workout.speedMph) && workout.speedMph > 0
      ? workout.speedMph
      : null;

  const numbers: CalcNumbers = {
    steps: isFiniteNumber(workout.steps) ? workout.steps : 0,
    distanceMi: workout.distanceMi,
    durationMin: workout.durationMin,
    speedMph: manualSpeed,
  };

  const updated = runCalculation(numbers, profile);

  return {
    ...workout,
    ...updated,
    id: workout.id,
    savedAt: workout.savedAt,
  };
}

export function loadHistory(profile?: Profile): Workout[] {
  const stored = readRaw(STORAGE_KEYS.history);
  if (!Array.isArray(stored)) return [];
  const valid = stored.filter(isWorkout).map((w) => recalculateWorkout(w, profile));
  const sorted = valid.sort((a, b) => b.savedAt - a.savedAt);
  saveHistory(sorted);
  return sorted;
}

export function saveHistory(history: Workout[]): void {
  writeRaw(STORAGE_KEYS.history, history);
}

/* ------------------------------------------------------ calculator input -- */

export function loadCalcInputs(): CalcInputs {
  const stored = readRaw(STORAGE_KEYS.calculatorInputs);
  if (!stored || typeof stored !== "object") return { ...DEFAULT_CALC_INPUTS };
  const s = stored as Partial<CalcInputs>;
  const pick = (k: keyof CalcInputs, fallback: string): string =>
    typeof s[k] === "string" ? (s[k] as string) : fallback;

  return {
    steps: pick("steps", DEFAULT_CALC_INPUTS.steps),
    distanceMi: pick("distanceMi", DEFAULT_CALC_INPUTS.distanceMi),
    durationMin: pick("durationMin", DEFAULT_CALC_INPUTS.durationMin),
    speedMph: pick("speedMph", DEFAULT_CALC_INPUTS.speedMph),
  };
}

export function saveCalcInputs(inputs: CalcInputs): void {
  writeRaw(storageKeyCalc(), inputs);
}

function storageKeyCalc(): string {
  return STORAGE_KEYS.calculatorInputs;
}

function round1dp(n: number): number {
  return Math.round(n * 10) / 10;
}
