"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ExerciseCard } from "@/components/ExerciseCard";
import { WorkoutTimer } from "@/components/WorkoutTimer";

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
  sections: Section[];
};

type SetLog = {
  exerciseId: string;
  setNumber: number;
  weight: number | null;
  reps: number | null;
  completed: boolean;
};

type Session = {
  id: string;
  startedAt: string;
  programDay: ProgramDay;
  setLogs: SetLog[];
};

type SetRecommendation = {
  exerciseId: string;
  setNumber: number;
  previousWeight: number | null;
  previousReps: number | null;
  suggestedWeight: number | null;
  suggestedReps: number | null;
};

const sectionTypeColors: Record<string, string> = {
  activation: "text-amber-600 bg-amber-50",
  main: "text-red-600 bg-red-50",
  accessory: "text-blue-600 bg-blue-50",
  cooldown: "text-green-600 bg-green-50",
  core: "text-purple-600 bg-purple-50",
  agility: "text-orange-600 bg-orange-50",
};

export default function WorkoutPage({
  params,
}: {
  params: Promise<{ dayId: string }>;
}) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [recommendations, setRecommendations] = useState<SetRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [dayId, setDayId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setDayId(p.dayId));
  }, [params]);

  useEffect(() => {
    if (!dayId) return;

    const startWorkout = async () => {
      const [sessionRes, recsRes] = await Promise.all([
        fetch("/api/workouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ programDayId: dayId }),
        }),
        fetch(`/api/workouts/recommendations?programDayId=${dayId}`),
      ]);
      const data = await sessionRes.json();
      const recs = await recsRes.json();
      setSession(data);
      setRecommendations(Array.isArray(recs) ? recs : []);
      setLoading(false);
    };

    startWorkout();
  }, [dayId]);

  const finishWorkout = useCallback(async () => {
    if (!session) return;
    setFinishing(true);

    await fetch(`/api/workouts/${session.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completedAt: new Date().toISOString() }),
    });

    router.push("/");
    router.refresh();
  }, [session, router]);

  if (loading || !session) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted">Starting workout...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-14 bg-background/95 backdrop-blur py-3 -mx-4 px-4 z-40 border-b border-border">
        <div>
          <h1 className="text-lg font-bold">
            Day {session.programDay.dayNumber}: {session.programDay.name}
          </h1>
          <p className="text-xs text-muted">{session.programDay.focus}</p>
        </div>
        <WorkoutTimer startTime={new Date(session.startedAt)} />
      </div>

      {/* Sections */}
      {session.programDay.sections.map((section) => (
        <div key={section.id}>
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                sectionTypeColors[section.type] || "text-muted bg-background"
              }`}
            >
              {section.type.charAt(0).toUpperCase() + section.type.slice(1)}
            </span>
            <h2 className="text-base font-semibold">{section.name}</h2>
          </div>

          {section.notes && (
            <p className="text-xs text-muted mb-3">{section.notes}</p>
          )}

          <div className="space-y-3">
            {section.exercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                sessionId={session.id}
                restSeconds={section.restSeconds}
                existingLogs={(session.setLogs || []).filter(
                  (l) => l.exerciseId === exercise.id
                )}
                recommendations={recommendations.filter(
                  (r) => r.exerciseId === exercise.id
                )}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Finish Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={finishWorkout}
            disabled={finishing}
            className="w-full py-3 rounded-xl bg-accent text-white font-medium text-sm hover:bg-accent-dark transition-colors disabled:opacity-50"
          >
            {finishing ? "Saving..." : "Finish Workout"}
          </button>
        </div>
      </div>
    </div>
  );
}
