"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CardView from "@/components/CardView";
import { Button, PageTitle } from "@/components/ui";
import { CARD_BY_ID, CARDS, DECK_SIZE, UNLOCK_XP, validateDeck } from "@/lib/cards";

const RARITY_RANK = { Common: 0, Uncommon: 1, Rare: 2, Epic: 3, Legendary: 4 } as const;
import { useProfile } from "@/lib/client/profile";
import { useGate } from "@/lib/client/useGate";

export default function DeckPage() {
  const ok = useGate("claim");
  const router = useRouter();
  const { profile, unlocked, setDeck } = useProfile();
  const [picked, setPicked] = useState<number[]>([]);

  useEffect(() => {
    if (ok) setPicked(profile.deck.filter((id) => unlocked.includes(id)).slice(0, DECK_SIZE));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ok]);

  if (!ok) return null;

  const toggle = (id: number) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < DECK_SIZE ? [...p, id] : p));
  const valid = validateDeck(picked);
  const curve = picked.reduce((s, id) => s + CARD_BY_ID[id].cost, 0);

  return (
    <div>
      <PageTitle jp="編成" title="Build your deck" sub={`Choose exactly ${DECK_SIZE} different cards. Energy starts at 1 and grows to 5, so mix cheap and heavy spirits.`} />

      <section aria-label="Selected deck" className="pixel-border-dim mb-8 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="neon-soft font-pixel text-xs">
            DECK {picked.length}/{DECK_SIZE}
          </span>
          <span className="font-mono text-xs text-ash">Total cost {curve} · avg {picked.length ? (curve / picked.length).toFixed(1) : "–"}</span>
        </div>
        <div className="flex min-h-[9.5rem] flex-wrap justify-center gap-3 sm:justify-start">
          {Array.from({ length: DECK_SIZE }, (_, i) =>
            picked[i] ? (
              <CardView key={picked[i]} id={picked[i]} size="sm" onClick={() => toggle(picked[i])} />
            ) : (
              <div key={`slot-${i}`} className="pixel-border-dim flex w-[6.5rem] shrink-0 items-center justify-center font-pixel text-[8px] text-ash/60">
                EMPTY
              </div>
            ),
          )}
        </div>
      </section>

      <div className="grid grid-cols-2 justify-items-center gap-4 sm:grid-cols-3 md:grid-cols-5">
        {CARDS.filter((c) => !c.pack || unlocked.includes(c.id))
          .sort((a, b) => (a.pack ? 1 : 0) - (b.pack ? 1 : 0) || a.cost - b.cost || RARITY_RANK[a.rarity] - RARITY_RANK[b.rarity])
          .map((c) => {
          const have = unlocked.includes(c.id);
          return (
            <CardView
              key={c.id}
              id={c.id}
              size="md"
              selected={picked.includes(c.id)}
              locked={!have}
              lockLabel={`${UNLOCK_XP[c.id] ?? 0} XP`}
              onClick={have ? () => toggle(c.id) : undefined}
              dim={have && !picked.includes(c.id) && picked.length >= DECK_SIZE}
            />
          );
        })}
      </div>

      <div className="sticky bottom-0 z-20 mt-8 flex flex-wrap gap-3 bg-ink/90 py-4 backdrop-blur-md shadow-[0_-2px_0_#c8102e,0_-8px_20px_rgba(200,16,46,0.25)]">
        <Button
          disabled={!valid}
          onClick={() => {
            setDeck(picked);
            router.push("/battle");
          }}
        >
          Save &amp; battle
        </Button>
        <Button variant="ghost" onClick={() => setPicked([])}>
          Clear
        </Button>
      </div>
    </div>
  );
}
