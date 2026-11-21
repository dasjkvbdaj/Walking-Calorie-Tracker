import { CalendarDays, Ruler, Scale, UserRound } from "lucide-react";
import { calculateAge } from "../lib/calc";
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
        </div>

        <div className="px-5 pb-6 md:px-6 -mt-9 relative">
          <div className="flex items-end gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-line bg-panel2 text-signal">
              <UserRound size={26} strokeWidth={1.8} />
            </div>
            <div className="pb-1 min-w-0">
              <div className="label mb-1">Age</div>
              <div className="flex items-baseline gap-2">
                <span className="text-[46px] leading-none font-extrabold tracking-tighter tnum">
                  {age}
                </span>
                <span className="font-mono text-[13px] text-muted">years</span>
              </div>
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line">
            <Row icon={<CalendarDays size={14} />} label="Date of birth" value={prettyDob(profile.dateOfBirth)} />
            <Row icon={<UserRound size={14} />} label="Gender" value="Male" />
            <Row icon={<Scale size={14} />} label="Weight" value={`${fmt.one(profile.weightKg)} kg`} />
            <Row icon={<Ruler size={14} />} label="Height" value={`${fmt.one(profile.heightCm)} cm`} />
          </dl>
        </div>
      </div>
    </Panel>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-panel px-4 py-3.5">
      <dt className="label flex items-center gap-1.5 mb-1.5">
        <span className="text-dim">{icon}</span>
        <span className="truncate">{label}</span>
      </dt>
      <dd className="text-[15.5px] font-semibold tracking-tight tnum truncate">{value}</dd>
    </div>
  );
}

export { SectionHead };
