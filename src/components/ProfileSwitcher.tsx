"use client";

import { useProfile } from "@/lib/profile-context";

export function ProfileSwitcher() {
  const { profiles, activeProfile, switchProfile } = useProfile();

  if (profiles.length < 2) return null;

  return (
    <div className="inline-flex bg-background border border-border rounded-lg p-0.5">
      {profiles.map((profile) => {
        const isActive = activeProfile?.id === profile.id;
        return (
          <button
            key={profile.id}
            onClick={() => switchProfile(profile.id)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              isActive
                ? "bg-primary text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            {profile.name}
          </button>
        );
      })}
    </div>
  );
}
