import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
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
    onChange({ steps: "", distanceMi: "", durationMin: "", speedMph: "" });
    setAttempted(false);
  }

  const speedIsManual = inputs.speedMph.trim() !== "";

  return (
    <Panel className="anim-rise" as="div">
      <SectionHead index="01" title="Walk inputs" />

      <div className="px-5 pb-6 md:px-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Steps walked"
            name="steps"
            value={inputs.steps}
            onChange={set("steps")}
            unit="steps"
            inputMode="numeric"
            placeholder="0"
            error={errors.steps}
          />
          <Field
            label="Distance"
            name="distance"
            value={inputs.distanceMi}
            onChange={set("distanceMi")}
            unit="mi"
            placeholder="0.00"
            error={errors.distanceMi}
            hint={
              distanceKm !== null && !errors.distanceMi
                ? `${fmt.two(distanceKm)} km`
                : undefined
            }
          />
          <Field
            label="Duration"
            name="duration"
            value={inputs.durationMin}
            onChange={set("durationMin")}
            unit="min"
            inputMode="numeric"
            placeholder="0"
            error={errors.durationMin}
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
                !speedIsManual && autoSpeedMph !== null && Number.isFinite(autoSpeedMph)
                  ? `${fmt.two(autoSpeedMph)} mph · ${fmt.two(autoSpeedMph * 1.60934)} km/h`
                  : undefined
              }
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleCalculate} className="w-full sm:w-auto sm:min-w-[220px]">
            <Calculator size={16} strokeWidth={2.4} />
            Calculate net calories
          </Button>
        </div>

        {attempted && Object.values(errors).some(Boolean) && (
          <p role="alert" className="anim-fade font-mono text-[11.5px] text-coral">
            Fix the highlighted fields.
          </p>
        )}
      </div>
    </Panel>
  );
}
