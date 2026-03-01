"use client";

import { useState, useCallback } from "react";

type SetInputProps = {
  exerciseId: string;
  setNumber: number;
  sessionId: string;
  defaultWeight?: number;
  defaultReps?: number;
  defaultCompleted?: boolean;
  onComplete?: () => void;
  suggestedWeight?: number;
  suggestedReps?: number;
  previousWeight?: number;
  previousReps?: number;
};

export function SetInput({
  exerciseId,
  setNumber,
  sessionId,
  defaultWeight,
  defaultReps,
  defaultCompleted = false,
  onComplete,
  suggestedWeight,
  suggestedReps,
  previousWeight,
  previousReps,
}: SetInputProps) {
  // Pre-fill with suggested values when no existing data
  const initialWeight = defaultWeight?.toString() || suggestedWeight?.toString() || "";
  const initialReps = defaultReps?.toString() || suggestedReps?.toString() || "";
  const [weight, setWeight] = useState<string>(initialWeight);
  const [reps, setReps] = useState<string>(initialReps);
  const isProgression = suggestedWeight !== undefined && previousWeight !== undefined && suggestedWeight > previousWeight;
  const [completed, setCompleted] = useState(defaultCompleted);
  const [saving, setSaving] = useState(false);

  const save = useCallback(
    async (isCompleted: boolean) => {
      setSaving(true);
      try {
        await fetch(`/api/workouts/${sessionId}/sets`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            exerciseId,
            setNumber,
            weight: weight ? parseFloat(weight) : null,
            reps: reps ? parseInt(reps) : null,
            completed: isCompleted,
          }),
        });

        if (isCompleted && !completed) {
          onComplete?.();
        }
        setCompleted(isCompleted);
      } finally {
        setSaving(false);
      }
    },
    [exerciseId, setNumber, sessionId, weight, reps, completed, onComplete]
  );

  const handleCheck = () => {
    const newCompleted = !completed;
    save(newCompleted);
  };

  const hintParts: string[] = [];
  if (previousWeight !== undefined && previousReps !== undefined) {
    hintParts.push(`Last: ${previousWeight} × ${previousReps}`);
  } else if (previousReps !== undefined) {
    hintParts.push(`Last: ${previousReps} reps`);
  }
  if (isProgression && suggestedWeight !== undefined) {
    hintParts.push(`Suggested: ${suggestedWeight} lbs ↑`);
  }
  const hint = hintParts.join("  ·  ");

  return (
    <div className={`py-1.5 ${completed ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted w-6 text-center font-medium">
          {setNumber}
        </span>
        <input
          type="number"
          placeholder="lbs"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          onBlur={() => save(completed)}
          className="w-20 px-2 py-1.5 text-sm border border-border rounded-md bg-background text-center focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <span className="text-muted text-xs">x</span>
        <input
          type="number"
          placeholder="reps"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          onBlur={() => save(completed)}
          className="w-20 px-2 py-1.5 text-sm border border-border rounded-md bg-background text-center focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          onClick={handleCheck}
          disabled={saving}
          className={`w-8 h-8 rounded-md flex items-center justify-center text-sm transition-colors ${
            completed
              ? "bg-accent text-white"
              : "border border-border text-muted hover:border-accent hover:text-accent"
          }`}
        >
          ✓
        </button>
      </div>
      {hint && !completed && (
        <div className="ml-8 mt-0.5">
          <span className="text-[10px] text-muted">{hint}</span>
        </div>
      )}
    </div>
  );
}
