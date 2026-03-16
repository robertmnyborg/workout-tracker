"use client";

import { useState, useEffect } from "react";
import { ProgressChart } from "@/components/ProgressChart";
import { useProfile } from "@/lib/profile-context";

type Exercise = {
  id: string;
  name: string;
};

type ProgressData = {
  date: string;
  maxWeight: number;
  totalVolume: number;
  sets: number;
};

export default function ProgressPage() {
  const { activeProfile, hydrated } = useProfile();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [progress, setProgress] = useState<ProgressData[]>([]);
  const [personalBests, setPersonalBests] = useState({
    maxWeight: 0,
    maxVolume: 0,
  });
  const [loading, setLoading] = useState(true);

  // Fetch exercise list when profile changes
  useEffect(() => {
    if (!hydrated || !activeProfile) return;

    setLoading(true);
    setSelectedExercise("");
    fetch(`/api/progress?profileId=${activeProfile.id}`)
      .then((r) => r.json())
      .then((data) => {
        setExercises(data);
        if (data.length > 0) {
          setSelectedExercise(data[0].id);
        }
        setLoading(false);
      });
  }, [activeProfile, hydrated]);

  // Fetch progress data when selected exercise changes
  useEffect(() => {
    if (!selectedExercise || !activeProfile) return;

    fetch(
      `/api/progress?exerciseId=${selectedExercise}&profileId=${activeProfile.id}`
    )
      .then((r) => r.json())
      .then((data) => {
        setProgress(data.progress || []);
        setPersonalBests(
          data.personalBests || { maxWeight: 0, maxVolume: 0 }
        );
      });
  }, [selectedExercise, activeProfile]);

  if (loading) {
    return (
      <div className="py-20 text-center text-muted text-sm">Loading...</div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Progress</h1>
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-muted text-sm">
            No workout data yet. Complete a workout to see your progress!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Progress</h1>

      {/* Exercise Selector */}
      <select
        value={selectedExercise}
        onChange={(e) => setSelectedExercise(e.target.value)}
        className="w-full p-2.5 border border-border rounded-lg bg-card text-sm focus:outline-none focus:ring-1 focus:ring-primary"
      >
        {exercises.map((ex) => (
          <option key={ex.id} value={ex.id}>
            {ex.name}
          </option>
        ))}
      </select>

      {/* Personal Bests */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted uppercase tracking-wide">
            Max Weight
          </div>
          <div className="text-2xl font-bold mt-1">
            {personalBests.maxWeight > 0
              ? `${personalBests.maxWeight} lbs`
              : "--"}
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted uppercase tracking-wide">
            Max Volume
          </div>
          <div className="text-2xl font-bold mt-1">
            {personalBests.maxVolume > 0
              ? personalBests.maxVolume.toLocaleString()
              : "--"}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h2 className="text-sm font-semibold mb-4">Weight Over Time</h2>
        <ProgressChart
          data={progress}
          dataKey="maxWeight"
          label="Max Weight"
          color="#1a3a5c"
        />
      </div>

      <div className="bg-card border border-border rounded-xl p-4">
        <h2 className="text-sm font-semibold mb-4">Volume Over Time</h2>
        <ProgressChart
          data={progress}
          dataKey="totalVolume"
          label="Volume"
          color="#4a90d9"
        />
      </div>
    </div>
  );
}
