"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type BatStatus =
  | { state: "none" }
  | { state: "active"; enrollmentId: string; day: number; lastDay: number; name: string | null; minutes: string | null; note: string | null }
  | { state: "finished"; enrollmentId: string; lastDay: number }
  | { state: "upcoming"; enrollmentId: string; startsIn: number };

export function BatCard({ profileId, status, todayYmd }: { profileId: string; status: BatStatus; todayYmd: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [date, setDate] = useState(todayYmd);

  const start = async () => {
    setBusy(true);
    await fetch("/api/enrollments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, corpusId: "bat-28day", startDate: date }),
    });
    setBusy(false);
    router.refresh();
  };

  if (status.state === "none" || status.state === "finished") {
    return (
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div>
          <div className="font-semibold">BAT 28-Day Alignment</div>
          <div className="text-sm text-muted">
            {status.state === "finished"
              ? `Finished all ${status.lastDay} days. Restart to run it again.`
              : "5-15 minutes a day of breathing and posture work, stacked before your training."}
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-background border border-border rounded-lg px-2 py-1.5 text-sm"
            aria-label="Start date (Day 0)"
          />
          <button
            onClick={start}
            disabled={busy}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-primary text-on-primary disabled:opacity-50"
          >
            {status.state === "finished" ? "Restart" : "Start"} (Day 0)
          </button>
        </div>
      </div>
    );
  }

  if (status.state === "upcoming") {
    return (
      <div className="bg-card border border-border rounded-xl p-4 text-sm">
        <span className="font-semibold">BAT 28-Day</span> starts in {status.startsIn} day{status.startsIn === 1 ? "" : "s"}.
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-baseline justify-between gap-3">
      <div className="min-w-0">
        <div className="font-semibold">
          BAT Day {status.day} <span className="text-muted font-normal">of {status.lastDay}</span>
        </div>
        <div className="text-sm text-muted truncate">
          {[status.name, status.minutes].filter(Boolean).join(" · ")}
        </div>
        {status.note && <div className="text-sm text-muted mt-1">{status.note}</div>}
      </div>
      <div className="h-1.5 w-24 shrink-0 bg-border rounded-full overflow-hidden" aria-hidden>
        <div className="h-full bg-primary" style={{ width: `${(status.day / status.lastDay) * 100}%` }} />
      </div>
    </div>
  );
}
