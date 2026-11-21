import { DATE_OF_BIRTH, FIXED_GENDER } from "./calc";
import type { CalcInputs, Profile, Workout } from "./types";

export const STORAGE_KEYS = {
  profile: "walkTrackerProfile",
  history: "walkTrackerHistory",
  calculatorInputs: "walkTrackerCalculatorInputs",
} as const;

export const DEFAULT_PROFILE: Profile = {
  weightKg: 113.2,
  heightCm: 177,
  dateOfBirth: DATE_OF_BIRTH,
  gender: FIXED_GENDER,
};

export const DEFAULT_CALC_INPUTS: CalcInputs = {
  steps: "5584",
  distanceMi: "2.38",
  durationMin: "50",
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
    /* storage unavailable (private mode / quota) — fail silently, app still works */
  }
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/* -------------------------------------------------------------- profile -- */

export function loadProfile(): Profile {
  const stored = readRaw(STORAGE_KEYS.profile);
  if (!stored || typeof stored !== "object") return { ...DEFAULT_PROFILE };
  const s = stored as Partial<Profile>;

  const weightKg = isFiniteNumber(s.weightKg) ? clamp(s.weightKg, 30, 300) : DEFAULT_PROFILE.weightKg;
  const heightCm = isFiniteNumber(s.heightCm) ? clamp(s.heightCm, 80, 260) : DEFAULT_PROFILE.heightCm;

  return {
    weightKg: round1dp(weightKg),
    heightCm: round1dp(heightCm),
    dateOfBirth: DATE_OF_BIRTH, // fixed by spec — never taken from storage
    gender: FIXED_GENDER,
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
    isFiniteNumber(w.netActiveCalories) &&
    isFiniteNumber(w.distanceMi) &&
    isFiniteNumber(w.durationMin)
  );
}

export function loadHistory(): Workout[] {
  const stored = readRaw(STORAGE_KEYS.history);
  if (!Array.isArray(stored)) return [];
  const valid = stored.filter(isWorkout);
  return valid.sort((a, b) => b.savedAt - a.savedAt);
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
