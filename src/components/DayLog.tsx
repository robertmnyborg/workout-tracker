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
  totalTime: string | null;
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

// One scheduled piece of today (a program day + the schedule note, e.g. "Cardio after lifting")
export type DayEntry = {
  programDayId: string;
  notes: string | null;
};

// A loaded entry: its session + recommendations, in schedule order
type LoadedEntry = {
  entryNotes: string | null;
  session: Session;
  recs: SetRecommendation[];
};

const sectionTypeColors: Record<string, string> = {
  activation: "text-amber-600 bg-amber-100/60 dark:text-amber-400 dark:bg-amber-900/30",
  main: "text-red-600 bg-red-100/60 dark:text-red-400 dark:bg-red-900/30",
  accessory: "text-blue-600 bg-blue-100/60 dark:text-blue-400 dark:bg-blue-900/30",
  cooldown: "text-green-600 bg-green-100/60 dark:text-green-400 dark:bg-green-900/30",
  core: "text-purple-600 bg-purple-100/60 dark:text-purple-400 dark:bg-purple-900/30",
  agility: "text-orange-600 bg-orange-100/60 dark:text-orange-400 dark:bg-orange-900/30",
  cardio: "text-cyan-600 bg-cyan-100/60 dark:text-cyan-400 dark:bg-cyan-900/30",
  intervals: "text-pink-600 bg-pink-100/60 dark:text-pink-400 dark:bg-pink-900/30",
};

export function DayLog({
  dayLabel,
  entries,
}: {
  dayLabel: string;
  entries: DayEntry[];
}) {
  const router = useRouter();
  const { activeProfile, hydrated } = useProfile();

  // Loaded entries keyed by profile so switching profiles keeps each one's data
  const [loaded, setLoaded] = useState<Record<string, LoadedEntry[]>>({});
  const [loadedProfiles, setLoadedProfiles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    if (!hydrated || !activeProfile) return;
    if (loadedProfiles.has(activeProfile.id)) return;

    const load = async () => {
      setLoading(true);
      // Find-or-create a session + load recommendations for every program day
      // scheduled today, in order. Sessions stay separate per program day.
      const results = await Promise.all(
        entries.map(async (entry) => {
          const [sessionRes, recsRes] = await Promise.all([
            fetch("/api/workouts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                programDayId: entry.programDayId,
                profileId: activeProfile.id,
                notes: entry.notes ?? undefined,
              }),
            }),
            fetch(
              `/api/workouts/recommendations?programDayId=${entry.programDayId}&profileId=${activeProfile.id}`
            ),
          ]);
          const session: Session = await sessionRes.json();
          const recsData = await recsRes.json();
          return {
            entryNotes: entry.notes,
            session,
            recs: Array.isArray(recsData) ? recsData : [],
          } as LoadedEntry;
        })
      );

      setLoaded((prev) => ({ ...prev, [activeProfile.id]: results }));
      setLoadedProfiles((prev) => new Set(prev).add(activeProfile.id));
      setLoading(false);
    };

    load();
  }, [entries, activeProfile, hydrated, loadedProfiles]);

  const active = activeProfile ? loaded[activeProfile.id] ?? null : null;

  const finishDay = useCallback(async () => {
    if (!active) return;
    setFinishing(true);
    const completedAt = new Date().toISOString();
    await Promise.all(
      active.map((e) =>
        fetch(`/api/workouts/${e.session.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completedAt }),
        })
      )
    );
    router.push("/");
    router.refresh();
  }, [active, router]);

  if (!hydrated || loading || !active) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted">Loading today&apos;s workout...</div>
      </div>
    );
  }

  const earliestStart = active.reduce<string>(
    (min, e) => (e.session.startedAt < min ? e.session.startedAt : min),
    active[0].session.startedAt
  );

  const totalExercises = active.reduce(
    (acc, e) =>
      acc +
      e.session.programDay.sections.reduce(
        (s, sec) => s + sec.exercises.length,
        0
      ),
    0
  );

  return (
    <div className="space-y-6 pb-24">
      {/* Sticky day header with one timer for the whole day */}
      <div className="flex items-center justify-between sticky top-14 bg-background/95 backdrop-blur py-3 -mx-4 px-4 z-40 border-b border-border">
        <div>
          <h1 className="text-lg font-bold">Today · {dayLabel}</h1>
          <p className="text-xs text-muted mt-0.5">
            {active.map((e) => e.session.programDay.name).join(" + ")} ·{" "}
            {totalExercises} exercises
          </p>
        </div>
        <WorkoutTimer startTime={new Date(earliestStart)} />
      </div>

      <div className="flex justify-center">
        <ProfileSwitcher />
      </div>

      {/* Each scheduled program day, stacked in order */}
      {active.map((entry, idx) => {
        const pd = entry.session.programDay;
        return (
          <div key={entry.session.id} className="space-y-4">
            {/* Program-day divider (only show separator after the first) */}
            <div
              className={`flex items-center gap-2 ${
                idx > 0 ? "pt-4 border-t border-border" : ""
              }`}
            >
              <span className="text-base font-bold">{pd.name}</span>
              {pd.totalTime && (
                <span className="text-xs text-muted">{pd.totalTime}</span>
              )}
            </div>
            {pd.focus && <p className="-mt-2 text-xs text-muted">{pd.focus}</p>}
            {entry.entryNotes && (
              <p className="-mt-2 text-xs text-accent">{entry.entryNotes}</p>
            )}

            {pd.sections.map((section) => (
              <div key={section.id}>
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      sectionTypeColors[section.type] ||
                      "text-muted bg-background"
                    }`}
                  >
                    {section.type.charAt(0).toUpperCase() +
                      section.type.slice(1)}
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
                      sessionId={entry.session.id}
                      restSeconds={section.restSeconds}
                      existingLogs={(entry.session.setLogs || []).filter(
                        (l) => l.exerciseId === exercise.id
                      )}
                      recommendations={entry.recs.filter(
                        (r) => r.exerciseId === exercise.id
                      )}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })}

      {/* One finish action for the whole day */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={finishDay}
            disabled={finishing}
            className="w-full py-3 rounded-xl bg-accent text-white font-medium text-sm hover:bg-accent-dark transition-colors disabled:opacity-50"
          >
            {finishing
              ? "Saving..."
              : `Finish Day (${activeProfile?.name})`}
          </button>
        </div>
      </div>
    </div>
  );
}
