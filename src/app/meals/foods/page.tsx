"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AddFoodModal } from "@/components/meals/AddFoodModal";
import type { Food } from "@/components/meals/FoodSearchCombobox";

export default function FoodsPage() {
  const [q, setQ] = useState("");
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/foods?q=${encodeURIComponent(q)}`);
    setFoods(await res.json());
    setLoading(false);
  }, [q]);

  useEffect(() => {
    const t = setTimeout(load, 150);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <Link href="/meals" className="text-xs text-muted hover:text-foreground">
            ← Meals
          </Link>
          <h1 className="text-2xl font-bold text-foreground mt-1">Food Database</h1>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="px-3 py-1.5 text-xs bg-primary text-white rounded-lg hover:opacity-90"
        >
          + New food
        </button>
      </header>

      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search foods…"
        className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:border-accent"
      />

      {loading && <div className="text-sm text-muted">Loading…</div>}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {foods.length === 0 && !loading && (
          <div className="p-6 text-center text-sm text-muted">No foods match.</div>
        )}
        <ul className="divide-y divide-border">
          {foods.map((f) => (
            <li key={f.id} className="p-3">
              <div className="flex items-baseline justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground">{f.name}</div>
                  <div className="text-xs text-muted">
                    {Math.round(f.caloriesPer100g)} kcal · {f.proteinPer100g}p · {f.carbsPer100g}c · {f.fatPer100g}f per 100g
                    {f.defaultServingLabel ? ` · ${f.defaultServingLabel}` : ""}
                  </div>
                </div>
                {f.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap shrink-0">
                    {f.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] bg-background border border-border px-1.5 py-0.5 rounded-md text-muted"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {creating && (
        <AddFoodModal
          initialName=""
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            load();
          }}
        />
      )}
    </div>
  );
}
