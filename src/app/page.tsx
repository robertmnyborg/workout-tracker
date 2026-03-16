export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { startOfWeek, endOfWeek, format, differenceInMinutes } from "date-fns";
import { WeekOverview } from "@/components/WeekOverview";
import { DashboardProfileSync } from "@/components/DashboardProfileSync";

async function getPrograms() {
  return prisma.program.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      days: {
        orderBy: { dayNumber: "asc" },
        include: {
          sections: {
            orderBy: { order: "asc" },
            include: {
              exercises: { orderBy: { order: "asc" } },
            },
          },
        },
      },
    },
  });
}

async function resolveProfileId(profileParam: string | undefined) {
  if (profileParam) return profileParam;
  // Fallback: use first profile
  const first = await prisma.profile.findFirst({
    orderBy: { createdAt: "asc" },
  });
  return first?.id ?? null;
}

async function getThisWeekSessions(profileId: string) {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  return prisma.workoutSession.findMany({
    where: {
      profileId,
      date: { gte: weekStart, lte: weekEnd },
      completedAt: { not: null },
    },
    include: { programDay: true },
  });
}

async function getRecentSessions(profileId: string) {
  return prisma.workoutSession.findMany({
    where: {
      profileId,
      completedAt: { not: null },
    },
    include: {
      programDay: true,
      setLogs: true,
    },
    orderBy: { date: "desc" },
    take: 5,
  });
}

async function getStreak(profileId: string) {
  const sessions = await prisma.workoutSession.findMany({
    where: { profileId, completedAt: { not: null } },
    orderBy: { date: "desc" },
    select: { date: true },
  });

  if (sessions.length === 0) return 0;

  let streak = 0;
  const now = new Date();
  let checkWeekStart = startOfWeek(now, { weekStartsOn: 1 });

  const hasCurrentWeek = sessions.some((s) => s.date >= checkWeekStart);
  if (!hasCurrentWeek) {
    checkWeekStart = new Date(
      checkWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000
    );
  }

  while (true) {
    const weekEnd = endOfWeek(checkWeekStart, { weekStartsOn: 1 });
    const hasSession = sessions.some(
      (s) => s.date >= checkWeekStart && s.date <= weekEnd
    );
    if (!hasSession) break;
    streak++;
    checkWeekStart = new Date(
      checkWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000
    );
  }

  return streak;
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ profile?: string }>;
}) {
  const params = await searchParams;
  const profileId = await resolveProfileId(params.profile);

  if (!profileId) {
    return (
      <div className="text-center py-20">
        <Suspense>
          <DashboardProfileSync />
        </Suspense>
        <h1 className="text-2xl font-bold mb-4">Welcome</h1>
        <p className="text-muted text-sm">
          Set up your profiles to get started.
        </p>
      </div>
    );
  }

  const [programs, weekSessions, recentSessions, streak] = await Promise.all([
    getPrograms(),
    getThisWeekSessions(profileId),
    getRecentSessions(profileId),
    getStreak(profileId),
  ]);

  if (programs.length === 0) {
    return (
      <div className="text-center py-20">
        <Suspense>
          <DashboardProfileSync />
        </Suspense>
        <h1 className="text-2xl font-bold mb-4">No Program Found</h1>
        <p className="text-muted text-sm">
          Run the seed script to load the workout program.
        </p>
      </div>
    );
  }

  const completedDayIds = new Set(weekSessions.map((s) => s.programDayId));

  return (
    <div className="space-y-8">
      <Suspense>
        <DashboardProfileSync />
      </Suspense>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Programs</h1>
          <p className="text-muted text-sm mt-1">
            {programs.length} active programs
          </p>
        </div>
        {streak > 0 && (
          <div className="bg-accent/10 text-accent-dark px-3 py-1.5 rounded-lg text-sm font-medium">
            {streak} week streak
          </div>
        )}
      </div>

      {programs.map((program) => {
        const programCompletedDayIds = program.days
          .filter((d) => completedDayIds.has(d.id))
          .map((d) => d.id);

        return (
          <div key={program.id} className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">{program.name}</h2>
              {program.description && (
                <p className="text-sm text-muted mt-0.5">
                  {program.description}
                </p>
              )}
            </div>

            <WeekOverview
              days={program.days}
              completedDayIds={programCompletedDayIds}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {program.days.map((day) => {
                const isCompleted = completedDayIds.has(day.id);
                const exerciseCount = day.sections.reduce(
                  (acc, s) => acc + s.exercises.length,
                  0
                );

                return (
                  <div
                    key={day.id}
                    className={`bg-card rounded-xl border p-5 ${
                      isCompleted ? "border-accent/40" : "border-border"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-xs font-medium text-muted uppercase tracking-wide">
                          Day {day.dayNumber}
                        </div>
                        <h3 className="text-lg font-semibold mt-0.5">
                          {day.name}
                        </h3>
                      </div>
                      {isCompleted && (
                        <span className="text-accent text-xl">✓</span>
                      )}
                    </div>
                    <p className="text-sm text-muted mb-1">{day.focus}</p>
                    <p className="text-xs text-muted mb-4">
                      {exerciseCount} exercises · {day.totalTime}
                    </p>
                    <Link
                      href={`/workout/${day.id}`}
                      className={`block text-center py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isCompleted
                          ? "bg-background text-muted hover:text-foreground border border-border"
                          : "bg-primary text-white hover:bg-primary-dark"
                      }`}
                    >
                      {isCompleted ? "Do Again" : "Start Workout"}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {recentSessions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Recent Workouts</h2>
          <div className="space-y-2">
            {recentSessions.map((session) => {
              const duration = session.completedAt
                ? differenceInMinutes(
                    new Date(session.completedAt),
                    new Date(session.startedAt)
                  )
                : null;

              return (
                <Link
                  key={session.id}
                  href={`/history?session=${session.id}`}
                  className="flex items-center justify-between bg-card border border-border rounded-lg px-4 py-3 hover:border-primary/30 transition-colors"
                >
                  <div>
                    <div className="font-medium text-sm">
                      {session.programDay.name}
                    </div>
                    <div className="text-xs text-muted">
                      {format(new Date(session.date), "EEE, MMM d")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {session.setLogs.length} sets
                    </div>
                    {duration !== null && (
                      <div className="text-xs text-muted">{duration} min</div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
