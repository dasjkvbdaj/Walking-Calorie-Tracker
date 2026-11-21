import { useEffect, useState } from "react";
import { Check, RefreshCw } from "lucide-react";
import type { Profile } from "../lib/types";
import { Button, Field, Panel, SectionHead } from "./ui";

type Errors = { weightKg?: string; heightCm?: string };

function validate(
  weight: string,
  height: string,
  profile: Profile,
): { values: Profile | null; errors: Errors } {
  const errors: Errors = {};
  const w = Number(weight.trim());
  const h = Number(height.trim());

  if (weight.trim() === "") errors.weightKg = "Weight is required";
  else if (!Number.isFinite(w)) errors.weightKg = "Enter a number";
  else if (w < 30) errors.weightKg = "Minimum 30 kg";
  else if (w > 300) errors.weightKg = "Maximum 300 kg";

  if (height.trim() === "") errors.heightCm = "Height is required";
  else if (!Number.isFinite(h)) errors.heightCm = "Enter a number";
  else if (h < 80) errors.heightCm = "Minimum 80 cm";
  else if (h > 260) errors.heightCm = "Maximum 260 cm";

  if (Object.keys(errors).length > 0) return { values: null, errors };

  const round1 = (n: number) => Math.round(n * 10) / 10;
  return {
    values: { ...profile, weightKg: round1(w), heightCm: round1(h) },
    errors: {},
  };
}

export function ProfileSettings({
  profile,
  onSave,
}: {
  profile: Profile;
  onSave: (p: Profile) => void;
}) {
  const [weight, setWeight] = useState(String(profile.weightKg));
  const [height, setHeight] = useState(String(profile.heightCm));
  const [errors, setErrors] = useState<Errors>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setWeight(String(profile.weightKg));
    setHeight(String(profile.heightCm));
  }, [profile.weightKg, profile.heightCm]);

  const dirty =
    Number(weight) !== profile.weightKg || Number(height) !== profile.heightCm;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { values, errors: errs } = validate(weight, height, profile);
    setErrors(errs);
    if (!values) {
      setSaved(false);
      return;
    }
    onSave(values);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2600);
  }

  function handleReset() {
    setWeight(String(profile.weightKg));
    setHeight(String(profile.heightCm));
    setErrors({});
    setSaved(false);
  }

  return (
    <Panel className="anim-rise" as="div">
      <SectionHead index="02" title="Physical measurements" />
      <form onSubmit={handleSubmit} className="px-5 pb-6 md:px-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Weight"
            name="weight"
            value={weight}
            onChange={(v) => {
              setWeight(v);
              setSaved(false);
              if (errors.weightKg) setErrors((e) => ({ ...e, weightKg: undefined }));
            }}
            unit="kg"
            placeholder="113.2"
            error={errors.weightKg}
          />
          <Field
            label="Height"
            name="height"
            value={height}
            onChange={(v) => {
              setHeight(v);
              setSaved(false);
              if (errors.heightCm) setErrors((e) => ({ ...e, heightCm: undefined }));
            }}
            unit="cm"
            placeholder="177"
            error={errors.heightCm}
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3">
          <Button type="submit" className="w-full sm:w-auto">
            <Check size={16} strokeWidth={2.6} />
            {saved ? "Saved" : "Update profile"}
          </Button>
          <Button variant="ghost" onClick={handleReset} className="w-full sm:w-auto">
            <RefreshCw size={15} strokeWidth={2.2} />
            Reset fields
          </Button>
          <div className="sm:ml-auto min-h-[20px]" role="status" aria-live="polite">
            {!saved && dirty && (
              <span className="font-mono text-[11.5px] text-muted">Unsaved changes</span>
            )}
          </div>
        </div>
      </form>
    </Panel>
  );
}
