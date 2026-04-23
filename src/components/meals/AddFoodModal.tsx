"use client";

import { useState } from "react";
import { AVAILABLE_TAGS } from "@/lib/meal-constants";
import type { Food } from "./FoodSearchCombobox";

type Props = {
  initialName: string;
  onClose: () => void;
  onCreated: (food: Food) => void;
};

export function AddFoodModal({ initialName, onClose, onCreated }: Props) {
  const [name, setName] = useState(initialName);
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [servingGrams, setServingGrams] = useState("");
  const [servingLabel, setServingLabel] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleTag = (t: string) => {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const submit = async () => {
    setError(null);
    if (!name.trim() || !calories || !protein || !carbs || !fat) {
      setError("Name + all macros required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/foods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          caloriesPer100g: Number(calories),
          proteinPer100g: Number(protein),
          carbsPer100g: Number(carbs),
          fatPer100g: Number(fat),
          defaultServingGrams: servingGrams ? Number(servingGrams) : null,
          defaultServingLabel: servingLabel.trim() || null,
          tags,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create food");
        return;
      }
      onCreated(data as Food);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-auto">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Add Custom Food</h3>
          <button onClick={onClose} className="text-muted hover:text-foreground text-xl leading-none">
            ×
          </button>
        </div>
        <div className="p-4 space-y-3">
          <Field label="Name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
            />
          </Field>
          <div className="text-xs text-muted -mt-1">All values are per 100 grams.</div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Calories">
              <NumberInput value={calories} onChange={setCalories} />
            </Field>
            <Field label="Protein (g)">
              <NumberInput value={protein} onChange={setProtein} />
            </Field>
            <Field label="Carbs (g)">
              <NumberInput value={carbs} onChange={setCarbs} />
            </Field>
            <Field label="Fat (g)">
              <NumberInput value={fat} onChange={setFat} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Serving size (g)">
              <NumberInput value={servingGrams} onChange={setServingGrams} />
            </Field>
            <Field label="Serving label">
              <input
                type="text"
                placeholder="e.g., 1 cup"
                value={servingLabel}
                onChange={(e) => setServingLabel(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
              />
            </Field>
          </div>
          <Field label="Tags (for weekly tracking)">
            <div className="flex flex-wrap gap-1">
              {AVAILABLE_TAGS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTag(t)}
                  className={`px-2 py-1 rounded-md text-xs transition-colors ${
                    tags.includes(t)
                      ? "bg-primary text-white"
                      : "bg-background text-muted hover:text-foreground border border-border"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </Field>
          {error && <div className="text-sm text-red-500">{error}</div>}
        </div>
        <div className="p-4 border-t border-border flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-muted hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save Food"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-muted uppercase tracking-wide mb-1">
        {label}
      </div>
      {children}
    </label>
  );
}

function NumberInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="number"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
    />
  );
}
