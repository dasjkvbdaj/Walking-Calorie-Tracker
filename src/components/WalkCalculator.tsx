import { useMemo, useState } from "react";
import { Calculator, RotateCcw, Wand2 } from "lucide-react";
import {
  calculateSpeedMph,
  milesToKm,
  parseCalcInputs,
  type CalcFieldErrors,
} from "../lib/calc";
import type { CalcInputs, CalcNumbers } from "../lib/types";
import { Button, Field, fmt, Panel, SectionHead } from "./ui";

export function WalkCalculator({
  inputs,
  onChange,
  onCalculate,
}: {
  inputs: CalcInputs;
  onChange: (next: CalcInputs) => void;
  onCalculate: (values: CalcNumbers) => void;
}) {
  const [errors, setErrors] = useState<CalcFieldErrors>({});
  const [attempted, setAttempted] = useState(false);

  const autoSpeedMph = useMemo(() => {
    const d = Number(inputs.distanceMi);
    const t = Number(inputs.durationMin);
    if (!Number.isFinite(d) || !Number.isFinite(t)) return null;
    return calculateSpeedMph(d, t);
  }, [inputs.distanceMi, inputs.durationMin]);

  const distanceKm = useMemo(() => {
    const d = Number(inputs.distanceMi);
    return Number.isFinite(d) && d > 0 ? milesToKm(d) : null;
  }, [inputs.distanceMi]);

  const set = (key: keyof CalcInputs) => (v: string) => {
    onChange({ ...inputs, [key]: v });
    if (attempted) {
      const next = { ...inputs, [key]: v };
      setErrors(parseCalcInputs(next).errors);
    } else if (errors[key]) {
      setErrors((e) => ({ ...e, [key]: undefined }));
    }
  };

  function handleCalculate() {
    setAttempted(true);
    const { values, errors: errs } = parseCalcInputs(inputs);
    setErrors(errs);
    if (!values) return;
    onCalculate(values);
  }

  function handleReset() {
    onChange({ steps: "5584", distanceMi: "2.38", durationMin: "50", speedMph: "" });
    setErrors({});
    setAttempted(false);
  }

  const speedIsManual = inputs.speedMph.trim() !== "";

  return (
    <Panel className="anim-rise" as="div">
      <SectionHead index="01" title="Walk inputs" hint="Auto-saved locally" />

      <div className="px-5 pb-6 md:px-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Steps walked"
            name="steps"
            value={inputs.steps}
            onChange={set("steps")}
            unit="steps"
            inputMode="numeric"
            placeholder="5584"
            error={errors.steps}
            hint="Used for cadence & stride length"
          />
          <Field
            label="Distance"
            name="distance"
            value={inputs.distanceMi}
            onChange={set("distanceMi")}
            unit="mi"
            placeholder="2.38"
            error={errors.distanceMi}
            hint={
              distanceKm !== null && !errors.distanceMi
                ? `= ${fmt.two(distanceKm)} km  (mi × 1.60934)`
                : "Required · miles"
            }
          />
          <Field
            label="Duration"
            name="duration"
            value={inputs.durationMin}
            onChange={set("durationMin")}
            unit="min"
            inputMode="numeric"
            placeholder="50"
            error={errors.durationMin}
            hint="Must be greater than 0"
          />
          <div>
            <Field
              label="Average speed"
              name="speed"
              value={inputs.speedMph}
              onChange={set("speedMph")}
              unit="mph"
              placeholder="auto"
              error={errors.speedMph}
              hint={
                speedIsManual
                  ? "Manual entry — used for MET"
                  : autoSpeedMph !== null && Number.isFinite(autoSpeedMph)
                    ? `Auto: ${fmt.two(autoSpeedMph)} mph = ${fmt.two(autoSpeedMph * 1.60934)} km/h`
                    : "Leave blank to derive from distance ÷ duration"
              }
            />
            {speedIsManual && !errors.speedMph && (
              <button
                type="button"
                onClick={() => set("speedMph")("")}
                className="mt-1.5 inline-flex items-center gap-1.5 font-mono text-[11px] text-signal hover:underline"
              >
                <Wand2 size={12} strokeWidth={2.4} /> switch back to automatic
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleCalculate} className="w-full sm:w-auto sm:min-w-[220px]">
            <Calculator size={16} strokeWidth={2.4} />
            Calculate net calories
          </Button>
          <Button variant="ghost" onClick={handleReset} className="w-full sm:w-auto">
            <RotateCcw size={15} strokeWidth={2.2} />
            Load example walk
          </Button>
        </div>

        {attempted && Object.values(errors).some(Boolean) && (
          <p role="alert" className="anim-fade font-mono text-[11.5px] text-coral">
            Fix the highlighted fields — negative distance, duration and invalid values are blocked.
          </p>
        )}
      </div>
    </Panel>
  );
}
