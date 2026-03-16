export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { startOfWeek, endOfWeek, format, differenceInMinutes } from "date-fns";
import { DashboardProfileSync } from "@/components/DashboardProfileSync";
import { WeekSelector } from "@/components/WeekSelector";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

async function getSchedule(weekNumber: number) {
  return prisma.weekSchedule.findUnique({
    where: { weekNumber },
    include: {
      entries: {
        orderBy: [{ dayOfWeek: "asc" }, { order: "asc" }],
        include: {
          programDay: {
            include: {
              program: { select: { name: true } },
              sections: {
                include: {
                  exercises: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

async function resolveProfileId(profileParam: string | undefined) {
  if (profileParam) return profileParam;
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
  searchParams: Promise<{ profile?: string; week?: string }>;
}) {
  const params = await searchParams;
  const profileId = await resolveProfileId(params.profile);
  const weekNumber = parseInt(params.week || "1");

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

  const [schedule, weekSessions, recentSessions, streak] = await Promise.all([
    getSchedule(weekNumber),
    getThisWeekSessions(profileId),
    getRecentSessions(profileId),
    getStreak(profileId),
  ]);

  if (!schedule) {
    return (
      <div className="text-center py-20">
        <Suspense>
          <DashboardProfileSync />
        </Suspense>
        <h1 className="text-2xl font-bold mb-4">No Schedule Found</h1>
        <p className="text-muted text-sm">
          Run the seed script to load the program.
        </p>
      </div>
    );
  }

  const completedDayIds = new Set(weekSessions.map((s) => s.programDayId));

  // Get today's day of week (1=Mon ... 7=Sun)
  const jsDay = new Date().getDay(); // 0=Sun, 1=Mon...
  const todayDow = jsDay === 0 ? 7 : jsDay;

  // Group entries by day of week
  const entriesByDay = new Map<
    number,
    typeof schedule.entries
  >();
  for (let d = 1; d <= 7; d++) {
    entriesByDay.set(
      d,
      schedule.entries.filter((e) => e.dayOfWeek === d)
    );
  }

  return (
    <div className="space-y-6">
      <Suspense>
        <DashboardProfileSync />
      </Suspense>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{schedule.name}</h1>
          {schedule.notes && (
            <p className="text-muted text-sm mt-1">{schedule.notes}</p>
          )}
        </div>
        {streak > 0 && (
          <div className="bg-accent/10 text-accent-dark px-3 py-1.5 rounded-lg text-sm font-medium">
            {streak} week streak
          </div>
        )}
      </div>

      {/* Week Selector */}
      <WeekSelector currentWeek={weekNumber} totalWeeks={3} />

      {/* Calendar - vertical day list */}
      <div className="space-y-3">
        {Array.from({ length: 7 }, (_, i) => i + 1).map((dow) => {
          const entries = entriesByDay.get(dow) || [];
          const isToday = dow === todayDow;
          const isRest = entries.length === 1 && entries[0].isRest;
          const restNote = isRest ? entries[0].notes : null;

          return (
            <div
              key={dow}
              className={`bg-card rounded-xl border p-4 ${
                isToday
                  ? "border-accent ring-1 ring-accent/20"
                  : "border-border"
              }`}
            >
              {/* Day header */}
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-sm font-semibold ${
                    isToday ? "text-accent" : "text-foreground"
                  }`}
                >
                  {DAY_NAMES[dow - 1]}
                </span>
                {isToday && (
                  <span className="text-xs bg-accent/10 text-accent-dark px-2 py-0.5 rounded-full font-medium">
                    Today
                  </span>
                )}
              </div>

              {isRest ? (
                <div className="py-2">
                  <div className="text-sm text-muted font-medium">Rest Day</div>
                  {restNote && (
                    <div className="text-xs text-muted mt-0.5">{restNote}</div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {entries.map((entry) => {
                    if (!entry.programDay) return null;
                    const pd = entry.programDay;
                    const isCompleted = completedDayIds.has(pd.id);
                    const exerciseCount = pd.sections.reduce(
                      (acc, s) => acc + s.exercises.length,
                      0
                    );
                    const isLifting = pd.program.name.includes("Vertical") || pd.program.name.includes("Jump");

                    return (
                      <div
                        key={entry.id}
                        className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${
                          isCompleted
                            ? "bg-accent/5 border border-accent/20"
                            : "bg-background border border-border"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                                isLifting ? "bg-primary" : "bg-accent"
                              }`}
                            />
                            <span className="text-sm font-medium truncate">
                              {pd.name}
                            </span>
                            {isCompleted && (
                              <span className="text-accent text-sm flex-shrink-0">
                                ✓
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted ml-4">
                            {exerciseCount} exercises · {pd.totalTime}
                            {entry.notes && ` · ${entry.notes}`}
                          </div>
                        </div>
                        <Link
                          href={`/workout/${pd.id}`}
                          className={`ml-3 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-shrink-0 ${
                            isCompleted
                              ? "text-muted hover:text-foreground border border-border"
                              : "bg-primary text-white hover:bg-primary-dark"
                          }`}
                        >
                          {isCompleted ? "Redo" : "Start"}
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recent Workouts */}
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
