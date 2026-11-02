"use client";

import { useRouter } from "next/navigation";
import CardView from "@/components/CardView";
import PixelSprite from "@/components/PixelSprite";
import { Button, LinkButton, PageTitle } from "@/components/ui";
import { ORIGIN_CARDS, UNLOCK_XP } from "@/lib/cards";
import { useProfile } from "@/lib/client/profile";

const TEXT = {
  win: { jp: "勝利", en: "VICTORY", line: "The oni bow. Your spirits grow stronger." },
  loss: { jp: "敗北", en: "DEFEAT", line: "The gate holds. Gather your spirits and return." },
  draw: { jp: "引分", en: "DRAW", line: "Fifteen bells, and neither side would yield." },
} as const;

export default function ResultsPage() {
  const router = useRouter();
  const { lastResult: r, profile, unlocked } = useProfile();
  const next = ORIGIN_CARDS.find((c) => !unlocked.includes(c.id) && UNLOCK_XP[c.id] !== undefined);

  const playAgain = () => {
    try {
      sessionStorage.removeItem("dugon:v1:battle");
    } catch {}
    router.push("/battle");
  };

  if (!r) {
    return (
      <div className="py-16 text-center">
        <PageTitle jp="結果" title="No battle yet" sub="Finish a battle to see your results here." />
        <LinkButton href="/battle">Go to battle</LinkButton>
      </div>
    );
  }
  const t = TEXT[r.outcome];
  const progress = next ? Math.min(100, (profile.xp / UNLOCK_XP[next.id]) * 100) : 100;

  return (
    <div className="flex flex-col items-center text-center">
      <PixelSprite name={r.outcome === "loss" ? "boneMonk" : r.outcome === "win" ? "logo" : "mossWarden"} size={112} className="animate-float" />
      <div className="neon mt-6 animate-rise font-mono text-5xl">{t.jp}</div>
      <h1 className="mt-2 animate-rise font-pixel text-2xl tracking-widest text-bone glow-white sm:text-4xl">{t.en}</h1>
      <p className="mt-3 font-mono text-sm text-ash">{t.line}</p>

      <dl className="mt-8 grid w-full max-w-lg grid-cols-2 gap-3 font-pixel text-[10px] sm:grid-cols-4">
        <div className="pixel-border-dim p-3">
          <dt className="text-ash">XP EARNED</dt>
          <dd className="neon-soft mt-2 text-lg">+{r.xp}</dd>
        </div>
        <div className="pixel-border-dim p-3">
          <dt className="text-ash">EMBERS</dt>
          <dd className="neon-soft mt-2 text-lg">+{r.embers ?? 0}</dd>
        </div>
        <div className="pixel-border-dim p-3">
          <dt className="text-ash">HP LEFT</dt>
          <dd className="neon-soft mt-2 text-lg">
            {Math.max(0, r.playerHp)}
            <span className="text-ash">:{Math.max(0, r.botHp)}</span>
          </dd>
        </div>
        <div className="pixel-border-dim p-3">
          <dt className="text-ash">ROUNDS</dt>
          <dd className="neon-soft mt-2 text-lg">{r.rounds}</dd>
        </div>
      </dl>
      {r.endReason === "rounds" && <p className="mt-3 font-mono text-xs text-ash">Decided on remaining HP after 15 rounds.</p>}

      <div className="mt-8 w-full max-w-lg text-left">
        <div className="flex justify-between font-mono text-xs text-ash">
          <span>Total {profile.xp} XP</span>
          <span>{next ? `${next.name} at ${UNLOCK_XP[next.id]}` : "All cards awakened"}</span>
        </div>
        <div className="mt-1 h-3 bg-smoke">
          <div className="h-full bg-blood shadow-[0_0_10px_rgba(255,36,60,0.8)] transition-all duration-700" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {r.unlocked.length > 0 && (
        <section className="mt-10">
          <h2 className="neon font-pixel text-sm">NEW SPIRIT AWAKENED</h2>
          <div className="mt-4 flex justify-center gap-4">
            {r.unlocked.map((id) => (
              <CardView key={id} id={id} size="md" owned />
            ))}
          </div>
        </section>
      )}

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Button onClick={playAgain}>Play again</Button>
        <LinkButton href="/deck" variant="ghost">
          Edit deck
        </LinkButton>
        <LinkButton href="/packs" variant="ghost">
          Open packs
        </LinkButton>
      </div>
    </div>
  );
}
