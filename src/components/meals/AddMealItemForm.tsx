"use client";

import { useState } from "react";
import { FoodSearchCombobox, type Food } from "./FoodSearchCombobox";
import { AddFoodModal } from "./AddFoodModal";

type Props = {
  mealLogId: string;
  onAdded: () => void;
};

export function AddMealItemForm({ mealLogId, onAdded }: Props) {
  const [selected, setSelected] = useState<Food | null>(null);
  const [grams, setGrams] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [creating, setCreating] = useState<string | null>(null); // name being created

  const ratio = selected && grams ? Number(grams) / 100 : 0;
  const preview = selected
    ? {
        calories: Math.round(selected.caloriesPer100g * ratio),
        protein: Math.round(selected.proteinPer100g * ratio * 10) / 10,
        carbs: Math.round(selected.carbsPer100g * ratio * 10) / 10,
        fat: Math.round(selected.fatPer100g * ratio * 10) / 10,
      }
    : null;

  const save = async () => {
    if (!selected || !grams) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/meals/${mealLogId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodId: selected.id, grams: Number(grams) }),
      });
      if (!res.ok) return;
      setSelected(null);
      setGrams("");
      onAdded();
    } finally {
      setSubmitting(false);
    }
  };

  if (!selected) {
    return (
      <>
        <FoodSearchCombobox
          placeholder="+ Add food…"
          onSelect={(food) => {
            setSelected(food);
            setGrams(
              food.defaultServingGrams ? String(food.defaultServingGrams) : ""
            );
          }}
          onCreateRequest={(name) => setCreating(name)}
        />
        {creating && (
          <AddFoodModal
            initialName={creating}
            onClose={() => setCreating(null)}
            onCreated={(food) => {
              setCreating(null);
              setSelected(food);
              setGrams(
                food.defaultServingGrams ? String(food.defaultServingGrams) : ""
              );
            }}
          />
        )}
      </>
    );
  }

  return (
    <div className="bg-background border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-foreground">{selected.name}</div>
        <button
          onClick={() => {
            setSelected(null);
            setGrams("");
          }}
          className="text-xs text-muted hover:text-foreground"
        >
          Change
        </button>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          value={grams}
          onChange={(e) => setGrams(e.target.value)}
          placeholder="grams"
          className="w-24 px-3 py-2 bg-card border border-border rounded-lg text-sm"
        />
        <span className="text-xs text-muted">g</span>
        {selected.defaultServingGrams != null && (
          <button
            onClick={() => setGrams(String(selected.defaultServingGrams))}
            className="px-2 py-1 text-xs text-accent hover:underline"
          >
            {selected.defaultServingLabel ?? `${selected.defaultServingGrams}g`}
          </button>
        )}
      </div>
      {preview && Number(grams) > 0 && (
        <div className="text-xs text-muted">
          {preview.calories} kcal · {preview.protein}p · {preview.carbs}c · {preview.fat}f
        </div>
      )}
      <button
        onClick={save}
        disabled={submitting || !grams || Number(grams) <= 0}
        className="w-full px-3 py-2 bg-primary text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "Adding…" : "Add"}
      </button>
    </div>
  );
}
