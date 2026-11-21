import { CalendarDays, Ruler, Scale, UserRound } from "lucide-react";
import { calculateAge, DATE_OF_BIRTH } from "../lib/calc";
import type { Profile } from "../lib/types";
import { fmt, Panel, SectionHead } from "./ui";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function prettyDob(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function ProfileSummary({ profile }: { profile: Profile }) {
  const age = calculateAge(profile.dateOfBirth);

  return (
    <Panel className="anim-rise">
      <div className="relative">
        {/* Material band */}
        <div className="relative h-32 sm:h-40 md:h-44 overflow-hidden grain">
          <img
            src="images/plate.jpg"
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover object-center opacity-70"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-panel via-panel/55 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-panel/85 via-transparent to-panel/40" />
          <div className="absolute left-5 top-4 md:left-6 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-signal" aria-hidden />
            <span className="label text-ink/80">Athlete record · fixed</span>
          </div>
        </div>

        <div className="px-5 pb-6 md:px-6 -mt-9 relative">
          <div className="flex items-end gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-line bg-panel2 text-signal">
              <UserRound size={26} strokeWidth={1.8} />
            </div>
            <div className="pb-1 min-w-0">
              <div className="label mb-1">Calculated age</div>
              <div className="flex items-baseline gap-2">
                <span className="text-[46px] leading-none font-extrabold tracking-tighter tnum">
                  {age}
                </span>
                <span className="font-mono text-[13px] text-muted">years</span>
              </div>
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line">
            <Row icon={<CalendarDays size={14} />} label="Date of birth" value={prettyDob(profile.dateOfBirth)} sub="Locked" />
            <Row icon={<UserRound size={14} />} label="Gender" value="Male" sub="Locked" />
            <Row icon={<Scale size={14} />} label="Weight" value={`${fmt.one(profile.weightKg)} kg`} sub="Editable in settings" />
            <Row icon={<Ruler size={14} />} label="Height" value={`${fmt.one(profile.heightCm)} cm`} sub="Editable in settings" />
          </dl>

          <p className="mt-4 font-mono text-[11px] leading-relaxed text-dim">
            Age derives from {prettyDob(DATE_OF_BIRTH)} against the system date — it advances every
            8 December, automatically.
          </p>
        </div>
      </div>
    </Panel>
  );
}

function Row({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="bg-panel px-4 py-3.5">
      <dt className="label flex items-center gap-1.5 mb-1.5">
        <span className="text-dim">{icon}</span>
        <span className="truncate">{label}</span>
      </dt>
      <dd className="text-[15.5px] font-semibold tracking-tight tnum truncate">{value}</dd>
      <dd className="mt-0.5 font-mono text-[10px] text-dim truncate">{sub}</dd>
    </div>
  );
}

export { SectionHead };
