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

interface ThemeToggleProps {
  compact?: boolean;
}

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  if (!mounted) {
    return (
      <div
        className={compact ? "h-10 w-10 rounded-xl bg-[var(--nv-soft)]" : "h-11 w-[112px] rounded-2xl bg-[var(--nv-soft)]"}
        aria-hidden
      />
    );
  }

  if (compact) {
    const isDark = resolvedTheme === "dark";
    const Icon = isDark ? Sun : Moon;

    return (
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="nv-icon-button h-10 w-10"
        aria-label={isDark ? "فعال‌کردن پوسته روشن" : "فعال‌کردن پوسته تیره"}
        title={isDark ? "پوسته روشن" : "پوسته تیره"}
      >
        <Icon className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="nv-toolbar flex h-11 items-center gap-1 rounded-xl p-1" aria-label="انتخاب پوسته">
      {THEMES.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button key={value} type="button" title={`پوسته ${label}`} aria-label={`پوسته ${label}`} aria-pressed={active} onClick={() => setTheme(value)} className={`grid h-8 w-8 place-items-center rounded-lg border transition focus-visible:outline-none ${active ? "border-[var(--nv-accent-border)] bg-[var(--nv-accent-soft)] text-[var(--nv-accent)]" : "border-transparent text-[var(--nv-muted)] hover:bg-[var(--nv-panel)] hover:text-[var(--nv-text)]"}`}>
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
