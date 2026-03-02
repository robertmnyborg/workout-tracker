"use client";

import { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
  differenceInMinutes,
} from "date-fns";
import { useProfile } from "@/lib/profile-context";

type Session = {
  id: string;
  date: string;
  startedAt: string;
  completedAt: string | null;
  notes: string | null;
  programDay: {
    dayNumber: number;
    name: string;
  };
  setLogs: {
    id: string;
    setNumber: number;
    weight: number | null;
    reps: number | null;
    completed: boolean;
    exercise: {
      name: string;
    };
  }[];
};

export default function HistoryPage() {
  const { activeProfile, hydrated } = useProfile();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hydrated || !activeProfile) return;

    setLoading(true);
    setSelectedSession(null);
    fetch(`/api/workouts?limit=100&profileId=${activeProfile.id}`)
      .then((r) => r.json())
      .then((data) => {
        setSessions(data);
        setLoading(false);
      });
  }, [activeProfile, hydrated]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);
  // Adjust for Monday start (0=Mon, 6=Sun)
  const offset = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  const completedSessions = sessions.filter((s) => s.completedAt);
  const totalSessions = completedSessions.length;
  const avgDuration =
    completedSessions.length > 0
      ? Math.round(
          completedSessions.reduce((acc, s) => {
            return (
              acc +
              differenceInMinutes(
                new Date(s.completedAt!),
                new Date(s.startedAt)
              )
            );
          }, 0) / completedSessions.length
        )
      : 0;

  const workoutDates = completedSessions.map((s) => new Date(s.date));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">History</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold">{totalSessions}</div>
          <div className="text-xs text-muted mt-1">Total Workouts</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold">{avgDuration}</div>
          <div className="text-xs text-muted mt-1">Avg Duration (min)</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold">
            {totalSessions > 0
              ? Math.round(
                  (completedSessions.length /
                    Math.max(
                      1,
                      Math.ceil(
                        (Date.now() -
                          new Date(
                            completedSessions[
                              completedSessions.length - 1
                            ]?.date ?? Date.now()
                          ).getTime()) /
                          (7 * 24 * 60 * 60 * 1000)
                      ) * 4
                    )) *
                    100
                )
              : 0}
            %
          </div>
          <div className="text-xs text-muted mt-1">Consistency</div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="px-2 py-1 text-muted hover:text-foreground"
          >
            ←
          </button>
          <h2 className="font-semibold text-sm">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="px-2 py-1 text-muted hover:text-foreground"
          >
            →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted mb-2">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: offset }, (_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {daysInMonth.map((day) => {
            const hasWorkout = workoutDates.some((d) => isSameDay(d, day));
            const daySession = completedSessions.find((s) =>
              isSameDay(new Date(s.date), day)
            );

            return (
              <button
                key={day.toISOString()}
                onClick={() => daySession && setSelectedSession(daySession)}
                className={`aspect-square rounded-lg flex items-center justify-center text-xs transition-colors ${
                  hasWorkout
                    ? "bg-primary text-white font-medium cursor-pointer hover:bg-primary-dark"
                    : "text-muted hover:bg-background"
                }`}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>
      </div>

      {/* Session Detail */}
      {selectedSession && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">
                Day {selectedSession.programDay.dayNumber}:{" "}
                {selectedSession.programDay.name}
              </h3>
              <p className="text-xs text-muted">
                {format(new Date(selectedSession.date), "EEEE, MMMM d, yyyy")}
                {selectedSession.completedAt &&
                  ` · ${differenceInMinutes(
                    new Date(selectedSession.completedAt),
                    new Date(selectedSession.startedAt)
                  )} min`}
              </p>
            </div>
            <button
              onClick={() => setSelectedSession(null)}
              className="text-muted hover:text-foreground text-sm"
            >
              ✕
            </button>
          </div>

          {selectedSession.setLogs.length === 0 ? (
            <p className="text-sm text-muted">No sets logged.</p>
          ) : (
            <div className="space-y-1">
              {selectedSession.setLogs
                .filter((l) => l.completed)
                .map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between py-1.5 text-sm border-b border-border last:border-0"
                  >
                    <span className="text-muted">
                      {log.exercise.name}
                    </span>
                    <span className="font-medium">
                      {log.weight ? `${log.weight} lbs` : "--"} x{" "}
                      {log.reps || "--"}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="text-center text-muted text-sm py-4">Loading...</div>
      )}
    </div>
  );
}
