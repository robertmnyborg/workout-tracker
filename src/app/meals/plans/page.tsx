"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useProfile } from "@/lib/profile-context";
import { MEAL_TYPE_LABELS, MEAL_TYPE_ORDER } from "@/lib/meal-constants";

type PlanItem = {
  id: string;
  gramsMale: number;
  gramsFemale: number;
  notes: string | null;
  food: {
    name: string;
    caloriesPer100g: number;
    proteinPer100g: number;
    carbsPer100g: number;
    fatPer100g: number;
  };
};

type PlanMeal = {
  id: string;
  mealType: string;
  title: string;
  description: string | null;
  variant: number;
  frequency: string | null;
  items: PlanItem[];
};

type MealPlan = {
  id: string;
  name: string;
  isActive: boolean;
  meals: PlanMeal[];
};

export default function PlansPage() {
  const { activeProfile } = useProfile();
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!activeProfile) return;
    setLoading(true);
    const res = await fetch(`/api/meal-plans?profileId=${activeProfile.id}`);
    setPlans(await res.json());
    setLoading(false);
  }, [activeProfile]);

  useEffect(() => {
    load();
  }, [load]);

  const activate = async (id: string) => {
    await fetch(`/api/meal-plans/${id}/activate`, { method: "POST" });
    load();
  };

  const reset = async () => {
    if (!activeProfile) return;
    if (!confirm("Reset plans to default Western + Asian templates? Your meal logs are not affected.")) return;
    await fetch(`/api/meal-plans/reset?profileId=${activeProfile.id}`, { method: "POST" });
    load();
  };

  if (!activeProfile) return <div className="text-muted">Select a profile.</div>;

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <Link href="/meals" className="text-xs text-muted hover:text-foreground">
            ← Meals
          </Link>
          <h1 className="text-2xl font-bold text-foreground mt-1">Meal Plans</h1>
        </div>
        <button
          onClick={reset}
          className="px-3 py-1.5 text-xs text-muted hover:text-foreground border border-border rounded-lg"
        >
          Reset to defaults
        </button>
      </header>

      {loading && <div className="text-sm text-muted">Loading…</div>}

      {plans.length === 0 && !loading && (
        <div className="bg-card border border-border rounded-xl p-6 text-center text-sm text-muted">
          No plans yet. Click &ldquo;Reset to defaults&rdquo; to seed Western + Asian templates.
        </div>
      )}

      <div className="space-y-6">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} onActivate={() => activate(plan.id)} />
        ))}
      </div>
    </div>
  );
}

function PlanCard({ plan, onActivate }: { plan: MealPlan; onActivate: () => void }) {
  const sortedMeals = [...plan.meals].sort((a, b) => {
    const ta = MEAL_TYPE_ORDER[a.mealType] ?? 99;
    const tb = MEAL_TYPE_ORDER[b.mealType] ?? 99;
    if (ta !== tb) return ta - tb;
    return a.variant - b.variant;
  });

  // Group by mealType
  const grouped = new Map<string, PlanMeal[]>();
  for (const m of sortedMeals) {
    const arr = grouped.get(m.mealType) ?? [];
    arr.push(m);
    grouped.set(m.mealType, arr);
  }

  return (
    <section className="bg-card border border-border rounded-xl overflow-hidden">
      <header className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">{plan.name}</h2>
          {plan.isActive && (
            <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">active</span>
          )}
        </div>
        {!plan.isActive && (
          <button
            onClick={onActivate}
            className="px-3 py-1.5 text-xs bg-primary text-white rounded-lg hover:opacity-90"
          >
            Make active
          </button>
        )}
      </header>

      <div className="divide-y divide-border">
        {Array.from(grouped.entries()).map(([mealType, variants]) => (
          <div key={mealType} className="p-4">
            <h3 className="text-xs uppercase tracking-wide text-muted mb-2">
              {MEAL_TYPE_LABELS[mealType] ?? mealType}
            </h3>
            <div className="space-y-3">
              {variants.map((v) => (
                <VariantCard key={v.id} meal={v} showVariantLabel={variants.length > 1} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function VariantCard({ meal, showVariantLabel }: { meal: PlanMeal; showVariantLabel: boolean }) {
  // Compute approximate macros per serving (male + female)
  const calcs = meal.items.map((it) => {
    const mRatio = it.gramsMale / 100;
    const fRatio = it.gramsFemale / 100;
    return {
      male: {
        cal: it.food.caloriesPer100g * mRatio,
        p: it.food.proteinPer100g * mRatio,
      },
      female: {
        cal: it.food.caloriesPer100g * fRatio,
        p: it.food.proteinPer100g * fRatio,
      },
    };
  });
  const totM = calcs.reduce((a, c) => ({ cal: a.cal + c.male.cal, p: a.p + c.male.p }), { cal: 0, p: 0 });
  const totF = calcs.reduce((a, c) => ({ cal: a.cal + c.female.cal, p: a.p + c.female.p }), { cal: 0, p: 0 });

  return (
    <div className="border border-border rounded-lg p-3 bg-background/40">
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <div>
          <div className="text-sm font-semibold text-foreground">
            {showVariantLabel && `Option ${meal.variant}: `}
            {meal.title}
          </div>
          {meal.frequency && (
            <div className="text-xs text-muted">{meal.frequency}</div>
          )}
        </div>
      </div>
      {meal.description && (
        <p className="text-xs text-muted mb-2">{meal.description}</p>
      )}
      <ul className="space-y-0.5 text-xs">
        {meal.items.map((it) => (
          <li key={it.id} className="flex items-baseline justify-between gap-2">
            <span className="text-foreground truncate">{it.food.name}</span>
            <span className="text-muted shrink-0">
              M {it.gramsMale}g · F {it.gramsFemale}g
              {it.notes ? ` · ${it.notes}` : ""}
            </span>
          </li>
        ))}
      </ul>
      <div className="text-xs text-muted mt-2 pt-2 border-t border-border/50">
        M: ~{Math.round(totM.cal)} kcal / {Math.round(totM.p)}p
        <span className="mx-2">·</span>
        F: ~{Math.round(totF.cal)} kcal / {Math.round(totF.p)}p
      </div>
    </div>
  );
}
