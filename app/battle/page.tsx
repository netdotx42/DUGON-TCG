"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import CardView from "@/components/CardView";
import PixelSprite from "@/components/PixelSprite";
import { Button, LinkButton } from "@/components/ui";
import { CARD_BY_ID, validateDeck } from "@/lib/cards";
import { STRIKE_COST, STRIKE_DAMAGE, type Action, type PublicView, type Unit } from "@/lib/game/engine";
import { useProfile } from "@/lib/client/profile";
import { useGate } from "@/lib/client/useGate";

const SAVE_KEY = "dugon:v1:battle";
const STEP_MS = 650;
const MAX_BOARD = 4;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function HpBar({ hp, max = 20 }: { hp: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, (hp / max) * 100));
  return (
    <div className="h-2 w-full bg-smoke" role="meter" aria-valuemin={0} aria-valuemax={max} aria-valuenow={hp} aria-label="Hero HP">
      <div className={`h-full transition-all duration-500 ${hp <= 6 ? "bg-blood" : "bg-bone"}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function EnergyPips({ energy, max }: { energy: number; max: number }) {
  return (
    <span className="inline-flex gap-1" aria-label={`Energy ${energy} of ${max}`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`h-2.5 w-2.5 rotate-45 ${i < energy ? "bg-bone" : i < max ? "border border-bone" : "border border-smoke"}`} />
      ))}
    </span>
  );
}

function HeroPanel(props: {
  name: string;
  jp: string;
  hp: number;
  energy: number;
  maxEnergy: number;
  handCount: number;
  deckCount: number;
  hit: boolean;
  targetable?: boolean;
  onTarget?: () => void;
  sprite: string;
}) {
  const Tag = props.targetable ? "button" : "div";
  return (
    <Tag
      onClick={props.targetable ? props.onTarget : undefined}
      aria-label={props.targetable ? `Attack ${props.name}` : undefined}
      className={`flex w-full items-center gap-3 p-2 text-left ${props.targetable ? "pixel-border-active animate-flicker cursor-crosshair" : "pixel-border-dim"} ${
        props.hit ? "animate-shake" : ""
      }`}
    >
      <PixelSprite name={props.sprite} size={40} className="shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="min-w-0 truncate font-pixel text-[9px] text-bone">
            {props.name} <span className="font-mono text-[10px] text-ash">{props.jp}</span>
          </span>
          <span className="shrink-0 font-pixel text-[11px] text-bone">♥ {Math.max(0, props.hp)}</span>
        </div>
        <div className="mt-1">
          <HpBar hp={props.hp} />
        </div>
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 font-mono text-[11px] text-ash">
          <EnergyPips energy={props.energy} max={props.maxEnergy} />
          <span className="whitespace-nowrap">
            hand {props.handCount} · deck {props.deckCount}
          </span>
        </div>
      </div>
    </Tag>
  );
}

function UnitView({ u, state, onClick }: { u: Unit; state: "idle" | "ready" | "selected" | "target" | "hit"; onClick?: () => void }) {
  const c = CARD_BY_ID[u.cardId];
  const Tag = onClick ? "button" : "div";
  const ring =
    state === "selected" || state === "target" ? "pixel-border-active" : state === "ready" ? "pixel-border" : "pixel-border-dim";
  return (
    <Tag
      onClick={onClick}
      aria-label={`${c.name}, attack ${u.attack}, HP ${u.hp}${u.bonded ? ", bonded" : ""}${state === "ready" ? ", ready" : ""}`}
      className={`relative flex min-w-0 max-w-[6rem] flex-1 basis-0 animate-rise flex-col items-center bg-ink px-1 pb-1.5 pt-1.5 ${ring} ${state === "target" ? "cursor-crosshair" : ""} ${
        state === "hit" ? "animate-shake" : ""
      } ${state === "ready" ? "-translate-y-0.5" : ""} transition-transform`}
    >
      <PixelSprite name={c.sprite} size={44} />
      <div className="w-full truncate text-center font-mono text-[10px] leading-tight text-ash sm:text-[11px]" title={c.name}>
        {c.name}
      </div>
      <div className="h-[13px] font-mono text-[10px] leading-tight text-bone">{c.keyword ?? ""}</div>
      <div className="mt-1 flex w-full justify-between gap-1 px-0.5 font-pixel text-[9px] sm:px-1 sm:text-[10px]">
        <span>⚔{u.attack}</span>
        <span className={u.hp < u.maxHp ? "text-blood" : ""}>♥{u.hp}</span>
      </div>
      {state === "ready" && <span className="absolute -top-2 bg-bone px-1 py-px font-pixel text-[8px] leading-none text-ink">READY</span>}
      {u.bonded && (
        <span className="absolute -bottom-2 border border-blood bg-ink px-1 py-px font-pixel text-[8px] leading-none text-blood" title="Pack Bond: +1/+1">
          BOND
        </span>
      )}
    </Tag>
  );
}

export default function BattlePage() {
  const ok = useGate("claim");
  const router = useRouter();
  const { profile, recordResult } = useProfile();
  const [token, setToken] = useState<string | null>(null);
  const [view, setView] = useState<PublicView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attacker, setAttacker] = useState<number | null>(null);
  const [striking, setStriking] = useState(false);
  const [hits, setHits] = useState<Set<string>>(new Set());
  const [botActing, setBotActing] = useState(false);
  const recorded = useRef<string | null>(null);
  const prevView = useRef<PublicView | null>(null);

  // Track damage between views to trigger the shake animation.
  const showView = useCallback((v: PublicView) => {
    const prev = prevView.current;
    if (prev && prev.battleId === v.battleId) {
      const h = new Set<string>();
      if (v.player.hp < prev.player.hp) h.add("hero:player");
      if (v.bot.hp < prev.bot.hp) h.add("hero:bot");
      for (const side of ["player", "bot"] as const)
        for (const u of v[side].board) {
          const before = prev[side].board.find((x) => x.uid === u.uid);
          if (before && u.hp < before.hp) h.add(`u:${u.uid}`);
        }
      setHits(h);
      if (h.size) setTimeout(() => setHits(new Set()), 500);
    }
    prevView.current = v;
    setView(v);
  }, []);

  const start = useCallback(async () => {
    if (!validateDeck(profile.deck)) {
      router.replace("/deck");
      return;
    }
    setBusy(true);
    setError(null);
    setAttacker(null);
    setStriking(false);
    try {
      const res = await fetch("/api/battle/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deck: profile.deck, xp: profile.xp }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Could not start battle");
      prevView.current = null;
      setToken(body.token);
      showView(body.view);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [profile.deck, profile.xp, router, showView]);

  // Resume a battle in progress (same tab) or start a new one.
  useEffect(() => {
    if (!ok || token) return;
    try {
      const saved = JSON.parse(sessionStorage.getItem(SAVE_KEY) || "null");
      if (saved?.token && saved?.view && !saved.view.over) {
        setToken(saved.token);
        showView(saved.view);
        return;
      }
    } catch {}
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ok]);

  useEffect(() => {
    if (token && view) {
      try {
        sessionStorage.setItem(SAVE_KEY, JSON.stringify({ token, view }));
      } catch {}
    }
  }, [token, view]);

  // Record the result once per battle.
  useEffect(() => {
    if (view?.over && view.outcome && recorded.current !== view.battleId && !botActing) {
      recorded.current = view.battleId;
      recordResult({
        battleId: view.battleId,
        outcome: view.outcome,
        xp: view.xp,
        rounds: view.round,
        playerHp: view.player.hp,
        botHp: view.bot.hp,
        endReason: view.endReason,
      });
    }
  }, [view, botActing, recordResult]);

  const send = useCallback(
    async (action: Action) => {
      if (!token || busy) return;
      setBusy(true);
      setError(null);
      setAttacker(null);
      setStriking(false);
      try {
        const res = await fetch("/api/battle/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, action }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Action rejected");
        setToken(body.token);
        const steps: PublicView[] = body.botSteps ?? [];
        if (steps.length) {
          setBotActing(true);
          for (const s of steps) {
            showView(s);
            await sleep(STEP_MS);
          }
          setBotActing(false);
        }
        showView(body.view);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setBusy(false);
      }
    },
    [token, busy, showView],
  );

  if (!ok) return null;
  if (!view) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <PixelSprite name="logo" size={64} className="animate-flicker" />
        <p className="font-pixel text-[10px] text-ash">{error ?? "Opening the gate…"}</p>
        {error && <Button onClick={start}>Retry</Button>}
      </div>
    );
  }

  const myTurn = view.turn === "player" && !view.over && !busy;
  const botGuards = view.bot.board.filter((u) => CARD_BY_ID[u.cardId].keyword === "Guard");
  const aiming = attacker !== null || striking;
  const canTarget = (t: "hero" | number) =>
    aiming && (botGuards.length ? typeof t === "number" && botGuards.some((g) => g.uid === t) : true);
  const hitTarget = (target: "hero" | number) => {
    if (striking) send({ type: "strike", target });
    else if (attacker !== null) send({ type: "attack", attacker, target });
  };
  const strikeReady = myTurn && !view.player.struck && view.player.energy >= STRIKE_COST;

  const unitState = (u: Unit, side: "player" | "bot") => {
    if (hits.has(`u:${u.uid}`)) return "hit" as const;
    if (side === "player") {
      if (attacker === u.uid) return "selected" as const;
      return myTurn && u.canAttack ? ("ready" as const) : ("idle" as const);
    }
    return canTarget(u.uid) ? ("target" as const) : ("idle" as const);
  };

  return (
    <div className="mx-auto max-w-4xl touch-manipulation">
      {/* minmax(0, …) + min-w-0 stop the scrolling hand row from widening the page past the screen on phones. */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1fr)_14rem]">
        <div className="flex min-w-0 flex-col gap-3">
          {/* Bot side */}
          <HeroPanel
            name="Oni Bot"
            jp="鬼"
            sprite="redOni"
            hp={view.bot.hp}
            energy={view.bot.energy}
            maxEnergy={view.bot.maxEnergy}
            handCount={view.bot.handCount}
            deckCount={view.bot.deckCount}
            hit={hits.has("hero:bot")}
            targetable={myTurn && canTarget("hero")}
            onTarget={() => hitTarget("hero")}
          />
          <div className="flex min-h-[7.5rem] items-center justify-center gap-1.5 border-b border-dashed border-smoke pb-4 pt-2 sm:gap-2" aria-label="Enemy board">
            {view.bot.board.length === 0 && <span className="font-mono text-sm text-ash">empty field</span>}
            {view.bot.board.map((u) => (
              <UnitView
                key={u.uid}
                u={u}
                state={unitState(u, "bot")}
                onClick={myTurn && canTarget(u.uid) ? () => hitTarget(u.uid) : undefined}
              />
            ))}
          </div>

          {/* Turn bar */}
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
            <div className="whitespace-nowrap font-pixel text-[9px] text-ash">
              ROUND <span className="text-bone">{view.round}</span>/{view.maxRounds}
            </div>
            <div className="text-right font-pixel text-[9px] leading-relaxed sm:text-center" aria-live="polite">
              {view.over ? (
                <span className="text-bone">BATTLE OVER</span>
              ) : botActing || view.turn === "bot" || busy ? (
                <span className="animate-flicker text-blood">ONI BOT IS ACTING…</span>
              ) : aiming ? (
                <span className="text-bone">
                  {striking ? "EMBER STRIKE: " : ""}CHOOSE A TARGET{botGuards.length ? " (GUARD FIRST)" : ""}
                </span>
              ) : (
                <span className="text-bone">YOUR TURN</span>
              )}
            </div>
            <div className="col-span-2 grid grid-cols-2 gap-2 sm:col-span-1 sm:flex">
              <Button
                variant="ghost"
                onClick={() => {
                  setAttacker(null);
                  setStriking((v) => !v);
                }}
                disabled={!strikeReady}
                aria-pressed={striking}
                title={`Ember Strike: pay ${STRIKE_COST} energy to deal ${STRIKE_DAMAGE} damage. Once per turn.`}
                className={`whitespace-nowrap px-3 py-2 ${striking ? "pixel-border-active" : ""}`}
              >
                {striking ? "Cancel" : `Strike ${STRIKE_COST}⚡`}
              </Button>
              <Button onClick={() => send({ type: "end" })} disabled={!myTurn} className="whitespace-nowrap px-3 py-2">
                End turn
              </Button>
            </div>
          </div>

          {/* Player side */}
          <div className="flex min-h-[7.5rem] items-center justify-center gap-1.5 border-t border-dashed border-smoke pb-3 pt-4 sm:gap-2" aria-label="Your board">
            {view.player.board.length === 0 && <span className="text-center font-mono text-sm text-ash">summon a spirit from your hand</span>}
            {view.player.board.map((u) => (
              <UnitView
                key={u.uid}
                u={u}
                state={unitState(u, "player")}
                onClick={
                  myTurn && u.canAttack
                    ? () => {
                        setStriking(false);
                        setAttacker(attacker === u.uid ? null : u.uid);
                      }
                    : undefined
                }
              />
            ))}
          </div>
          <HeroPanel
            name="You"
            jp="陰陽師"
            sprite="logo"
            hp={view.player.hp}
            energy={view.player.energy}
            maxEnergy={view.player.maxEnergy}
            handCount={view.player.hand.length}
            deckCount={view.player.deckCount}
            hit={hits.has("hero:player")}
          />

          {error && (
            <p role="alert" className="font-mono text-xs text-blood">
              {error}
            </p>
          )}
          {/* On phones the hand sticks to the bottom of the screen so it stays in reach while you look at the board.
              On short screens (landscape phones, iPhone SE) it would cover most of the board, so it scrolls with the page there. */}
          <div
            aria-label="Your hand"
            className="sticky bottom-0 z-30 -mx-4 flex snap-x gap-2 overflow-x-auto overscroll-x-contain bg-ink/90 px-4 pb-3 pt-4 shadow-[0_-2px_0_#c8102e] backdrop-blur-md [@media(max-height:640px)]:static lg:static lg:mx-0 lg:bg-transparent lg:px-0 lg:pb-2 lg:shadow-none lg:backdrop-blur-none"
          >
            {view.player.hand.length === 0 && <span className="font-mono text-xs text-ash">no cards in hand</span>}
            {view.player.hand.map((c) => {
              const card = CARD_BY_ID[c.cardId];
              const playable = myTurn && card.cost <= view.player.energy && view.player.board.length < MAX_BOARD;
              return (
                <div key={c.uid} className="flex shrink-0 snap-start">
                  <CardView id={c.cardId} size="sm" dim={!playable} onClick={playable ? () => send({ type: "play", uid: c.uid }) : undefined} />
                </div>
              );
            })}
          </div>
        </div>

        <aside className="pixel-border-dim h-fit p-3" aria-label="Battle log">
          <div className="mb-2 font-pixel text-[9px] text-ash">BATTLE LOG</div>
          <ol className="flex max-h-48 flex-col-reverse gap-1 overflow-y-auto overscroll-contain font-mono text-xs text-ash lg:max-h-[28rem]" aria-live="polite">
            {[...view.log].reverse().map((l, i) => (
              <li key={`${view.seq}-${i}`} className={i === 0 ? "text-bone" : ""}>
                {l}
              </li>
            ))}
          </ol>
          <div className="mt-3 flex flex-col gap-1 border-t border-smoke pt-2 font-mono text-[11px] text-ash">
            <p>
              <span className="text-bone">Ember Strike</span>: {STRIKE_COST} energy, {STRIKE_DAMAGE} damage, once per turn.
            </p>
            <p>
              <span className="text-bone">Pack Bond</span>: summon beside an ally from the same pack for +1/+1.
            </p>
            <p>Every move is validated on the server.</p>
          </div>
        </aside>
      </div>

      {view.over && !botActing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/85 p-4" role="dialog" aria-modal="true" aria-label="Battle result">
          <div className="panel panel-red w-full max-w-sm animate-rise p-6 text-center sm:p-8">
            <div className="neon font-mono text-3xl">{view.outcome === "win" ? "勝利" : view.outcome === "loss" ? "敗北" : "引分"}</div>
            <div className="mt-2 font-pixel text-xl text-bone">{view.outcome === "win" ? "VICTORY" : view.outcome === "loss" ? "DEFEAT" : "DRAW"}</div>
            <p className="mt-3 font-mono text-xs text-ash">+{view.xp} XP</p>
            <div className="mt-6 flex justify-center gap-3">
              <LinkButton href="/results">Results</LinkButton>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          variant="ghost"
          disabled={busy}
          onClick={() => {
            try {
              sessionStorage.removeItem(SAVE_KEY);
            } catch {}
            start();
          }}
        >
          Restart
        </Button>
        <LinkButton href="/deck" variant="ghost">
          Edit deck
        </LinkButton>
      </div>
    </div>
  );
}
