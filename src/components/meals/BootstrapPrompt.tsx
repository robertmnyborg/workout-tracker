"use client";

import { useState } from "react";

type Props = {
  profileId: string;
  profileName: string;
  onDone: () => void;
};

export function BootstrapPrompt({ profileId, profileName, onDone }: Props) {
  const [busy, setBusy] = useState<"male" | "female" | null>(null);

  const pick = async (preset: "male" | "female") => {
    setBusy(preset);
    try {
      const res = await fetch("/api/meals/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, preset }),
      });
      if (res.ok) onDone();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4 max-w-md mx-auto">
      <div>
        <h2 className="text-lg font-bold text-foreground">Set up meal tracking</h2>
        <p className="text-sm text-muted mt-1">
          Choose a starting preset for {profileName}. You can adjust targets later.
        </p>
      </div>
      <div className="grid gap-3">
        <button
          onClick={() => pick("male")}
          disabled={busy !== null}
          className="text-left p-4 border border-border rounded-lg hover:border-accent transition-colors disabled:opacity-50"
        >
          <div className="text-sm font-semibold text-foreground">Male preset</div>
          <div className="text-xs text-muted mt-1">
            ~6&apos;4&quot; 250lb · 2,900 kcal · 215g protein · 325g carbs · 87g fat
          </div>
        </button>
        <button
          onClick={() => pick("female")}
          disabled={busy !== null}
          className="text-left p-4 border border-border rounded-lg hover:border-accent transition-colors disabled:opacity-50"
        >
          <div className="text-sm font-semibold text-foreground">Female preset</div>
          <div className="text-xs text-muted mt-1">
            ~5&apos;3&quot; 170lb · 2,000 kcal · 145g protein · 200g carbs · 65g fat
          </div>
        </button>
      </div>
      <div className="text-xs text-muted">
        Both presets seed the Western Power and Asian-Based plan templates.
      </div>
    </div>
  );
}
