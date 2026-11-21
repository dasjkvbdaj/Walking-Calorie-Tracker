import { Footprints, UserRound } from "lucide-react";
import { cn } from "../utils/cn";

export type Page = "profile" | "calculator";

const ITEMS: Array<{ id: Page; label: string; short: string; Icon: typeof UserRound }> = [
  { id: "profile", label: "Profile & Settings", short: "Profile", Icon: UserRound },
  { id: "calculator", label: "Walk Calculator", short: "Calculator", Icon: Footprints },
];

export function Navigation({
  page,
  onChange,
}: {
  page: Page;
  onChange: (p: Page) => void;
}) {
  return (
    <>
      {/* Desktop / tablet top bar */}
      <header className="sticky top-0 z-40 hidden md:block border-b border-line bg-void/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 lg:px-8 h-16">
          <div className="flex items-center gap-2.5 select-none">
            <span className="h-3 w-3 rounded-[3px] bg-signal" aria-hidden />
            <span className="text-[15px] font-extrabold tracking-[0.2em]">CADENCE</span>
            <span className="hidden lg:inline label pt-0.5 pl-2 border-l border-line">
              Net active calorie ledger
            </span>
          </div>
          <nav className="flex items-center gap-1" aria-label="Main">
            {ITEMS.map(({ id, label, short, Icon }) => {
              const active = page === id;
              return (
                <button
                  key={id}
                  onClick={() => onChange(id)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-2 rounded-lg px-4 py-2.5 text-[13.5px] font-semibold transition-colors duration-150",
                    active ? "text-signal" : "text-muted hover:text-ink",
                  )}
                >
                  <Icon size={15} strokeWidth={2.2} />
                  <span className="hidden lg:inline">{label}</span>
                  <span className="lg:hidden">{short}</span>
                  <span
                    className={cn(
                      "absolute inset-x-3 -bottom-[1px] h-[2px] rounded-full bg-signal transition-transform duration-200 origin-center",
                      active ? "scale-x-100" : "scale-x-0",
                    )}
                    aria-hidden
                  />
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile bottom bar */}
      <nav
        className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-line bg-void/95 backdrop-blur-md"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Main"
      >
        <div className="grid grid-cols-2">
          {ITEMS.map(({ id, label, short, Icon }) => {
            const active = page === id;
            return (
              <button
                key={id}
                onClick={() => onChange(id)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 py-3 min-h-[56px] transition-colors duration-150",
                  active ? "text-signal" : "text-muted",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0 h-[2px] w-10 rounded-full bg-signal transition-transform duration-200",
                    active ? "scale-x-100" : "scale-x-0",
                  )}
                  aria-hidden
                />
                <Icon size={19} strokeWidth={2.2} />
                <span className="font-mono text-[10px] tracking-[0.14em] uppercase">{short}</span>
                <span className="sr-only">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
