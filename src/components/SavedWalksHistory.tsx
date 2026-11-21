import { ChevronDown, Footprints, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Workout } from "../lib/types";
import { fmt, Panel, SectionHead } from "./ui";
import { cn } from "../utils/cn";

function formatWhen(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SavedWalksHistory({
  workouts,
  onDelete,
}: {
  workouts: Workout[];
  onDelete: (id: string) => void;
}) {
  return (
    <Panel className="anim-rise" as="div">
      <SectionHead
        index="03"
        title="Saved Walks History"
        hint={`${workouts.length} saved`}
        className="border-b border-line"
      />

      {workouts.length === 0 ? (
        <div className="px-5 py-10 md:px-6 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-dashed border-line text-dim">
            <Footprints size={22} strokeWidth={1.8} />
          </div>
          <p className="mt-4 text-[14px] font-semibold tracking-tight">No walks saved yet</p>
          <p className="mt-1.5 mx-auto max-w-sm font-mono text-[11.5px] leading-relaxed text-dim">
            Run a calculation above, then hit <span className="text-signal">Save walk</span> — your
            workouts persist across refreshes and device reopens.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-linesoft">
          {workouts.map((w) => (
            <WalkHistoryCard key={w.id} workout={w} onDelete={onDelete} />
          ))}
        </ul>
      )}
    </Panel>
  );
}

function WalkHistoryCard({
  workout,
  onDelete,
}: {
  workout: Workout;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const summary = [
    { label: "Steps", value: fmt.whole(workout.steps) },
    { label: "Distance", value: `${fmt.two(workout.distanceMi)} mi` },
    { label: "Duration", value: `${fmt.one(workout.durationMin)} min` },
    { label: "Avg pace", value: `${fmt.two(workout.speedMph)} mph` },
  ];

  const detail = [
    ["Distance", `${fmt.two(workout.distanceKm)} km`],
    ["Speed", `${fmt.two(workout.speedKmh)} km/h`],
    ["Cadence", workout.steps > 0 ? `${fmt.one(workout.cadence)} steps/min` : "—"],
    ["Stride", workout.strideLengthCm !== null ? `${fmt.one(workout.strideLengthCm)} cm` : "—"],
    ["Estimated MET", workout.met.met.toFixed(2)],
    ["Gross calories", `${fmt.one(workout.grossCalories)} kcal`],
    ["Resting subtracted", `${fmt.one(workout.restingCalories)} kcal`],
    ["BMR used", `${fmt.whole(workout.bmrDaily)} kcal/day`],
    ["Weight", `${fmt.one(workout.profile.weightKg)} kg`],
    ["Height", `${fmt.one(workout.profile.heightCm)} cm`],
    ["Age", `${workout.profile.age} yrs`],
    ["Net active", `${fmt.whole(workout.netActiveCalories)} kcal`],
  ];

  return (
    <li className="px-5 py-4 md:px-6">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-mono text-[11px] text-muted">{formatWhen(workout.savedAt)}</span>
            <span className="rounded-full border border-signal/30 bg-signal/10 px-2 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-signal">
              {workout.met.tier}
            </span>
          </div>

          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="tnum text-[30px] leading-none font-extrabold tracking-tighter">
              {fmt.whole(workout.netActiveCalories)}
            </span>
            <span className="font-mono text-[11.5px] text-signal">kcal net active</span>
          </div>

          <dl className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-2">
            {summary.map((s) => (
              <div key={s.label} className="min-w-0">
                <dt className="label truncate">{s.label}</dt>
                <dd className="mt-0.5 text-[13.5px] font-semibold tnum truncate">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-muted transition-colors hover:border-signal/50 hover:text-signal"
          >
            {open ? "Less" : "More"}
            <ChevronDown size={13} className={cn("transition-transform duration-200", open && "rotate-180")} />
          </button>

          {confirming ? (
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => onDelete(workout.id)}
                className="rounded-lg bg-coral px-3 py-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-void transition-opacity hover:opacity-90"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-lg border border-line px-3 py-2 font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted transition-colors hover:text-ink"
              >
                No
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              aria-label="Delete workout"
              className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted transition-colors hover:border-coral/60 hover:text-coral"
            >
              <Trash2 size={15} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="anim-fade mt-4 rounded-xl border border-line bg-panel2 p-4">
          <div className="label mb-3">Full breakdown at time of save</div>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
            {detail.map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className="label truncate">{k}</dt>
                <dd
                  className={cn(
                    "mt-1 text-[14px] font-semibold tnum truncate",
                    k === "Net active" && "text-signal",
                  )}
                >
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </li>
  );
}
