"use client";

import { useState } from "react";
import CardView from "@/components/CardView";
import PixelSprite from "@/components/PixelSprite";
import { LinkButton, PageTitle, DemoBadge } from "@/components/ui";
import { CARD_BY_ID, CARDS, KEYWORD_TEXT, ORIGIN_CARDS, STARTER_IDS, UNLOCK_XP } from "@/lib/cards";
import { PACKS, PACK_BY_SLUG } from "@/lib/packs";
import { useProfile } from "@/lib/client/profile";

export default function CollectionPage() {
  const { profile, unlocked, identity } = useProfile();
  const [focus, setFocus] = useState<number>(4);
  const [set, setSet] = useState<string>("origin");
  const shown = set === "origin" ? ORIGIN_CARDS : CARDS.filter((c) => c.pack === set);
  const claimed = !!profile.claim;
  const f = CARD_BY_ID[focus];
  const next = ORIGIN_CARDS.find((c) => !unlocked.includes(c.id) && UNLOCK_XP[c.id] !== undefined);

  return (
    <div>
      <PageTitle
        jp="図鑑"
        title="Collection"
        sub={
          claimed
            ? `${unlocked.length} of ${CARDS.length} cards awakened · ${profile.xp} XP · ${profile.record.win}W ${profile.record.loss}L ${profile.record.draw}D`
            : `The ${CARDS.length} spirits of DUGON: ten origin cards plus ${PACKS.length} pack sets. Claim your starter pack to awaken the first five.`
        }
      />
      {profile.claim?.mode === "simulated" && (
        <div className="mb-6">
          <DemoBadge>Simulated cards · demo only</DemoBadge>
        </div>
      )}

      <nav aria-label="Card sets" className="mb-6 flex flex-wrap gap-2">
        {[{ slug: "origin", name: "Origin", jp: "原初" }, ...PACKS].map((p) => {
          const ids = p.slug === "origin" ? ORIGIN_CARDS.map((c) => c.id) : PACK_BY_SLUG[p.slug].cardIds;
          const have = ids.filter((id) => unlocked.includes(id)).length;
          return (
            <button
              key={p.slug}
              type="button"
              onClick={() => {
                setSet(p.slug);
                setFocus(ids[0]);
              }}
              aria-pressed={set === p.slug}
              className={`px-2 py-1 font-pixel text-[8px] ${set === p.slug ? "bg-bone text-ink" : "pixel-border-dim text-ash hover:text-bone"}`}
            >
              {p.name} <span className="font-mono">{have}/{ids.length}</span>
            </button>
          );
        })}
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_18rem]">
        <div className="grid grid-cols-2 justify-items-center gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {shown.map((c, i) => {
            const have = unlocked.includes(c.id);
            const starter = (STARTER_IDS as readonly number[]).includes(c.id);
            return (
              <div key={c.id} className="animate-rise" style={{ animationDelay: `${i * 40}ms` }}>
                <CardView
                  id={c.id}
                  size="md"
                  showText={false}
                  selected={focus === c.id}
                  owned={have}
                  locked={!have}
                  lockLabel={starter ? "CLAIM" : c.pack ? "PACK" : `${UNLOCK_XP[c.id]} XP`}
                  onClick={() => setFocus(c.id)}
                />
              </div>
            );
          })}
        </div>

        <aside className="pixel-border h-fit p-5 lg:sticky lg:top-32" aria-live="polite">
          <div className="flex justify-center">
            <PixelSprite name={f.sprite} size={144} />
          </div>
          <div className="mt-4 font-pixel text-xs text-bone">{f.name}</div>
          <div className="font-mono text-sm text-ash">
            {f.jp} · {f.rarity}
          </div>
          <dl className="mt-4 grid grid-cols-3 gap-2 text-center font-pixel text-[10px]">
            <div className="bg-smoke p-2">
              <dt className="text-ash">COST</dt>
              <dd className="mt-1 text-bone">{f.cost}</dd>
            </div>
            <div className="bg-smoke p-2">
              <dt className="text-ash">ATK</dt>
              <dd className="mt-1 text-bone">{f.attack}</dd>
            </div>
            <div className="bg-smoke p-2">
              <dt className="text-ash">HP</dt>
              <dd className="mt-1 text-bone">{f.hp}</dd>
            </div>
          </dl>
          {f.keyword && (
            <p className="mt-4 font-mono text-xs text-bone">
              <span className="font-pixel text-[9px]">{f.keyword}</span> — {KEYWORD_TEXT[f.keyword]}
            </p>
          )}
          <p className="mt-3 font-mono text-xs italic text-ash">“{f.flavor}”</p>
          <p className="mt-3 font-mono text-[10px] text-ash">
            Token id #{f.id}
            {f.pack && ` · ${PACK_BY_SLUG[f.pack].name} pack · ${profile.owned[f.id] ?? 0} owned`}
          </p>
        </aside>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        {!identity ? (
          <LinkButton href="/connect">Connect to play</LinkButton>
        ) : !claimed ? (
          <LinkButton href="/claim">Claim starter pack</LinkButton>
        ) : (
          <>
            <LinkButton href="/deck">Build your deck</LinkButton>
            <LinkButton href="/packs" variant="ghost">
              Open packs
            </LinkButton>
          </>
        )}
        {claimed && next && (
          <span className="font-mono text-xs text-ash">
            Next awakening: {next.name} at {UNLOCK_XP[next.id]} XP ({Math.max(0, UNLOCK_XP[next.id] - profile.xp)} to go)
          </span>
        )}
      </div>
    </div>
  );
}
