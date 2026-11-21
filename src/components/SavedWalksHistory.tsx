import { ChevronDown, Footprints, Pencil, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { parseCalcInputs, type CalcFieldErrors } from "../lib/calc";
import type { CalcInputs, CalcNumbers, Workout } from "../lib/types";
import { Button, Field, fmt, Panel, SectionHead } from "./ui";
import { cn } from "../utils/cn";

type FilterMode = "all" | "today" | "yesterday" | "date";

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

function toLocalDateInput(ts: number): string {
  const d = new Date(ts);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function workoutToInputs(w: Workout): CalcInputs {
  return {
    steps: String(w.steps),
    distanceMi: String(w.distanceMi),
    durationMin: String(w.durationMin),
    speedMph: w.speedSource === "manual" ? String(w.speedMph) : "",
  };
}

export function SavedWalksHistory({
  workouts,
  onDelete,
  onUpdate,
}: {
  workouts: Workout[];
  onDelete: (id: string) => void;
  onUpdate: (id: string, values: CalcNumbers) => void;
}) {
  const [pendingDelete, setPendingDelete] = useState<Workout | null>(null);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [editInputs, setEditInputs] = useState<CalcInputs>({
    steps: "",
    distanceMi: "",
    durationMin: "",
    speedMph: "",
  });
  const [initialEditInputs, setInitialEditInputs] = useState<CalcInputs>({
    steps: "",
    distanceMi: "",
    durationMin: "",
    speedMph: "",
  });
  const [editErrors, setEditErrors] = useState<CalcFieldErrors>({});

  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [selectedDate, setSelectedDate] = useState<string>(() => toLocalDateInput(Date.now()));

  const filteredWorkouts = useMemo(() => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    return workouts.filter((w) => {
      const savedDate = new Date(w.savedAt);
      if (filterMode === "today") return isSameLocalDay(savedDate, now);
      if (filterMode === "yesterday") return isSameLocalDay(savedDate, yesterday);
      if (filterMode === "date") {
        if (!selectedDate) return true;
        return toLocalDateInput(w.savedAt) === selectedDate;
      }
      return true;
    });
  }, [workouts, filterMode, selectedDate]);

  function openEditModal(workout: Workout) {
    const initial = workoutToInputs(workout);
    setEditingWorkout(workout);
    setInitialEditInputs(initial);
    setEditInputs(initial);
    setEditErrors({});
  }

  function closeEditModal() {
    setEditingWorkout(null);
    setEditErrors({});
  }

  const isDirty = useMemo(() => {
    if (!editingWorkout) return false;
    return (
      editInputs.steps.trim() !== initialEditInputs.steps.trim() ||
      editInputs.distanceMi.trim() !== initialEditInputs.distanceMi.trim() ||
      editInputs.durationMin.trim() !== initialEditInputs.durationMin.trim() ||
      editInputs.speedMph.trim() !== initialEditInputs.speedMph.trim()
    );
  }, [editingWorkout, editInputs, initialEditInputs]);

  function setEditField(key: keyof CalcInputs) {
    return (v: string) => {
      setEditInputs((prev) => ({ ...prev, [key]: v }));
      if (editErrors[key]) {
        setEditErrors((prev) => ({ ...prev, [key]: undefined }));
      }
    };
  }

  function handleUpdateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingWorkout || !isDirty) return;
    const { values, errors } = parseCalcInputs(editInputs);
    setEditErrors(errors);
    if (!values) return;
    onUpdate(editingWorkout.id, values);
    closeEditModal();
  }

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
          hint={`${filteredWorkouts.length} of ${workouts.length}`}
          className="border-b border-line"
        />

        {/* Date filter bar */}
        <div className="border-b border-line bg-panel2/60 px-5 py-3.5 md:px-6">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: "all", label: "All" },
                { id: "today", label: "Today" },
                { id: "yesterday", label: "Yesterday" },
                { id: "date", label: "Specific date" },
              ] as const
            ).map((item) => {
              const active = filterMode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilterMode(item.id)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] transition-colors",
                    active
                      ? "border-signal bg-signal/15 text-signal"
                      : "border-line bg-panel text-muted hover:text-ink",
                  )}
                >
                  {item.label}
                </button>
              );
            })}

            {filterMode === "date" && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                aria-label="Filter by specific date"
                className="rounded-lg border border-line bg-panel px-3 py-1.5 font-mono text-[11.5px] text-ink outline-none focus:border-signal/70"
              />
            )}
          </div>
        </div>

        {filteredWorkouts.length === 0 ? (
          <div className="px-5 py-10 md:px-6 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-dashed border-line text-dim">
              <Footprints size={22} strokeWidth={1.8} />
            </div>
            <p className="mt-4 text-[14px] font-semibold tracking-tight">No walks found</p>
          </div>
        ) : (
          <ul className="divide-y divide-linesoft">
            {filteredWorkouts.map((w) => (
              <WalkHistoryCard
                key={w.id}
                workout={w}
                onEdit={() => openEditModal(w)}
                onRequestDelete={() => setPendingDelete(w)}
              />
            ))}
          </ul>
        )}
      </Panel>

      {/* Edit pop-up modal */}
      {editingWorkout && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-void/75 px-4 backdrop-blur-xs anim-fade"
          onClick={closeEditModal}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-line bg-panel p-6 shadow-[0_20px_50px_rgba(0,0,0,0.45)] anim-rise"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <div className="label text-signal mb-1">Edit workout</div>
                <h3 id="edit-modal-title" className="text-[18px] font-bold tracking-tight">
                  Update walk values
                </h3>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                aria-label="Close edit modal"
                className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted transition-colors hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Steps walked"
                  name="editSteps"
                  value={editInputs.steps}
                  onChange={setEditField("steps")}
                  unit="steps"
                  inputMode="numeric"
                  error={editErrors.steps}
                />
                <Field
                  label="Distance"
                  name="editDistance"
                  value={editInputs.distanceMi}
                  onChange={setEditField("distanceMi")}
                  unit="mi"
                  error={editErrors.distanceMi}
                />
                <Field
                  label="Duration"
                  name="editDuration"
                  value={editInputs.durationMin}
                  onChange={setEditField("durationMin")}
                  unit="min"
                  inputMode="numeric"
                  error={editErrors.durationMin}
                />
                <Field
                  label="Average speed"
                  name="editSpeed"
                  value={editInputs.speedMph}
                  onChange={setEditField("speedMph")}
                  unit="mph"
                  placeholder="auto"
                  error={editErrors.speedMph}
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <Button type="button" variant="ghost" onClick={closeEditModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!isDirty}>
                  Update
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete pop-up modal */}
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
  onEdit,
  onRequestDelete,
}: {
  workout: Workout;
  onEdit: () => void;
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

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onEdit}
              aria-label="Edit workout"
              className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted transition-colors hover:border-signal/60 hover:text-signal"
            >
              <Pencil size={14} strokeWidth={2} />
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
