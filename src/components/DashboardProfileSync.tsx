"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useProfile } from "@/lib/profile-context";

export function DashboardProfileSync() {
  const { activeProfile, hydrated } = useProfile();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!hydrated || !activeProfile) return;

    const currentProfileId = searchParams.get("profile");
    if (currentProfileId !== activeProfile.id) {
      router.replace(`/?profile=${activeProfile.id}`);
    }
  }, [activeProfile, hydrated, searchParams, router]);

  return null;
}
