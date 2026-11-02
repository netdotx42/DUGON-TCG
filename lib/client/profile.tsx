"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CARD_BY_ID, STARTER_IDS, unlockedCardIds, validateDeck } from "../cards";
import { DUPLICATE_EMBERS, STARTING_EMBERS, TIER_BY_ID, TierId, cryptoRandom, embersForXp, openPack as rollPack } from "../packs";
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
  embers: number; // pack currency, earned 1:1 with battle XP
  owned: Record<string, number>; // card id -> copies pulled from packs
  packsOpened: number;
}

export interface PackPull {
  pack: string;
  tier: TierId;
  cards: { id: number; isNew: boolean; refund: number }[];
  embersRefunded: number;
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
  embers: number;
}

const EMPTY: Profile = { xp: 0, deck: [], record: { win: 0, loss: 0, draw: 0 }, awarded: [], embers: STARTING_EMBERS, owned: {}, packsOpened: 0 };
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
  recordResult: (r: Omit<LastResult, "unlocked" | "embers">) => void;
  /** Spend embers on a pack. Returns null when the pack can't be bought. */
  buyPack: (pack: string, tier: TierId) => PackPull | null;
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

  const unlocked = useMemo(() => unlockedCardIds(!!profile.claim, profile.xp, profile.owned), [profile.claim, profile.xp, profile.owned]);

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
      const before = unlockedCardIds(!!profile.claim, profile.xp, profile.owned);
      const already = profile.awarded.includes(r.battleId);
      const xp = already ? profile.xp : profile.xp + r.xp;
      const after = unlockedCardIds(!!profile.claim, xp, profile.owned);
      const embers = already ? 0 : embersForXp(r.xp);
      setLastResult({ ...r, xp: already ? 0 : r.xp, embers, unlocked: after.filter((id) => !before.includes(id)) });
      if (already) return;
      update((p) => ({
        ...p,
        xp,
        embers: p.embers + embers,
        record: { ...p.record, [r.outcome]: p.record[r.outcome] + 1 },
        awarded: [...p.awarded, r.battleId].slice(-50),
      }));
    },
    buyPack: (pack, tierId) => {
      const tier = TIER_BY_ID[tierId];
      if (!profile.claim || !tier || profile.embers < tier.price || profile.xp < tier.minXp) return null;
      let ids: number[];
      try {
        ids = rollPack(pack, tierId, cryptoRandom);
      } catch {
        return null;
      }
      const owned = { ...profile.owned };
      const cards = ids.map((id) => {
        const isNew = !(owned[id] > 0) && !unlocked.includes(id);
        owned[id] = (owned[id] ?? 0) + 1;
        return { id, isNew, refund: isNew ? 0 : DUPLICATE_EMBERS[CARD_BY_ID[id].rarity] };
      });
      const embersRefunded = cards.reduce((s, c) => s + c.refund, 0);
      update((p) => ({ ...p, owned, embers: p.embers - tier.price + embersRefunded, packsOpened: p.packsOpened + 1 }));
      return { pack, tier: tierId, cards, embersRefunded };
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
