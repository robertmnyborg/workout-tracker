"use client";

import { useTheme, type Theme } from "@/lib/theme-context";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div role="radiogroup" aria-label="Color theme" className="flex border border-border rounded text-xs">
      {(["light", "dark"] as Theme[]).map((t) => (
        <button
          key={t}
          role="radio"
          aria-checked={theme === t}
          onClick={() => setTheme(t)}
          className={`px-2 py-1 capitalize ${theme === t ? "bg-primary text-on-primary" : "text-muted hover:text-heading"}`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
