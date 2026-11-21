import { Footprints, History, Moon, Sun, UserRound } from "lucide-react";
import type { ThemeMode } from "../lib/storage";
import { cn } from "../utils/cn";

export type Page = "profile" | "calculator" | "history";

const ITEMS: Array<{ id: Page; label: string; short: string; Icon: typeof UserRound }> = [
  { id: "profile", label: "Profile & Settings", short: "Profile", Icon: UserRound },
  { id: "calculator", label: "Walk Calculator", short: "Calculator", Icon: Footprints },
  { id: "history", label: "History", short: "History", Icon: History },
];

export function Navigation({
  page,
  onChange,
  theme,
  onToggleTheme,
}: {
  page: Page;
  onChange: (p: Page) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}) {
  return (
    <>
      {/* Desktop / tablet top bar */}
      <header className="sticky top-0 z-40 hidden md:block border-b border-line bg-void/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 lg:px-8 h-16">
          <div className="flex items-center gap-2.5 select-none">
            <span className="h-3 w-3 rounded-[3px] bg-signal" aria-hidden />
            <span className="text-[15px] font-extrabold tracking-[0.2em]">CADENCE</span>
          </div>
          <div className="flex items-center gap-3">
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

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="flex items-center gap-1.5 rounded-lg border border-line bg-panel px-3 py-2 font-mono text-[11px] text-ink transition-colors hover:border-signal/60 hover:text-signal"
            >
              {theme === "dark" ? <Sun size={14} strokeWidth={2.2} /> : <Moon size={14} strokeWidth={2.2} />}
              <span>{theme === "dark" ? "Light" : "Dark"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile top theme bar */}
      <div className="md:hidden flex items-center justify-between border-b border-line bg-panel px-4 py-2.5">
        <div className="flex items-center gap-2 select-none">
          <span className="h-2.5 w-2.5 rounded-[2px] bg-signal" aria-hidden />
          <span className="text-[13px] font-extrabold tracking-[0.18em]">CADENCE</span>
        </div>
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="flex items-center gap-1.5 rounded-lg border border-line bg-panel2 px-2.5 py-1.5 font-mono text-[10.5px] text-ink"
        >
          {theme === "dark" ? <Sun size={13} strokeWidth={2.2} /> : <Moon size={13} strokeWidth={2.2} />}
          <span>{theme === "dark" ? "Light" : "Dark"}</span>
        </button>
      </div>

      {/* Mobile bottom bar */}
      <nav
        className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-line bg-void/95 backdrop-blur-md"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Main"
      >
        <div className="grid grid-cols-3">
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
