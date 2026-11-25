import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../utils/cn";

/* ------------------------------------------------------------- panels -- */

export function Panel({
  children,
  className,
  as: Tag = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "aside";
}) {
  return (
    <Tag
      className={cn(
        "rounded-2xl border border-line bg-panel relative overflow-hidden",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function SectionHead({
  index,
  title,
  hint,
  className,
}: {
  index?: string;
  title: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4 px-5 pt-5 pb-4 md:px-6", className)}>
      <div className="flex items-baseline gap-3 min-w-0">
        {index && <span className="label text-signal shrink-0">{index}</span>}
        <h2 className="text-[15px] md:text-base font-semibold tracking-tight truncate">{title}</h2>
      </div>
      {hint && <span className="label text-dim shrink-0 hidden sm:block">{hint}</span>}
    </div>
  );
}

/* ------------------------------------------------------------ inputs -- */

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit?: string;
  hint?: ReactNode;
  error?: string;
  placeholder?: string;
  inputMode?: "decimal" | "numeric";
  autoFocus?: boolean;
  name?: string;
}

export function Field({
  label,
  value,
  onChange,
  unit,
  hint,
  error,
  placeholder,
  inputMode = "decimal",
  autoFocus,
  name,
}: FieldProps) {
  return (
    <label className="block">
      <span className="label block mb-2">{label}</span>
      <span
        className={cn(
          "flex items-center gap-2 rounded-xl border bg-panel2 px-4 transition-colors duration-150",
          "focus-within:border-signal/70 focus-within:ring-2 focus-within:ring-signal/15",
          error ? "border-coral/70" : "border-line",
        )}
      >
        <input
          name={name}
          type="text"
          inputMode={inputMode}
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder}
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-w-0 bg-transparent py-3.5 text-[17px] font-semibold tnum text-ink outline-none placeholder:font-normal placeholder:text-dim"
        />
        {unit && (
          <span className="font-mono text-[12px] text-muted shrink-0 select-none">{unit}</span>
        )}
      </span>
      {(hint || error) && (
        <span
          className={cn(
            "mt-1.5 block font-mono text-[11px] leading-snug",
            error ? "text-coral" : "text-dim",
          )}
        >
          {error ?? hint}
        </span>
      )}
    </label>
  );
}

/* ------------------------------------------------------------ buttons -- */

type ButtonVariant = "primary" | "ghost" | "quiet" | "danger";

export function Button({
  children,
  onClick,
  variant = "primary",
  className,
  type = "button",
  disabled,
  ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  ariaLabel?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-5 min-h-[48px] text-[14px] font-semibold tracking-tight transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-signal/40 focus-visible:ring-offset-2 focus-visible:ring-offset-void disabled:opacity-45 disabled:pointer-events-none";
  const variants: Record<ButtonVariant, string> = {
    primary: "btn-primary-action active:translate-y-px",
    ghost: "border border-line text-ink hover:border-signal/60 hover:text-signal active:translate-y-px",
    quiet: "text-muted hover:text-ink",
    danger: "border border-coral/40 text-coral hover:bg-coral/10",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(base, variants[variant], className)}
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------- stats -- */

export function StatCell({
  label,
  value,
  unit,
  sub,
  className,
  accent,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  sub?: string;
  className?: string;
  accent?: boolean;
}) {
  return (
    <div className={cn("px-4 py-3.5 md:px-5 md:py-4 min-w-0", className)}>
      <div className="label mb-1.5 truncate">{label}</div>
      <div className="flex items-baseline gap-1.5 min-w-0">
        <span
          className={cn(
            "text-[19px] md:text-[21px] font-semibold tnum tracking-tight truncate",
            accent ? "text-signal" : "text-ink",
          )}
        >
          {value}
        </span>
        {unit && <span className="font-mono text-[11px] text-muted shrink-0">{unit}</span>}
      </div>
      {sub && <div className="mt-1 font-mono text-[10.5px] text-dim truncate">{sub}</div>}
    </div>
  );
}

/* ------------------------------------------------------------- motion -- */

export function useCountUp(target: number, duration = 700): number {
  const [value, setValue] = useState(0);
  const displayRef = useRef(0);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = displayRef.current;

    if (reduce || from === target) {
      displayRef.current = target;
      setValue(target);
      return;
    }

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = from + (target - from) * eased;
      displayRef.current = v;
      setValue(v);
      if (t < 1) raf = requestAnimationFrame(tick);
      else {
        displayRef.current = target;
        setValue(target);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

/* ------------------------------------------------------------- format -- */

export function formatCaloriesDisplay(kcal: number): string {
  return Math.round(kcal).toLocaleString("en-US");
}

export const fmt = {
  whole: (n: number) => Math.round(n).toLocaleString("en-US"),
  calories: (n: number) => formatCaloriesDisplay(n),
  one: (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
  two: (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
};
