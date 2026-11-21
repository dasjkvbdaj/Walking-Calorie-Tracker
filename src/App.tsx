import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, Info, TriangleAlert } from "lucide-react";
import { Navigation, type Page } from "./components/Navigation";
import { ProfileSettings } from "./components/ProfileSettings";
import { ProfileSummary } from "./components/ProfileSummary";
import { SavedWalksHistory } from "./components/SavedWalksHistory";
import { WalkCalculator } from "./components/WalkCalculator";
import { WalkResults } from "./components/WalkResults";
import { Button, StatCell, fmt } from "./components/ui";
import { calculateAge, parseCalcInputs, runCalculation, signatureOf } from "./lib/calc";
import {
  loadCalcInputs,
  loadHistory,
  loadProfile,
  saveCalcInputs,
  saveHistory,
  saveProfile,
} from "./lib/storage";
import type { CalcInputs, CalcNumbers, CalculationResult, Profile, Workout } from "./lib/types";

type Toast = { id: number; message: string; kind: "success" | "error" | "info" };

function makeId(): string {
  return `w_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function App() {
  /* ---------------------------------------------------------- state -- */
  const [page, setPage] = useState<Page>("calculator");
  const [profile, setProfile] = useState<Profile>(() => loadProfile());
  const [inputs, setInputs] = useState<CalcInputs>(() => loadCalcInputs());
  const [history, setHistory] = useState<Workout[]>(() => loadHistory());
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<number | null>(null);

  // First result derived from persisted inputs so a refresh never shows a blank board.
  const [lastValid, setLastValid] = useState<CalcNumbers | null>(() => {
    const parsed = parseCalcInputs(loadCalcInputs());
    return parsed.values;
  });
  const [result, setResult] = useState<CalculationResult | null>(() => {
    const parsed = parseCalcInputs(loadCalcInputs());
    if (!parsed.values) return null;
    try {
      return runCalculation(parsed.values, loadProfile());
    } catch {
      return null;
    }
  });

  const age = calculateAge(profile.dateOfBirth);

  /* ------------------------------------------------------- persistence -- */
  useEffect(() => {
    saveCalcInputs(inputs);
  }, [inputs]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }, [page]);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  /* ------------------------------------- keep results in step with profile -- */
  useEffect(() => {
    if (!lastValid) return;
    setResult(runCalculation(lastValid, profile));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.weightKg, profile.heightCm]);

  /* ------------------------------------------------------------- toast -- */
  function notify(message: string, kind: Toast["kind"] = "success") {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    const id = Date.now();
    setToast({ id, message, kind });
    toastTimer.current = window.setTimeout(() => setToast(null), 3000);
  }

  /* ---------------------------------------------------------- actions -- */
  function handleSaveProfile(next: Profile) {
    setProfile(next);
    saveProfile(next);
    notify(`Profile updated — ${fmt.one(next.weightKg)} kg · ${fmt.one(next.heightCm)} cm recalculated`);
  }

  function handleCalculate(values: CalcNumbers) {
    setLastValid(values);
    try {
      setResult(runCalculation(values, profile));
      notify("Net active calories calculated", "info");
    } catch {
      notify("Could not calculate with these inputs", "error");
    }
  }

  const alreadySaved = useMemo(
    () => (result ? history.some((w) => w.signature === result.signature) : false),
    [result, history],
  );

  function handleSaveWorkout() {
    if (!result) return;
    if (history.some((w) => w.signature === result.signature)) {
      notify("This walk is already saved", "info");
      return;
    }
    const workout: Workout = { ...result, id: makeId(), savedAt: Date.now() };
    setHistory((prev) =>
      [workout, ...prev].sort((a, b) => b.savedAt - a.savedAt),
    );
    notify(`Walk saved — ${fmt.whole(result.netActiveCalories)} kcal net active`);
  }

  function handleDelete(id: string) {
    setHistory((prev) => prev.filter((w) => w.id !== id));
    notify("Workout deleted", "info");
  }

  const currentSignature =
    lastValid !== null ? signatureOf(lastValid, profile, age) : null;
  const stale = Boolean(result && currentSignature && result.signature !== currentSignature);

  /* ------------------------------------------------------------- views -- */
  return (
    <div className="min-h-screen bg-void">
      <Navigation page={page} onChange={setPage} />

      <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-32 sm:px-6 md:pt-10 md:pb-20 lg:px-8">
        <div key={page} className="anim-rise">
          {page === "profile" ? (
            <ProfileView
              profile={profile}
              age={age}
              onSave={handleSaveProfile}
              onGoToCalculator={() => setPage("calculator")}
            />
          ) : (
            <CalculatorView
              profile={profile}
              age={age}
              inputs={inputs}
              onInputsChange={setInputs}
              onCalculate={handleCalculate}
              result={result}
              stale={stale}
              alreadySaved={alreadySaved}
              onSaveWorkout={handleSaveWorkout}
              history={history}
              onDelete={handleDelete}
            />
          )}
        </div>

        <footer className="mt-10 flex flex-col gap-2 border-t border-line pt-5 font-mono text-[10.5px] text-dim sm:flex-row sm:items-center sm:justify-between">
          <span>Cadence · net active calorie ledger</span>
          <span>
            Estimates only — MET, Mifflin-St Jeor BMR and gross-minus-resting model. Data stays in
            this browser.
          </span>
        </footer>
      </main>

      <ToastView toast={toast} />
    </div>
  );
}

/* =========================================================== profile page */

function ProfileView({
  profile,
  age,
  onSave,
  onGoToCalculator,
}: {
  profile: Profile;
  age: number;
  onSave: (p: Profile) => void;
  onGoToCalculator: () => void;
}) {
  return (
    <>
      <header className="mb-6 md:mb-8">
        <div className="label mb-3 flex items-center gap-2">
          <span className="h-px w-6 bg-signal" aria-hidden />
          Page 01 · Profile &amp; Settings
        </div>
        <h1 className="text-[clamp(2rem,6vw,3.4rem)] font-extrabold leading-[0.95] tracking-[-0.04em]">
          Your measurements,
          <br />
          <span className="text-signal">locked to the record.</span>
        </h1>
        <p className="mt-4 max-w-xl font-mono text-[12.5px] leading-relaxed text-muted">
          Date of birth and gender are fixed record fields. Weight and height feed every calorie
          calculation on the walk calculator — update them here and results recalculate instantly.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <ProfileSummary profile={profile} />
        </div>
        <div className="lg:col-span-7 space-y-5">
          <ProfileSettings profile={profile} onSave={onSave} />

          <section className="rounded-2xl border border-line bg-panel px-5 py-5 md:px-6">
            <div className="label mb-3">Live from your record</div>
            <div className="-mx-1 grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
              <div className="bg-panel"><StatCell label="Age" value={String(age)} unit="yrs" /></div>
              <div className="bg-panel"><StatCell label="Gender" value="Male" /></div>
              <div className="bg-panel"><StatCell label="Weight" value={fmt.one(profile.weightKg)} unit="kg" /></div>
              <div className="bg-panel"><StatCell label="Height" value={fmt.one(profile.heightCm)} unit="cm" /></div>
            </div>
            <Button variant="ghost" className="mt-5 w-full sm:w-auto" onClick={onGoToCalculator}>
              Open walk calculator <ArrowRight size={15} strokeWidth={2.4} />
            </Button>
          </section>
        </div>
      </div>
    </>
  );
}

/* ======================================================= calculator page */

function CalculatorView({
  profile,
  age,
  inputs,
  onInputsChange,
  onCalculate,
  result,
  stale,
  alreadySaved,
  onSaveWorkout,
  history,
  onDelete,
}: {
  profile: Profile;
  age: number;
  inputs: CalcInputs;
  onInputsChange: (i: CalcInputs) => void;
  onCalculate: (v: CalcNumbers) => void;
  result: CalculationResult | null;
  stale: boolean;
  alreadySaved: boolean;
  onSaveWorkout: () => void;
  history: Workout[];
  onDelete: (id: string) => void;
}) {
  const strip = [
    { label: "Age", value: String(age), unit: "yrs" },
    { label: "Gender", value: "Male" },
    { label: "Weight", value: fmt.one(profile.weightKg), unit: "kg" },
    { label: "Height", value: fmt.one(profile.heightCm), unit: "cm" },
  ];

  return (
    <>
      {/* Hero band */}
      <header className="relative overflow-hidden rounded-2xl border border-line grain mb-5">
        <img
          src="images/tread.jpg"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-right opacity-75"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-void via-void/85 to-void/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-void/85 via-transparent to-void/40" />
        <div className="relative px-5 py-6 sm:px-7 sm:py-8 md:px-8 md:py-10">
          <div className="label mb-3 flex items-center gap-2">
            <span className="h-px w-6 bg-signal" aria-hidden />
            Page 02 · Walk Calorie Calculator
          </div>
          <h1 className="max-w-md text-[clamp(1.9rem,5.4vw,3rem)] font-extrabold leading-[0.96] tracking-[-0.04em]">
            Steps in.
            <br />
            <span className="text-signal">Net active energy out.</span>
          </h1>
          <p className="mt-3 max-w-sm font-mono text-[11.5px] leading-relaxed text-muted">
            Gross walking calories minus the resting energy you would have burned anyway — the
            effort you actually added.
          </p>
        </div>
      </header>

      {/* Synchronized profile strip */}
      <section className="mb-5 overflow-hidden rounded-2xl border border-line bg-panel">
        <div className="flex items-center justify-between px-4 py-2.5 sm:px-5 border-b border-line">
          <span className="label">Active profile · synced with settings</span>
          <span className="hidden font-mono text-[10px] text-dim sm:inline">record 2004-12-08</span>
        </div>
        <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
          {strip.map((s) => (
            <div key={s.label} className="bg-panel">
              <StatCell label={s.label} value={s.value} unit={s.unit} />
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-5 lg:sticky lg:top-20 lg:self-start">
          <WalkCalculator inputs={inputs} onChange={onInputsChange} onCalculate={onCalculate} />
        </div>
        <div className="lg:col-span-7">
          {result ? (
            <WalkResults
              result={result}
              onSave={onSaveWorkout}
              alreadySaved={alreadySaved}
              stale={stale}
            />
          ) : (
            <section className="rounded-2xl border border-dashed border-line bg-panel px-6 py-12 text-center">
              <div className="label mb-3">Awaiting inputs</div>
              <p className="mx-auto max-w-sm font-mono text-[12px] leading-relaxed text-muted">
                Enter distance and duration, then press{" "}
                <span className="text-signal">Calculate net calories</span>. Invalid values such as
                negative distance or zero duration are blocked before any math runs.
              </p>
            </section>
          )}
        </div>
      </div>

      <div className="mt-5">
        <SavedWalksHistory workouts={history} onDelete={onDelete} />
      </div>
    </>
  );
}

/* ============================================================== toast */

function ToastView({ toast }: { toast: Toast | null }) {
  if (!toast) return null;
  const Icon =
    toast.kind === "success" ? Check : toast.kind === "error" ? TriangleAlert : Info;
  const tone =
    toast.kind === "success"
      ? "border-signal/40 text-signal"
      : toast.kind === "error"
        ? "border-coral/50 text-coral"
        : "border-line text-ink";

  return (
    <div
      role="status"
      aria-live="polite"
      className="anim-rise fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 md:bottom-6"
    >
      <div
        className={`flex max-w-md items-center gap-2.5 rounded-xl border bg-panel2/95 px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur ${tone}`}
      >
        <Icon size={15} strokeWidth={2.6} className="shrink-0" />
        <span className="font-mono text-[11.5px] leading-snug">{toast.message}</span>
      </div>
    </div>
  );
}
