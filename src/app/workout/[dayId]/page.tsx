"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ExerciseCard } from "@/components/ExerciseCard";
import { WorkoutTimer } from "@/components/WorkoutTimer";
import { ProfileSwitcher } from "@/components/ProfileSwitcher";
import { useProfile } from "@/lib/profile-context";

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
  activation: "text-amber-600 bg-amber-100/60 dark:text-amber-400 dark:bg-amber-900/30",
  main: "text-red-600 bg-red-100/60 dark:text-red-400 dark:bg-red-900/30",
  accessory: "text-blue-600 bg-blue-100/60 dark:text-blue-400 dark:bg-blue-900/30",
  cooldown: "text-green-600 bg-green-100/60 dark:text-green-400 dark:bg-green-900/30",
  core: "text-purple-600 bg-purple-100/60 dark:text-purple-400 dark:bg-purple-900/30",
  agility: "text-orange-600 bg-orange-100/60 dark:text-orange-400 dark:bg-orange-900/30",
};

export default function WorkoutPage({
  params,
}: {
  params: Promise<{ dayId: string }>;
}) {
  const router = useRouter();
  const { activeProfile, hydrated } = useProfile();

  const [sessions, setSessions] = useState<Record<string, Session>>({});
  const [recs, setRecs] = useState<Record<string, SetRecommendation[]>>({});
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [dayId, setDayId] = useState<string | null>(null);
  const [loadedProfiles, setLoadedProfiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    params.then((p) => setDayId(p.dayId));
  }, [params]);

  // Load session + recs for active profile
  useEffect(() => {
    if (!dayId || !hydrated || !activeProfile) return;
    if (loadedProfiles.has(activeProfile.id)) return;

    const loadSession = async () => {
      setLoading(true);
      const [sessionRes, recsRes] = await Promise.all([
        fetch("/api/workouts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            programDayId: dayId,
            profileId: activeProfile.id,
          }),
        }),
        fetch(
          `/api/workouts/recommendations?programDayId=${dayId}&profileId=${activeProfile.id}`
        ),
      ]);
      const sessionData = await sessionRes.json();
      const recsData = await recsRes.json();

      setSessions((prev) => ({ ...prev, [activeProfile.id]: sessionData }));
      setRecs((prev) => ({
        ...prev,
        [activeProfile.id]: Array.isArray(recsData) ? recsData : [],
      }));
      setLoadedProfiles((prev) => new Set(prev).add(activeProfile.id));
      setLoading(false);
    };

    loadSession();
  }, [dayId, activeProfile, hydrated, loadedProfiles]);

  const activeSession = activeProfile
    ? sessions[activeProfile.id] ?? null
    : null;
  const activeRecs = activeProfile ? recs[activeProfile.id] ?? [] : [];

  const finishWorkout = useCallback(async () => {
    if (!activeSession) return;
    setFinishing(true);

    await fetch(`/api/workouts/${activeSession.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completedAt: new Date().toISOString() }),
    });

    router.push("/");
    router.refresh();
  }, [activeSession, router]);

  if (!hydrated || loading || !activeSession) {
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
            Day {activeSession.programDay.dayNumber}:{" "}
            {activeSession.programDay.name}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-muted">
              {activeSession.programDay.focus}
            </p>
          </div>
        </div>
        <WorkoutTimer startTime={new Date(activeSession.startedAt)} />
      </div>

      {/* Profile Switcher below header */}
      <div className="flex justify-center">
        <ProfileSwitcher />
      </div>

      {/* Sections */}
      {activeSession.programDay.sections.map((section) => (
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
                sessionId={activeSession.id}
                restSeconds={section.restSeconds}
                existingLogs={(activeSession.setLogs || []).filter(
                  (l) => l.exerciseId === exercise.id
                )}
                recommendations={activeRecs.filter(
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
            {finishing
              ? "Saving..."
              : `Finish Workout (${activeProfile?.name})`}
          </button>
        </div>
      </div>
    </div>
  );
}
