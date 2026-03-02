"use client";

import { useState, useEffect, useCallback } from "react";

type Exercise = {
  id: string;
  name: string;
  description: string | null;
  sets: number;
  reps: string;
  order: number;
};

type Section = {
  id: string;
  name: string;
  type: string;
  order: number;
  restSeconds: number | null;
  notes: string | null;
  exercises: Exercise[];
};

type ProgramDay = {
  id: string;
  name: string;
  focus: string | null;
  dayNumber: number;
  totalTime: string | null;
  sections: Section[];
};

type Program = {
  id: string;
  name: string;
  description: string | null;
  days: ProgramDay[];
};

const sectionTypeColors: Record<string, string> = {
  activation: "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800",
  main: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
  accessory: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
  cooldown: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
  core: "bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800",
  agility: "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800",
};

export default function ProgramPage() {
  const [program, setProgram] = useState<Program | null>(null);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [editingExercise, setEditingExercise] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Exercise>>({});
  const [loading, setLoading] = useState(true);

  const fetchProgram = useCallback(() => {
    fetch("/api/programs")
      .then((r) => r.json())
      .then((data) => {
        setProgram(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchProgram();
  }, [fetchProgram]);

  const startEdit = (exercise: Exercise) => {
    setEditingExercise(exercise.id);
    setEditForm({
      name: exercise.name,
      description: exercise.description || "",
      sets: exercise.sets,
      reps: exercise.reps,
    });
  };

  const saveEdit = async (exerciseId: string) => {
    await fetch("/api/programs/exercises", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: exerciseId, ...editForm }),
    });
    setEditingExercise(null);
    fetchProgram();
  };

  const deleteExercise = async (exerciseId: string) => {
    if (!confirm("Delete this exercise?")) return;
    await fetch(`/api/programs/exercises?id=${exerciseId}`, {
      method: "DELETE",
    });
    fetchProgram();
  };

  const resetProgram = async () => {
    if (
      !confirm(
        "Reset program to default? This will re-seed the database and remove all workout history."
      )
    )
      return;

    // Call a reset endpoint (we'll create this inline for simplicity)
    await fetch("/api/programs/reset", { method: "POST" });
    fetchProgram();
  };

  if (loading || !program) {
    return (
      <div className="py-20 text-center text-muted text-sm">Loading...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{program.name}</h1>
          <p className="text-sm text-muted mt-1">{program.description}</p>
        </div>
        <button
          onClick={resetProgram}
          className="px-3 py-1.5 text-xs font-medium text-danger border border-danger/30 rounded-lg hover:bg-danger/5 transition-colors"
        >
          Reset to Default
        </button>
      </div>

      {/* Days */}
      {program.days.map((day) => (
        <div key={day.id} className="bg-card border border-border rounded-xl">
          <button
            onClick={() =>
              setExpandedDay(expandedDay === day.id ? null : day.id)
            }
            className="w-full p-4 flex items-center justify-between text-left"
          >
            <div>
              <div className="text-xs font-medium text-muted uppercase tracking-wide">
                Day {day.dayNumber}
              </div>
              <h3 className="text-lg font-semibold">{day.name}</h3>
              <p className="text-xs text-muted">
                {day.focus} · {day.totalTime}
              </p>
            </div>
            <span className="text-muted text-lg">
              {expandedDay === day.id ? "−" : "+"}
            </span>
          </button>

          {expandedDay === day.id && (
            <div className="px-4 pb-4 space-y-4">
              {day.sections.map((section) => (
                <div
                  key={section.id}
                  className={`border rounded-lg p-3 ${
                    sectionTypeColors[section.type] || "bg-background border-border"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold">{section.name}</h4>
                    {section.restSeconds && (
                      <span className="text-xs text-muted">
                        Rest: {section.restSeconds}s
                      </span>
                    )}
                  </div>
                  {section.notes && (
                    <p className="text-xs text-muted mb-2">{section.notes}</p>
                  )}

                  <div className="space-y-2">
                    {section.exercises.map((exercise) =>
                      editingExercise === exercise.id ? (
                        <div
                          key={exercise.id}
                          className="bg-card/80 border border-border rounded-lg p-3 space-y-2"
                        >
                          <input
                            value={editForm.name || ""}
                            onChange={(e) =>
                              setEditForm({ ...editForm, name: e.target.value })
                            }
                            className="w-full text-sm p-2 border border-border rounded-md"
                            placeholder="Exercise name"
                          />
                          <textarea
                            value={(editForm.description as string) || ""}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                description: e.target.value,
                              })
                            }
                            className="w-full text-xs p-2 border border-border rounded-md"
                            placeholder="Description / cues"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <input
                              type="number"
                              value={editForm.sets || ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  sets: parseInt(e.target.value),
                                })
                              }
                              className="w-20 text-sm p-2 border border-border rounded-md"
                              placeholder="Sets"
                            />
                            <input
                              value={editForm.reps || ""}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  reps: e.target.value,
                                })
                              }
                              className="flex-1 text-sm p-2 border border-border rounded-md"
                              placeholder="Reps"
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => setEditingExercise(null)}
                              className="px-3 py-1 text-xs text-muted hover:text-foreground"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => saveEdit(exercise.id)}
                              className="px-3 py-1 text-xs bg-primary text-white rounded-md hover:bg-primary-dark"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          key={exercise.id}
                          className="flex items-start justify-between bg-card/50 rounded-lg px-3 py-2 group"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium">
                              {exercise.name}
                            </div>
                            <div className="text-xs text-muted">
                              {exercise.sets} x {exercise.reps}
                            </div>
                            {exercise.description && (
                              <div className="text-xs text-muted mt-0.5 truncate">
                                {exercise.description}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                            <button
                              onClick={() => startEdit(exercise)}
                              className="px-2 py-1 text-xs text-primary hover:bg-primary/10 rounded"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteExercise(exercise.id)}
                              className="px-2 py-1 text-xs text-danger hover:bg-danger/10 rounded"
                            >
                              Del
                            </button>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
