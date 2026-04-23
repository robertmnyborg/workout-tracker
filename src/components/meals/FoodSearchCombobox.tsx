"use client";

import { useEffect, useRef, useState } from "react";

export type Food = {
  id: string;
  name: string;
  brand: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  defaultServingGrams: number | null;
  defaultServingLabel: string | null;
  tags: string[];
};

type Props = {
  onSelect: (food: Food) => void;
  onCreateRequest: (name: string) => void;
  placeholder?: string;
};

export function FoodSearchCombobox({ onSelect, onCreateRequest, placeholder }: Props) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const ctl = new AbortController();
    setLoading(true);
    fetch(`/api/foods?q=${encodeURIComponent(q)}`, { signal: ctl.signal })
      .then((r) => r.json())
      .then((data) => setResults(data as Food[]))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => ctl.abort();
  }, [q]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <input
        type="text"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder ?? "Search foods…"}
        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
      />
      {open && (q.trim().length > 0 || results.length > 0) && (
        <div className="absolute z-10 left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-64 overflow-auto">
          {loading && (
            <div className="px-3 py-2 text-xs text-muted">Searching…</div>
          )}
          {!loading &&
            results.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  onSelect(f);
                  setQ("");
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-background border-b border-border last:border-b-0"
              >
                <div className="text-sm text-foreground">{f.name}</div>
                <div className="text-xs text-muted">
                  {Math.round(f.caloriesPer100g)} kcal · {f.proteinPer100g}p/{f.carbsPer100g}c/{f.fatPer100g}f per 100g
                  {f.defaultServingLabel ? ` · ${f.defaultServingLabel}` : ""}
                </div>
              </button>
            ))}
          {!loading && q.trim().length > 0 && results.length === 0 && (
            <button
              type="button"
              onClick={() => {
                onCreateRequest(q.trim());
                setQ("");
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-background text-sm text-accent"
            >
              + Create new food &ldquo;{q.trim()}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
