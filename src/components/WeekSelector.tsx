"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function WeekSelector({
  currentWeek,
  totalWeeks,
}: {
  currentWeek: number;
  totalWeeks: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setWeek = (week: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("week", week.toString());
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-1 flex">
      {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((week) => (
        <button
          key={week}
          onClick={() => setWeek(week)}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            week === currentWeek
              ? "bg-primary text-white"
              : "text-muted hover:text-foreground"
          }`}
        >
          Week {week}
        </button>
      ))}
    </div>
  );
}
