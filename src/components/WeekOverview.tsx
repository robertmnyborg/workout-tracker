"use client";

type Day = {
  id: string;
  dayNumber: number;
  name: string;
};

export function WeekOverview({
  days,
  completedDayNumbers,
}: {
  days: Day[];
  completedDayNumbers: number[];
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="text-xs font-medium text-muted uppercase tracking-wide mb-3">
        This Week
      </div>
      <div className="flex gap-3">
        {days.map((day) => {
          const done = completedDayNumbers.includes(day.dayNumber);
          return (
            <div key={day.id} className="flex-1 text-center">
              <div
                className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center text-sm font-medium ${
                  done
                    ? "bg-accent text-white"
                    : "bg-background border border-border text-muted"
                }`}
              >
                {done ? "✓" : day.dayNumber}
              </div>
              <div className="text-xs text-muted mt-1.5 truncate">
                {day.name.split(" ")[0]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
