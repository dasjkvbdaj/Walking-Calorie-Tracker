import { ChevronDown, Save, ShieldCheck } from "lucide-react";
import { useState } from "react";
import type { CalculationResult } from "../lib/types";
import { Button, fmt, Panel, StatCell, useCountUp } from "./ui";
import { cn } from "../utils/cn";

export function WalkResults({
  result,
  onSave,
  alreadySaved,
  stale,
}: {
  result: CalculationResult;
  onSave: () => void;
  alreadySaved: boolean;
  stale: boolean;
}) {
  const animatedActive = useCountUp(Math.round(result.netActiveCalories), 750);
  const animatedTotal = useCountUp(Math.round(result.totalCalories), 750);
  const [open, setOpen] = useState(true);

  const stats: Array<{ label: string; value: string; unit?: string; sub?: string }> = [
    { label: "Active Calories", value: fmt.whole(result.netActiveCalories), unit: "kcal" },
    { label: "Total Calories", value: fmt.whole(result.totalCalories), unit: "kcal" },
    { label: "Steps", value: fmt.whole(result.steps), unit: "steps" },
    { label: "Distance", value: fmt.two(result.distanceMi), unit: "mi" },
    { label: "Distance", value: fmt.two(result.distanceKm), unit: "km" },
    { label: "Duration", value: fmt.one(result.durationMin), unit: "min" },
    { label: "Avg speed", value: fmt.two(result.speedMph), unit: "mph" },
    { label: "Speed", value: fmt.two(result.speedKmh), unit: "km/h" },
    {
      label: "Step cadence",
      value: result.steps > 0 ? fmt.one(result.cadence) : "-",
      unit: result.steps > 0 ? "steps/min" : undefined,
    },
    {
      label: "Stride length",
      value: result.strideLengthCm !== null ? fmt.one(result.strideLengthCm) : "-",
      unit: result.strideLengthCm !== null ? "cm" : undefined,
    },
  ];

  return (
    <Panel className="anim-rise" as="div">
      {/* Primary readout */}
      <div className="relative overflow-hidden grain border-b border-line">
        <div
          className="absolute inset-0 opacity-[0.55]"
          style={{
            background:
              "radial-gradient(120% 90% at 85% -10%, rgba(199,249,77,0.16) 0%, rgba(199,249,77,0) 55%)",
          }}
          aria-hidden
        />
        <div className="relative px-5 pt-6 pb-6 md:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="label text-signal">Active Calories Burned</span>
            {stale && (
              <span className="rounded-full border border-line bg-panel2 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                updated
              </span>
            )}
          </div>

          <div className="mt-3 flex items-end gap-3">
            <span className="tnum font-extrabold leading-[0.82] tracking-[-0.05em] text-[clamp(3.6rem,14vw,6.8rem)]">
              {fmt.whole(animatedActive)}
            </span>
            <span className="pb-2.5 font-mono text-[15px] text-signal">kcal active</span>
          </div>

          <div className="mt-3 flex items-baseline gap-2 font-mono text-[13px] text-muted">
            <span>Total Calories:</span>
            <span className="tnum text-[17px] font-bold text-ink">
              {fmt.whole(animatedTotal)} kcal
            </span>
          </div>

          <div className="mt-5 flex flex-col sm:flex-row gap-3 sm:items-center">
            <Button
              onClick={onSave}
              disabled={alreadySaved}
              className={cn(
                "w-full sm:w-auto",
                alreadySaved && "border border-line bg-panel2 text-signal disabled:opacity-100",
              )}
            >
              {alreadySaved ? <ShieldCheck size={16} strokeWidth={2.4} /> : <Save size={16} strokeWidth={2.4} />}
              {alreadySaved ? "Already saved" : "Save walk"}
            </Button>
          </div>
        </div>
      </div>

      {/* Supporting statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-line">
        {stats.map((s, i) => (
          <div key={s.label + i} className="bg-panel">
            <StatCell label={s.label} value={s.value} unit={s.unit} sub={s.sub} />
          </div>
        ))}
      </div>

      {/* Calculation details */}
      <div className="border-t border-line">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-3 px-5 py-4 md:px-6 text-left transition-colors hover:bg-panel2/60"
        >
          <span className="flex items-center gap-3 min-w-0">
            <span className="text-[13.5px] font-semibold tracking-tight">Calculation Details</span>
          </span>
          <ChevronDown
            size={17}
            className={cn(
              "shrink-0 text-muted transition-transform duration-200",
              open && "rotate-180 text-signal",
            )}
          />
        </button>

        {open && (
          <div className="anim-fade px-5 pb-6 md:px-6">
            <Ledger result={result} />
          </div>
        )}
      </div>
    </Panel>
  );
}

function Ledger({ result }: { result: CalculationResult }) {
  const rows = [
    {
      label: "Speed (m/min)",
      value: result.metersPerMin.toFixed(2),
      unit: "m/min",
      dim: true,
    },
    {
      label: "ACSM VO2",
      value: result.vo2.toFixed(2),
      unit: "mL/kg/min",
      dim: true,
    },
    {
      label: "Total calories (ACSM)",
      value: fmt.one(result.totalCalories),
      unit: "kcal",
      dim: true,
    },
    {
      label: "Resting calories subtracted (Mifflin-St Jeor)",
      value: `- ${fmt.one(result.restingCalories)}`,
      unit: "kcal",
      dim: true,
    },
    {
      label: "Active calories (Net)",
      value: fmt.whole(result.netActiveCalories),
      unit: "kcal",
      dim: false,
    },
  ];

  return (
    <div className="rounded-xl border border-line bg-panel2 overflow-hidden">
      <dl>
        {rows.map((r) => (
          <div
            key={r.label}
            className={cn(
              "flex items-baseline justify-between gap-4 px-4 py-3 border-b border-linesoft last:border-b-0",
              !r.dim && "bg-signal/[0.07]",
            )}
          >
            <div className="min-w-0">
              <dt
                className={cn(
                  "text-[13px] font-medium tracking-tight",
                  r.dim ? "text-muted" : "text-ink",
                )}
              >
                {r.label}
              </dt>
            </div>
            <div className="text-right shrink-0">
              <span
                className={cn(
                  "tnum font-semibold tracking-tight",
                  r.dim ? "text-[15px] text-ink/80" : "text-[20px] text-signal",
                )}
              >
                {r.value}
              </span>
              <span className="ml-1.5 font-mono text-[10.5px] text-muted">{r.unit}</span>
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
}
