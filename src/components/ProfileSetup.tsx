"use client";

import { useState } from "react";
import { useProfile, type Profile } from "@/lib/profile-context";

export function ProfileSetup() {
  const { needsSetup, setProfiles } = useProfile();
  const [name1, setName1] = useState("");
  const [name2, setName2] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!needsSetup) return null;

  const canSubmit =
    name1.trim().length > 0 && name2.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);

    const [res1, res2] = await Promise.all([
      fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name1.trim() }),
      }),
      fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name2.trim() }),
      }),
    ]);

    const profile1: Profile = await res1.json();
    const profile2: Profile = await res2.json();
    setProfiles([profile1, profile2]);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Workout Tracker</h1>
          <p className="text-muted text-sm mt-2">
            Enter both names to get started. You can switch between profiles
            during workouts.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
              Person 1
            </label>
            <input
              type="text"
              value={name1}
              onChange={(e) => setName1(e.target.value)}
              placeholder="Enter name"
              className="w-full px-3 py-2.5 border border-border rounded-lg bg-card text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
              Person 2
            </label>
            <input
              type="text"
              value={name2}
              onChange={(e) => setName2(e.target.value)}
              placeholder="Enter name"
              className="w-full px-3 py-2.5 border border-border rounded-lg bg-card text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full py-3 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary-dark transition-colors disabled:opacity-40"
        >
          {submitting ? "Setting up..." : "Get Started"}
        </button>
      </div>
    </div>
  );
}
