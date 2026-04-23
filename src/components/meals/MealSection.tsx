"use client";

import { useState } from "react";
import { AddMealItemForm } from "./AddMealItemForm";
import { MEAL_TYPE_LABELS } from "@/lib/meal-constants";

export type MealLogItem = {
  id: string;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  food: {
    id: string;
    name: string;
    defaultServingLabel: string | null;
    defaultServingGrams: number | null;
  };
};

export type MealLog = {
  id: string;
  mealType: string;
  title: string | null;
  items: MealLogItem[];
};

type Props = {
  mealType: string;
  profileId: string;
  date: string; // YYYY-MM-DD
  log: MealLog | null; // existing meal log for this type/day, or null
  suggestions?: { title: string; items: { name: string; grams: number; notes?: string }[] }[];
  onMutate: () => void;
};

export function MealSection({ mealType, profileId, date, log, onMutate, suggestions }: Props) {
  const [adding, setAdding] = useState(false);
  const [currentLogId, setCurrentLogId] = useState<string | null>(log?.id ?? null);

  const subtotal = log?.items.reduce(
    (acc, it) => ({
      calories: acc.calories + it.calories,
      protein: acc.protein + it.protein,
      carbs: acc.carbs + it.carbs,
      fat: acc.fat + it.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  ) ?? { calories: 0, protein: 0, carbs: 0, fat: 0 };

  const ensureLog = async () => {
    if (currentLogId) return currentLogId;
    const res = await fetch("/api/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, date, mealType }),
    });
    const data = await res.json();
    setCurrentLogId(data.id);
    return data.id as string;
  };

  const handleDelete = async (itemId: string) => {
    await fetch(`/api/meals/items/${itemId}`, { method: "DELETE" });
    onMutate();
  };

  const handleAdd = async () => {
    await ensureLog();
    setAdding(true);
  };

  return (
    <section className="bg-card border border-border rounded-xl overflow-hidden">
      <header className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-foreground">
            {MEAL_TYPE_LABELS[mealType] ?? mealType}
          </div>
          {log?.title && (
            <div className="text-xs text-muted">{log.title}</div>
          )}
        </div>
        {log && log.items.length > 0 && (
          <div className="text-xs text-muted">
            {Math.round(subtotal.calories)} kcal · {Math.round(subtotal.protein)}p
          </div>
        )}
      </header>

      {log && log.items.length > 0 && (
        <ul className="divide-y divide-border">
          {log.items.map((it) => (
            <li key={it.id} className="px-4 py-2 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm text-foreground truncate">{it.food.name}</div>
                <div className="text-xs text-muted">
                  {it.grams}g · {Math.round(it.calories)} kcal · {it.protein}p {it.carbs}c {it.fat}f
                </div>
              </div>
              <button
                onClick={() => handleDelete(it.id)}
                className="text-xs text-muted hover:text-red-500 shrink-0"
                aria-label="Delete"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {suggestions && suggestions.length > 0 && !adding && (!log || log.items.length === 0) && (
        <div className="px-4 py-3 border-t border-border bg-background/50">
          <div className="text-xs uppercase text-muted mb-2">From your plan</div>
          <div className="space-y-1">
            {suggestions.map((s, idx) => (
              <div key={idx} className="text-xs text-muted">
                <span className="text-foreground">{s.title}:</span>{" "}
                {s.items.map((i) => `${i.name} (${i.grams}g)`).join(", ")}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 py-3 border-t border-border">
        {adding ? (
          <AddMealItemForm
            mealLogId={currentLogId!}
            onAdded={() => {
              setAdding(false);
              onMutate();
            }}
          />
        ) : (
          <button
            onClick={handleAdd}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-muted hover:text-foreground hover:border-accent transition-colors"
          >
            + Add food
          </button>
        )}
      </div>
    </section>
  );
}
