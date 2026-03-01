"use client";

import { useState } from "react";
import { SetInput } from "./SetInput";
import { RestTimer } from "./RestTimer";

type Exercise = {
  id: string;
  name: string;
  description: string | null;
  sets: number;
  reps: string;
};

type SetLogData = {
  exerciseId: string;
  setNumber: number;
  weight: number | null;
  reps: number | null;
  completed: boolean;
};

export function ExerciseCard({
  exercise,
  sessionId,
  restSeconds,
  existingLogs,
}: {
  exercise: Exercise;
  sessionId: string;
  restSeconds: number | null;
  existingLogs: SetLogData[];
}) {
  const [showTimer, setShowTimer] = useState(false);
  const [completedSets, setCompletedSets] = useState(
    () => existingLogs.filter((l) => l.completed).length
  );
  const [expanded, setExpanded] = useState(true);

  const allDone = completedSets >= exercise.sets;

  const handleSetComplete = () => {
    const newCount = completedSets + 1;
    setCompletedSets(newCount);
    if (restSeconds && newCount < exercise.sets) {
      setShowTimer(true);
    }
  };

  return (
    <div
      className={`border rounded-lg p-4 transition-colors ${
        allDone
          ? "border-accent/30 bg-accent/5"
          : "border-border bg-card"
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start justify-between text-left"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm">{exercise.name}</h4>
            {allDone && <span className="text-accent text-sm">✓</span>}
          </div>
          <p className="text-xs text-muted mt-0.5">
            {exercise.sets} x {exercise.reps}
          </p>
        </div>
        <span className="text-muted text-xs mt-1">
          {completedSets}/{exercise.sets}
        </span>
      </button>

      {expanded && (
        <div className="mt-3">
          {exercise.description && (
            <p className="text-xs text-muted mb-3 leading-relaxed">
              {exercise.description}
            </p>
          )}

          <div className="space-y-0.5">
            {Array.from({ length: exercise.sets }, (_, i) => {
              const log = existingLogs.find(
                (l) => l.exerciseId === exercise.id && l.setNumber === i + 1
              );
              return (
                <SetInput
                  key={i}
                  exerciseId={exercise.id}
                  setNumber={i + 1}
                  sessionId={sessionId}
                  defaultWeight={log?.weight ?? undefined}
                  defaultReps={log?.reps ?? undefined}
                  defaultCompleted={log?.completed ?? false}
                  onComplete={handleSetComplete}
                />
              );
            })}
          </div>

          {showTimer && restSeconds && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="text-xs text-muted mb-2">Rest Timer</div>
              <RestTimer
                seconds={restSeconds}
                autoStart={true}
                onComplete={() => setShowTimer(false)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
