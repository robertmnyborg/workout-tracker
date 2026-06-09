export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { format, startOfDay } from "date-fns";
import { DashboardProfileSync } from "@/components/DashboardProfileSync";
import { WeekSelector } from "@/components/WeekSelector";
import { DayLog, type DayEntry } from "@/components/DayLog";

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

async function getTodayEntries(weekNumber: number, todayDow: number) {
  const schedule = await prisma.weekSchedule.findUnique({
    where: { weekNumber },
    include: {
      entries: {
        where: { dayOfWeek: todayDow },
        orderBy: { order: "asc" },
        include: {
          programDay: {
            include: { program: { select: { name: true } } },
          },
        },
      },
    },
  });
  return schedule;
}

async function resolveProfileId(profileParam: string | undefined) {
  if (profileParam) return profileParam;
  const first = await prisma.profile.findFirst({
    orderBy: { createdAt: "asc" },
  });
  return first?.id ?? null;
}

async function getTodayCompleted(profileId: string, programDayIds: string[]) {
  if (programDayIds.length === 0) return new Set<string>();
  const sessions = await prisma.workoutSession.findMany({
    where: {
      profileId,
      programDayId: { in: programDayIds },
      completedAt: { not: null },
      date: { gte: startOfDay(new Date()) },
    },
    select: { programDayId: true },
  });
  return new Set(sessions.map((s) => s.programDayId));
}

export default async function Today({
  searchParams,
}: {
  searchParams: Promise<{ profile?: string; week?: string }>;
}) {
  const params = await searchParams;
  const profileId = await resolveProfileId(params.profile);
  const weekNumber = parseInt(params.week || "1");

  // Today's day of week (1=Mon ... 7=Sun)
  const jsDay = new Date().getDay();
  const todayDow = jsDay === 0 ? 7 : jsDay;
  const todayName = DAY_NAMES[todayDow - 1];
  const dateLabel = format(new Date(), "EEE, MMM d");

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

  const schedule = await getTodayEntries(weekNumber, todayDow);

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

  const todayEntries = schedule.entries;
  const isRest =
    todayEntries.length === 0 ||
    todayEntries.every((e) => e.isRest || !e.programDay);
  const restNote = todayEntries.find((e) => e.isRest)?.notes ?? null;

  const workEntries = todayEntries.filter((e) => e.programDay && !e.isRest);
  const programDayIds = workEntries
    .map((e) => e.programDay?.id)
    .filter((id): id is string => Boolean(id));
  const completed = await getTodayCompleted(profileId, programDayIds);
  const allDone =
    programDayIds.length > 0 && programDayIds.every((id) => completed.has(id));

  const dayEntries: DayEntry[] = workEntries.map((e) => ({
    programDayId: e.programDay!.id,
    notes: e.notes,
  }));

  return (
    <div className="space-y-6">
      <Suspense>
        <DashboardProfileSync />
      </Suspense>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{todayName}</h1>
          <p className="text-muted text-sm mt-0.5">
            {dateLabel} · {schedule.name}
          </p>
        </div>
        <Link
          href="/week"
          className="text-sm text-accent hover:underline whitespace-nowrap"
        >
          Week schedule →
        </Link>
      </div>

      {/* Week selector — no program start-date anchor yet, so pick your week */}
      <WeekSelector currentWeek={weekNumber} totalWeeks={3} basePath="/" />

      {isRest ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <div className="text-lg font-semibold">Rest Day</div>
          <div className="text-sm text-muted mt-1">
            {restNote || "Recovery. Light mobility only if you feel like it."}
          </div>
        </div>
      ) : allDone ? (
        <div className="space-y-4">
          <div className="bg-accent/10 border border-accent/30 rounded-xl p-6 text-center">
            <div className="text-lg font-semibold text-accent-dark">
              Day complete ✓
            </div>
            <div className="text-sm text-muted mt-1">
              {workEntries.map((e) => e.programDay?.name).join(" + ")} logged.
            </div>
          </div>
          {/* Redo links to the individual day logger to start a fresh session */}
          <div className="flex flex-wrap gap-2 justify-center">
            {workEntries.map((e) => (
              <Link
                key={e.id}
                href={`/workout/${e.programDay!.id}`}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted hover:text-foreground"
              >
                Redo {e.programDay!.name}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <DayLog dayLabel={todayName} entries={dayEntries} />
      )}
    </div>
  );
}
