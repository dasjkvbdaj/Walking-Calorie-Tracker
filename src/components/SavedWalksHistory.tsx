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
  const [pendingDelete, setPendingDelete] = useState<Workout | null>(null);

  function handleConfirmDelete() {
    if (!pendingDelete) return;
    onDelete(pendingDelete.id);
    setPendingDelete(null);
  }

  return (
    <>
      <Panel className="anim-rise" as="div">
        <SectionHead
          index="01"
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
          </div>
        ) : (
          <ul className="divide-y divide-linesoft">
            {workouts.map((w) => (
              <WalkHistoryCard
                key={w.id}
                workout={w}
                onRequestDelete={() => setPendingDelete(w)}
              />
            ))}
          </ul>
        )}
      </Panel>

      {pendingDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-void/75 px-4 backdrop-blur-xs anim-fade"
          onClick={() => setPendingDelete(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-line bg-panel p-6 shadow-[0_20px_50px_rgba(0,0,0,0.45)] anim-rise"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="label text-coral mb-2">Delete workout</div>
            <h3 id="delete-modal-title" className="text-[17px] font-bold tracking-tight">
              Delete this saved walk?
            </h3>
            <p className="mt-2 font-mono text-[12px] text-muted">
              {fmt.whole(pendingDelete.netActiveCalories)} kcal net active · {fmt.two(pendingDelete.distanceMi)} mi
            </p>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded-xl border border-line bg-panel2 px-4 py-2.5 font-mono text-[11.5px] font-semibold uppercase tracking-[0.1em] text-ink transition-colors hover:border-signal/60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-xl bg-coral px-4 py-2.5 font-mono text-[11.5px] font-semibold uppercase tracking-[0.1em] text-white transition-opacity hover:opacity-90"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function WalkHistoryCard({
  workout,
  onRequestDelete,
}: {
  workout: Workout;
  onRequestDelete: () => void;
}) {
  const [open, setOpen] = useState(false);

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

          <button
            type="button"
            onClick={onRequestDelete}
            aria-label="Delete workout"
            className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted transition-colors hover:border-coral/60 hover:text-coral"
          >
            <Trash2 size={15} strokeWidth={2} />
          </button>
        </div>
      </div>

      {open && (
        <div className="anim-fade mt-4 rounded-xl border border-line bg-panel2 p-4">
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
