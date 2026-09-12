"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const THEMES = [
  { value: "light", label: "روشن", icon: Sun },
  { value: "dark", label: "تیره", icon: Moon },
  { value: "system", label: "خودکار", icon: Laptop },
] as const;

const subscribe = () => () => undefined;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  if (!mounted) {
    return <div className="h-11 w-[112px] rounded-2xl bg-[var(--nv-soft)]" aria-hidden />;
  }

  return (
    <div className="flex h-11 items-center gap-1 rounded-2xl border border-[var(--nv-border)] bg-[var(--nv-panel)] p-1 shadow-sm" aria-label="انتخاب پوسته">
      {THEMES.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button key={value} type="button" title={`پوسته ${label}`} aria-label={`پوسته ${label}`} aria-pressed={active} onClick={() => setTheme(value)} className={`grid h-8 w-8 place-items-center rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${active ? "bg-cyan-500 text-white shadow-sm" : "text-[var(--nv-muted)] hover:bg-[var(--nv-soft)] hover:text-[var(--nv-text)]"}`}>
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
