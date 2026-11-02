"use client";

import { useState } from "react";
import CardView from "@/components/CardView";
import PackView from "@/components/PackView";
import { Button, DemoBadge, EmberPill, LinkButton, PageTitle, SectionLabel } from "@/components/ui";
import { CARD_BY_ID } from "@/lib/cards";
import { PACKS, PACK_BY_SLUG, RARITY_ORDER, TIERS, TIER_BY_ID, TierId, rarityOdds } from "@/lib/packs";
import { PackPull, useProfile } from "@/lib/client/profile";

const pct = (x: number) => (x === 0 ? "–" : x < 0.01 ? "<1%" : `${Math.round(x * 100)}%`);

export default function PacksPage() {
  const { ready, profile, unlocked, identity, buyPack } = useProfile();
  const [slug, setSlug] = useState(PACKS[0].slug);
  const [tierId, setTierId] = useState<TierId>("paper");
  const [pull, setPull] = useState<PackPull | null>(null);
  const [revealed, setRevealed] = useState(0);

  const claimed = !!profile.claim;
  const pack = PACK_BY_SLUG[slug];
  const tier = TIER_BY_ID[tierId];
  const tierLocked = profile.xp < tier.minXp;
  const short = profile.embers < tier.price;
  const ownedInPack = pack.cardIds.filter((id) => unlocked.includes(id)).length;
  const normal = rarityOdds(tier);
  const guaranteed = tier.guarantee ? rarityOdds(tier, tier.guarantee) : null;

  const open = () => {
    const result = buyPack(slug, tierId);
    if (!result) return;
    setPull(result);
    setRevealed(0);
    // The Open button sits low on long pages; bring the reveal into view from the top.
    window.scrollTo({ top: 0 });
  };

  if (pull) {
    const done = revealed >= pull.cards.length;
    const p = PACK_BY_SLUG[pull.pack];
    return (
      <div className="flex flex-col items-center text-center">
        <PageTitle jp="開封" title={`${p.name} · ${TIER_BY_ID[pull.tier].name}`} sub={done ? "Every card is now in your collection." : "Tap the pack to reveal the next card."} />
        {!done && (
          <button type="button" onClick={() => setRevealed((n) => n + 1)} className="animate-float" aria-label="Reveal next card">
            <PackView pack={pull.pack} tier={pull.tier} size="lg" />
          </button>
        )}
        <div className="mt-8 flex min-h-[15rem] flex-wrap justify-center gap-4" aria-live="polite">
          {pull.cards.slice(0, revealed).map((c, i) => (
            <div key={i} className="animate-flip-in relative">
              <CardView id={c.id} size="md" />
              <span
                className={`absolute -top-2 left-1/2 -translate-x-1/2 px-1 font-pixel text-[7px] ${
                  c.isNew ? "bg-blood text-bone" : "bg-smoke text-ash"
                }`}
              >
                {c.isNew ? "NEW" : `+${c.refund} EMBERS`}
              </span>
              <div className="mt-1 font-mono text-[10px] text-ash">{CARD_BY_ID[c.id].rarity}</div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {done ? (
            <>
              <Button
                onClick={() => {
                  setPull(null);
                  window.scrollTo({ top: 0 });
                }}
              >
                Back to packs
              </Button>
              <LinkButton href="/deck" variant="ghost">
                Build a deck
              </LinkButton>
            </>
          ) : (
            <Button variant="ghost" onClick={() => setRevealed(pull.cards.length)}>
              Reveal all
            </Button>
          )}
        </div>
        {done && pull.embersRefunded > 0 && <p className="mt-4 font-mono text-xs text-ash">Duplicates returned {pull.embersRefunded} embers.</p>}
      </div>
    );
  }

  return (
    <div>
      <PageTitle
        jp="封入"
        title="Card packs"
        sub="Fifteen sets of six spirits each. Pick a set, pick a tier, and spend embers to open it. You earn one ember for every XP from battle."
      />
      <div className="mb-5 flex flex-wrap items-center gap-x-6 gap-y-3">
        <EmberPill embers={profile.embers} />
        <span className="font-mono text-sm text-bone sm:text-base">
          {profile.xp} XP · {profile.packsOpened} packs opened
        </span>
      </div>
      <div className="mb-10">
        <DemoBadge>Off-chain demo pulls · no real value</DemoBadge>
      </div>

      <section aria-label="Pack tier" className="mb-12">
        <SectionLabel className="mb-5">TIER</SectionLabel>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          {TIERS.map((t) => {
            const locked = profile.xp < t.minXp;
            const gilded = t.id === "bronze" || t.id === "gold";
            const obsidian = t.id === "obsidian";
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTierId(t.id)}
                aria-pressed={tierId === t.id}
                className={`tier-card tier-card-${t.id} ${locked ? "opacity-60 hover:opacity-90" : ""} px-3 py-4 text-left sm:px-5 sm:py-5 ${obsidian ? "col-span-2 mx-auto w-full sm:w-2/3 lg:col-span-1 lg:w-auto" : ""}`}
              >
                {locked && <span className="absolute right-2 top-2 bg-smoke px-1 font-pixel text-[7px] text-bone/80">LOCKED</span>}
                <div className="flex items-baseline gap-3">
                  <span className={`font-pixel text-[11px] sm:text-sm ${obsidian ? "neon-soft" : gilded ? "text-amber" : "text-bone"}`}>{t.name}</span>
                  <span className={`font-mono text-sm sm:text-base ${obsidian ? "neon-soft" : "text-bone/80"}`}>{t.jp}</span>
                </div>
                <div className={`mt-3 font-mono text-xs sm:text-sm ${obsidian ? "neon-soft" : "text-bone/90"}`}>
                  {t.size} cards · {t.price} embers
                </div>
                <div className={`font-mono text-xs sm:text-sm ${obsidian ? "neon-soft" : "text-bone/90"}`}>
                  {locked ? (
                    <>
                      Unlocks at {t.minXp} XP
                    </>
                  ) : t.guarantee ? (
                    `${t.guarantee}+ guaranteed`
                  ) : (
                    "No guarantee"
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <SectionLabel className="mb-5">SET</SectionLabel>
      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <section aria-label="Pack sets" className="grid grid-cols-2 justify-items-center gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {PACKS.map((p, i) => (
            <div key={p.slug} className="animate-rise" style={{ animationDelay: `${i * 30}ms` }}>
              <PackView pack={p.slug} tier={tierId} size="md" selected={slug === p.slug} onClick={() => setSlug(p.slug)} className="glow-hover" />
            </div>
          ))}
        </section>

        <aside className="panel h-fit p-5 lg:sticky lg:top-36" aria-live="polite">
          <div className="neon-soft font-pixel text-sm">{pack.name}</div>
          <div className="font-mono text-sm text-ash">
            {pack.jp} · {tier.name} tier
          </div>
          <p className="mt-2 font-mono text-xs italic text-ash">{pack.blurb}</p>
          <p className="mt-2 font-mono text-[10px] text-ash">
            You own {ownedInPack} of {pack.cardIds.length} cards in this set.
          </p>

          <table className="mt-4 w-full font-mono text-[10px]">
            <thead>
              <tr className="text-ash">
                <th className="py-1 text-left font-normal">Rarity</th>
                <th className="py-1 text-right font-normal">Each slot</th>
                {guaranteed && <th className="py-1 text-right font-normal">Last slot</th>}
              </tr>
            </thead>
            <tbody>
              {RARITY_ORDER.map((r) => (
                <tr key={r} className="border-t border-smoke">
                  <td className={`py-1 ${r === "Legendary" ? "text-blood" : "text-bone"}`}>{r}</td>
                  <td className="py-1 text-right text-bone">{pct(normal[r])}</td>
                  {guaranteed && <td className="py-1 text-right text-bone">{pct(guaranteed[r])}</td>}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex flex-wrap gap-1">
            {pack.cardIds.map((id) => (
              <span key={id} title={`${CARD_BY_ID[id].name} (${CARD_BY_ID[id].rarity})`} className={`h-2 w-5 ${unlocked.includes(id) ? "bg-bone" : "bg-smoke"}`} />
            ))}
          </div>

          <div className="mt-5">
            {!ready ? (
              <div className="h-[2.6rem]" aria-hidden />
            ) : !identity ? (
              <LinkButton href="/connect">Connect to open packs</LinkButton>
            ) : !claimed ? (
              <LinkButton href="/claim">Claim starter pack first</LinkButton>
            ) : (
              <>
                <Button onClick={open} disabled={tierLocked || short} className="w-full">
                  Open for {tier.price} embers
                </Button>
                {tierLocked && <p className="mt-2 font-mono text-[10px] text-blood">{tier.name} packs unlock at {tier.minXp} XP.</p>}
                {!tierLocked && short && <p className="mt-2 font-mono text-[10px] text-blood">You need {tier.price - profile.embers} more embers. Win battles to earn them.</p>}
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
