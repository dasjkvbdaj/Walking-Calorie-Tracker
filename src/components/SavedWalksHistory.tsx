import { ChevronDown, Footprints, Pencil, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { parseCalcInputs, type CalcFieldErrors } from "../lib/calc";
import type { CalcInputs, CalcNumbers, Workout } from "../lib/types";
import { Button, Field, fmt, Panel, SectionHead } from "./ui";
import { cn } from "../utils/cn";

type FilterMode = "all" | "today" | "date" | "week" | "month" | "range";

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

function toLocalDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toLocalDateInput(ts: number): string {
  return toLocalDateStr(new Date(ts));
}

function parseLocalDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function isValidDateStr(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  return toLocalDateStr(parseLocalDate(s)) === s;
}

function addDays(dateStr: string, days: number): string {
  const d = parseLocalDate(dateStr);
  d.setDate(d.getDate() + days);
  return toLocalDateStr(d);
}

function shiftMonth(dateStr: string, months: number): string {
  const d = parseLocalDate(dateStr);
  return toLocalDateStr(new Date(d.getFullYear(), d.getMonth() + months, 1));
}

function weekRange(dateStr: string): { from: string; to: string } {
  const d = parseLocalDate(dateStr);
  const offset = (d.getDay() + 6) % 7;
  const start = addDays(dateStr, -offset);
  return { from: start, to: addDays(start, 6) };
}

function monthRange(dateStr: string): { from: string; to: string } {
  const d = parseLocalDate(dateStr);
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { from: toLocalDateStr(first), to: toLocalDateStr(last) };
}

function formatShortDate(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatLongDate(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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
  const today = toLocalDateStr(new Date());

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
  const [filterDate, setFilterDate] = useState<string>(today);
  const [rangeFrom, setRangeFrom] = useState<string>(addDays(today, -30));
  const [rangeTo, setRangeTo] = useState<string>(today);

  function handleSelectFilter(nextMode: FilterMode) {
    setFilterMode(nextMode);
    const nowToday = toLocalDateStr(new Date());
    if (nextMode === "date" || nextMode === "week" || nextMode === "month") {
      setFilterDate(nowToday);
    } else if (nextMode === "range") {
      setRangeTo(nowToday);
      setRangeFrom(addDays(nowToday, -30));
    }
  }

  const bounds = useMemo<{ from: string; to: string } | null>(() => {
    const nowToday = toLocalDateStr(new Date());
    switch (filterMode) {
      case "today":
        return { from: nowToday, to: nowToday };
      case "date":
        return { from: filterDate, to: filterDate };
      case "week":
        return weekRange(filterDate);
      case "month":
        return monthRange(filterDate);
      case "range":
        return rangeFrom <= rangeTo
          ? { from: rangeFrom, to: rangeTo }
          : { from: rangeTo, to: rangeFrom };
      default:
        return null;
    }
  }, [filterMode, filterDate, rangeFrom, rangeTo]);

  const filteredWorkouts = useMemo(() => {
    if (!bounds) return workouts;
    return workouts.filter((w) => {
      const d = toLocalDateInput(w.savedAt);
      return d >= bounds.from && d <= bounds.to;
    });
  }, [workouts, bounds]);

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

        {/* Filter controls */}
        <div className="border-b border-line bg-panel2/60 px-5 py-3.5 md:px-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterMode}
              aria-label="Filter"
              onChange={(e) => handleSelectFilter(e.target.value as FilterMode)}
              className="rounded-xl border border-line bg-panel px-3.5 py-2 font-mono text-[11.5px] font-medium text-ink outline-none transition-colors focus:border-signal/70"
            >
              <option value="all">All records</option>
              <option value="today">Today</option>
              <option value="date">Specific date</option>
              <option value="week">Selected week</option>
              <option value="month">Selected month</option>
              <option value="range">Custom range</option>
            </select>
          </div>

          {filterMode === "today" && (
            <div className="anim-fade font-mono text-[11.5px] text-muted">
              {formatLongDate(toLocalDateStr(new Date()))}
            </div>
          )}

          {filterMode === "date" && (
            <div className="anim-fade flex flex-wrap items-center gap-2">
              <button
                type="button"
                aria-label="Previous day"
                onClick={() => setFilterDate((d) => addDays(d, -1))}
                className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-panel text-ink transition-colors hover:border-signal/60 hover:text-signal"
              >
                ◀
              </button>
              <input
                type="date"
                value={filterDate}
                aria-label="Date"
                onChange={(e) => {
                  if (isValidDateStr(e.target.value)) setFilterDate(e.target.value);
                }}
                className="rounded-lg border border-line bg-panel px-3 py-1.5 font-mono text-[11.5px] text-ink outline-none focus:border-signal/70"
              />
              <button
                type="button"
                aria-label="Next day"
                onClick={() => setFilterDate((d) => addDays(d, 1))}
                className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-panel text-ink transition-colors hover:border-signal/60 hover:text-signal"
              >
                ▶
              </button>
            </div>
          )}

          {filterMode === "week" && (
            <div className="anim-fade space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  aria-label="Previous week"
                  onClick={() => setFilterDate((d) => addDays(d, -7))}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-panel text-ink transition-colors hover:border-signal/60 hover:text-signal"
                >
                  ◀
                </button>
                <input
                  type="date"
                  value={filterDate}
                  aria-label="Any day in the week"
                  onChange={(e) => {
                    if (isValidDateStr(e.target.value)) setFilterDate(e.target.value);
                  }}
                  className="rounded-lg border border-line bg-panel px-3 py-1.5 font-mono text-[11.5px] text-ink outline-none focus:border-signal/70"
                />
                <button
                  type="button"
                  aria-label="Next week"
                  onClick={() => setFilterDate((d) => addDays(d, 7))}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-panel text-ink transition-colors hover:border-signal/60 hover:text-signal"
                >
                  ▶
                </button>
              </div>
              <p className="font-mono text-[11px] text-muted">
                Week: {formatShortDate(weekRange(filterDate).from)} - {formatShortDate(weekRange(filterDate).to)} (Mon-Sun)
              </p>
            </div>
          )}

          {filterMode === "month" && (
            <div className="anim-fade space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={() => setFilterDate((d) => shiftMonth(d, -1))}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-panel text-ink transition-colors hover:border-signal/60 hover:text-signal"
                >
                  ◀
                </button>
                <input
                  type="date"
                  value={filterDate}
                  aria-label="Any day in the month"
                  onChange={(e) => {
                    if (isValidDateStr(e.target.value)) setFilterDate(e.target.value);
                  }}
                  className="rounded-lg border border-line bg-panel px-3 py-1.5 font-mono text-[11.5px] text-ink outline-none focus:border-signal/70"
                />
                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() => setFilterDate((d) => shiftMonth(d, 1))}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-panel text-ink transition-colors hover:border-signal/60 hover:text-signal"
                >
                  ▶
                </button>
              </div>
              <p className="font-mono text-[11.5px] font-semibold text-ink">
                {parseLocalDate(filterDate).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          )}

          {filterMode === "range" && (
            <div className="anim-fade flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={rangeFrom}
                aria-label="From date"
                onChange={(e) => {
                  if (isValidDateStr(e.target.value)) setRangeFrom(e.target.value);
                }}
                className="rounded-lg border border-line bg-panel px-3 py-1.5 font-mono text-[11.5px] text-ink outline-none focus:border-signal/70"
              />
              <input
                type="date"
                value={rangeTo}
                aria-label="To date"
                onChange={(e) => {
                  if (isValidDateStr(e.target.value)) setRangeTo(e.target.value);
                }}
                className="rounded-lg border border-line bg-panel px-3 py-1.5 font-mono text-[11.5px] text-ink outline-none focus:border-signal/70"
              />
            </div>
          )}
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-void/75 p-4 backdrop-blur-xs anim-fade"
          onClick={closeEditModal}
        >
          <div
            className="my-auto w-full max-w-md rounded-2xl border border-line bg-panel p-6 shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-void/75 p-4 backdrop-blur-xs anim-fade"
          onClick={() => setPendingDelete(null)}
        >
          <div
            className="my-auto w-full max-w-sm rounded-2xl border border-line bg-panel p-6 shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="label text-coral mb-2">Delete workout</div>
            <h3 id="delete-modal-title" className="text-[17px] font-bold tracking-tight">
              Delete this saved walk?
            </h3>
            <p className="mt-2 font-mono text-[12px] text-muted">
              {fmt.whole(pendingDelete.netActiveCalories)} kcal active · {fmt.whole(pendingDelete.totalCalories)} kcal total · {fmt.two(pendingDelete.distanceMi)} mi
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
    { label: "Total calories", value: `${fmt.whole(workout.totalCalories)} kcal` },
    { label: "Steps", value: fmt.whole(workout.steps) },
    { label: "Distance", value: `${fmt.two(workout.distanceMi)} mi` },
    { label: "Duration", value: `${fmt.one(workout.durationMin)} min` },
  ];

  const detail = [
    ["Active calories", `${fmt.whole(workout.netActiveCalories)} kcal`],
    ["Total calories", `${fmt.whole(workout.totalCalories)} kcal`],
    ["Resting subtracted", `${fmt.one(workout.restingCalories)} kcal`],
    ["Avg pace", `${fmt.two(workout.speedMph)} mph`],
    ["Distance", `${fmt.two(workout.distanceKm)} km`],
    ["Speed", `${fmt.two(workout.speedKmh)} km/h`],
    ["Speed (m/min)", `${workout.metersPerMin.toFixed(2)} m/min`],
    ["ACSM VO2", `${workout.vo2.toFixed(2)} mL/kg/min`],
    ["Cadence", workout.steps > 0 ? `${fmt.one(workout.cadence)} steps/min` : "-"],
    ["Stride", workout.strideLengthCm !== null ? `${fmt.one(workout.strideLengthCm)} cm` : "-"],
    ["BMR used", `${fmt.whole(workout.bmrDaily)} kcal/day`],
    ["Weight", `${fmt.one(workout.profile.weightKg)} kg`],
    ["Height", `${fmt.one(workout.profile.heightCm)} cm`],
    ["Age", `${workout.profile.age} yrs`],
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

          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <div className="flex items-baseline gap-1.5">
              <span className="tnum text-[30px] leading-none font-extrabold tracking-tighter">
                {fmt.whole(workout.netActiveCalories)}
              </span>
              <span className="font-mono text-[11.5px] text-signal">kcal active</span>
            </div>
            <div className="flex items-baseline gap-1.5 font-mono text-[12px] text-muted">
              <span>Total:</span>
              <span className="tnum font-semibold text-ink">
                {fmt.whole(workout.totalCalories)} kcal
              </span>
            </div>
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
                    k === "Active calories" && "text-signal",
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
