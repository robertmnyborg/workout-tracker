"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

export type Profile = {
  id: string;
  name: string;
  createdAt: string;
};

type ProfileContextValue = {
  activeProfile: Profile | null;
  profiles: Profile[];
  switchProfile: (id: string) => void;
  setProfiles: (profiles: Profile[]) => void;
  needsSetup: boolean;
  hydrated: boolean;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

const PROFILES_KEY = "workout-profiles";
const ACTIVE_PROFILE_KEY = "workout-active-profile-id";

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfilesState] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage, then reconcile with server so stale IDs
  // (from a DB reset) get rewritten with valid server IDs.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let local: Profile[] = [];
      try {
        const stored = localStorage.getItem(PROFILES_KEY);
        if (stored) local = JSON.parse(stored) as Profile[];
      } catch {
        // ignore parse errors
      }

      let reconciled = local;
      if (local.length > 0) {
        try {
          const res = await fetch("/api/profiles");
          if (res.ok) {
            const server: Profile[] = await res.json();
            const serverById = new Map(server.map((p) => [p.id, p]));
            const serverByName = new Map(
              server.map((p) => [p.name.toLowerCase(), p])
            );
            const next: Profile[] = [];
            for (const p of local) {
              if (serverById.has(p.id)) {
                next.push(p);
                continue;
              }
              const byName = serverByName.get(p.name.toLowerCase());
              if (byName) {
                next.push(byName);
                continue;
              }
              const created = await fetch("/api/profiles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: p.name }),
              });
              if (created.ok) next.push(await created.json());
            }
            reconciled = next;
            const changed =
              next.length !== local.length ||
              next.some((p, i) => p.id !== local[i]?.id);
            if (changed) {
              localStorage.setItem(PROFILES_KEY, JSON.stringify(next));
            }
          }
        } catch {
          // network failure — fall back to local data
        }
      }

      if (cancelled) return;
      setProfilesState(reconciled);
      const storedActiveId = localStorage.getItem(ACTIVE_PROFILE_KEY);
      if (storedActiveId && reconciled.some((p) => p.id === storedActiveId)) {
        setActiveProfileId(storedActiveId);
      } else if (reconciled.length > 0) {
        setActiveProfileId(reconciled[0].id);
        localStorage.setItem(ACTIVE_PROFILE_KEY, reconciled[0].id);
      }
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const switchProfile = useCallback(
    (id: string) => {
      if (profiles.some((p) => p.id === id)) {
        setActiveProfileId(id);
        localStorage.setItem(ACTIVE_PROFILE_KEY, id);
      }
    },
    [profiles]
  );

  const setProfiles = useCallback((newProfiles: Profile[]) => {
    setProfilesState(newProfiles);
    localStorage.setItem(PROFILES_KEY, JSON.stringify(newProfiles));
    if (newProfiles.length > 0) {
      setActiveProfileId(newProfiles[0].id);
      localStorage.setItem(ACTIVE_PROFILE_KEY, newProfiles[0].id);
    }
  }, []);

  const activeProfile =
    profiles.find((p) => p.id === activeProfileId) ?? null;

  const needsSetup = hydrated && profiles.length === 0;

  return (
    <ProfileContext.Provider
      value={{
        activeProfile,
        profiles,
        switchProfile,
        setProfiles,
        needsSetup,
        hydrated,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return ctx;
}
