"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { formatDuration } from "@/lib/utils";

export function RestTimer({
  seconds,
  onComplete,
  autoStart = false,
}: {
  seconds: number;
  onComplete?: () => void;
  autoStart?: boolean;
}) {
  const [remaining, setRemaining] = useState(seconds * 1000);
  const [isRunning, setIsRunning] = useState(autoStart);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 100) {
          clearInterval(interval);
          setIsRunning(false);
          onCompleteRef.current?.();
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning]);

  const reset = useCallback(() => {
    setRemaining(seconds * 1000);
    setIsRunning(false);
  }, [seconds]);

  const toggle = useCallback(() => {
    if (remaining === 0) {
      setRemaining(seconds * 1000);
      setIsRunning(true);
    } else {
      setIsRunning((prev) => !prev);
    }
  }, [remaining, seconds]);

  const progress = 1 - remaining / (seconds * 1000);
  const circumference = 2 * Math.PI * 28;

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-border"
          />
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className={remaining === 0 ? "text-accent" : "text-primary"}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xs font-mono font-medium">
          {formatDuration(remaining)}
        </div>
      </div>
      <div className="flex gap-1.5">
        <button
          onClick={toggle}
          className="px-3 py-1.5 rounded-md text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          {remaining === 0 ? "Restart" : isRunning ? "Pause" : "Start"}
        </button>
        <button
          onClick={reset}
          className="px-3 py-1.5 rounded-md text-xs font-medium bg-background border border-border text-muted hover:text-foreground transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
