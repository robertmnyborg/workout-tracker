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

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PROFILES_KEY);
      const storedActiveId = localStorage.getItem(ACTIVE_PROFILE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Profile[];
        setProfilesState(parsed);
        if (storedActiveId && parsed.some((p) => p.id === storedActiveId)) {
          setActiveProfileId(storedActiveId);
        } else if (parsed.length > 0) {
          setActiveProfileId(parsed[0].id);
        }
      }
    } catch {
      // ignore parse errors
    }
    setHydrated(true);
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
