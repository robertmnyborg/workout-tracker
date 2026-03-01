"use client";

import { useState, useEffect } from "react";
import { formatDuration } from "@/lib/utils";

export function WorkoutTimer({ startTime }: { startTime: Date }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(startTime).getTime();
    const interval = setInterval(() => {
      setElapsed(Date.now() - start);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="text-sm font-mono text-muted">
      {formatDuration(elapsed)}
    </div>
  );
}
