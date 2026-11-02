"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { STARTER_IDS, unlockedCardIds, validateDeck } from "../cards";
import type { Outcome } from "../game/engine";

export type IdentityChain = "solana-devnet" | "base-sepolia" | "guest";
export interface Identity {
  chain: IdentityChain;
  address: string;
}

export interface ClaimInfo {
  mode: "onchain" | "simulated";
  chain: IdentityChain;
  txHash?: string;
  at: string;
}

export interface Profile {
  claim?: ClaimInfo;
  xp: number;
  deck: number[];
  record: { win: number; loss: number; draw: number };
  awarded: string[]; // battle ids already credited (prevents double XP)
}

export interface LastResult {
  battleId: string;
  outcome: Outcome;
  xp: number;
  rounds: number;
  playerHp: number;
  botHp: number;
  endReason?: string;
  unlocked: number[];
}

const EMPTY: Profile = { xp: 0, deck: [], record: { win: 0, loss: 0, draw: 0 }, awarded: [] };
const ID_KEY = "dugon:v1:identity";
const profileKey = (i: Identity) => `dugon:v1:profile:${i.chain}:${i.chain === "base-sepolia" ? i.address.toLowerCase() : i.address}`;

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* storage unavailable: demo continues in memory */
  }
}

interface Ctx {
  ready: boolean;
  identity: Identity | null;
  profile: Profile;
  unlocked: number[];
  lastResult: LastResult | null;
  setIdentity: (i: Identity | null) => void;
  setClaim: (c: ClaimInfo) => void;
  setDeck: (d: number[]) => void;
  recordResult: (r: Omit<LastResult, "unlocked">) => void;
  resetProfile: () => void;
}

const ProfileContext = createContext<Ctx | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [identity, setIdentityState] = useState<Identity | null>(null);
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [lastResult, setLastResult] = useState<LastResult | null>(null);

  useEffect(() => {
    const id = load<Identity | null>(ID_KEY, null);
    if (id && id.chain && id.address) {
      setIdentityState(id);
      setProfile(load(profileKey(id), EMPTY));
    }
    setReady(true);
  }, []);

  const update = useCallback(
    (fn: (p: Profile) => Profile) => {
      setProfile((p) => {
        const next = fn(p);
        if (identity) save(profileKey(identity), next);
        return next;
      });
    },
    [identity],
  );

  const setIdentity = useCallback((i: Identity | null) => {
    setIdentityState(i);
    if (i) {
      save(ID_KEY, i);
      setProfile(load(profileKey(i), EMPTY));
    } else {
      try {
        localStorage.removeItem(ID_KEY);
      } catch {}
      setProfile(EMPTY);
    }
  }, []);

  const unlocked = useMemo(() => unlockedCardIds(!!profile.claim, profile.xp), [profile.claim, profile.xp]);

  const value: Ctx = {
    ready,
    identity,
    profile,
    unlocked,
    lastResult,
    setIdentity,
    setClaim: (c) => update((p) => ({ ...p, claim: c, deck: p.deck.length ? p.deck : [...STARTER_IDS] })),
    setDeck: (d) => {
      if (validateDeck(d)) update((p) => ({ ...p, deck: d }));
    },
    recordResult: (r) => {
      const before = unlockedCardIds(!!profile.claim, profile.xp);
      const already = profile.awarded.includes(r.battleId);
      const xp = already ? profile.xp : profile.xp + r.xp;
      const after = unlockedCardIds(!!profile.claim, xp);
      setLastResult({ ...r, xp: already ? 0 : r.xp, unlocked: after.filter((id) => !before.includes(id)) });
      if (already) return;
      update((p) => ({
        ...p,
        xp,
        record: { ...p.record, [r.outcome]: p.record[r.outcome] + 1 },
        awarded: [...p.awarded, r.battleId].slice(-50),
      }));
    },
    resetProfile: () => update(() => EMPTY),
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const c = useContext(ProfileContext);
  if (!c) throw new Error("useProfile outside ProfileProvider");
  return c;
}
