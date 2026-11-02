"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "./profile";

/** Redirects to the earliest missing step: connect → claim. Returns true when the page can render. */
export function useGate(needs: "identity" | "claim"): boolean {
  const { ready, identity, profile } = useProfile();
  const router = useRouter();
  const missing = !ready ? null : !identity ? "/connect" : needs === "claim" && !profile.claim ? "/claim" : null;
  useEffect(() => {
    if (missing) router.replace(missing);
  }, [missing, router]);
  return ready && !missing;
}
