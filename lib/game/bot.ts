import { CARD_BY_ID } from "../cards";
import { Action, GameState, MAX_BOARD, STRIKE_DAMAGE, Side, Unit, applyAction, canStrike, legalTargets } from "./engine";

/** Pick the bot's next legal action. Always returns a legal move ("end" when nothing else is useful). */
export function chooseBotAction(state: GameState): Action {
  return chooseSmartAction(state, "bot");
}

/**
 * The original rule-based policy: summon the most expensive card, attack with the strongest unit,
 * then Ember Strike. Kept as a baseline opponent for the balance tests.
 */
export function chooseGreedyAction(state: GameState, side: Side): Action {
  const me = state[side];
  const foe = state[side === "bot" ? "player" : "bot"];

  // 1. Summon: most expensive affordable card first.
  if (me.board.length < MAX_BOARD) {
    const playable = me.hand
      .filter((c) => CARD_BY_ID[c.cardId].cost <= me.energy)
      .sort((a, b) => CARD_BY_ID[b.cardId].cost - CARD_BY_ID[a.cardId].cost);
    if (playable.length > 0) return { type: "play", uid: playable[0].uid };
  }

  // 2. Attack with ready units, strongest first.
  const ready = me.board.filter((u) => u.canAttack).sort((a, b) => b.attack - a.attack);
  if (ready.length > 0) {
    const attacker = ready[0];
    const targets = legalTargets(state, side);
    const totalReady = ready.reduce((s, u) => s + u.attack, 0);
    if (targets.includes("hero") && totalReady >= foe.hp) {
      return { type: "attack", attacker: attacker.uid, target: "hero" };
    }
    const units = foe.board.filter((u) => targets.includes(u.uid));
    // Favourable trade: kill the target and survive. Prefer the most valuable target.
    const clean = units
      .filter((t) => attacker.attack >= t.hp && t.attack < attacker.hp)
      .sort((a, b) => CARD_BY_ID[b.cardId].cost - CARD_BY_ID[a.cardId].cost);
    if (clean.length > 0) return { type: "attack", attacker: attacker.uid, target: clean[0].uid };
    if (targets.includes("hero")) return { type: "attack", attacker: attacker.uid, target: "hero" };
    // Forced into a Guard: hit the one we can kill, otherwise the weakest.
    const kill = units.find((t) => attacker.attack >= t.hp);
    const weakest = units.slice().sort((a, b) => a.hp - b.hp)[0];
    const target = kill ?? weakest;
    if (target) return { type: "attack", attacker: attacker.uid, target: target.uid };
  }

  // 3. Spend leftover energy on Ember Strike: finish off the best unit it can kill, else hit the hero.
  if (canStrike(me)) {
    const targets = legalTargets(state, side);
    const killable = foe.board
      .filter((u) => targets.includes(u.uid) && u.hp <= STRIKE_DAMAGE)
      .sort((a, b) => CARD_BY_ID[b.cardId].cost - CARD_BY_ID[a.cardId].cost);
    if (killable.length > 0) return { type: "strike", target: killable[0].uid };
    if (targets.includes("hero")) return { type: "strike", target: "hero" };
  }
  return { type: "end" };
}

/** Every legal action for `side` right now. */
export function legalActions(state: GameState, side: Side): Action[] {
  const me = state[side];
  const out: Action[] = [{ type: "end" }];
  if (state.over || state.turn !== side) return out;
  if (me.board.length < MAX_BOARD) {
    const seen = new Set<number>();
    for (const c of me.hand) {
      if (CARD_BY_ID[c.cardId].cost <= me.energy && !seen.has(c.cardId)) {
        seen.add(c.cardId);
        out.push({ type: "play", uid: c.uid });
      }
    }
  }
  const targets = legalTargets(state, side);
  for (const u of me.board) if (u.canAttack) for (const t of targets) out.push({ type: "attack", attacker: u.uid, target: t });
  if (canStrike(me)) for (const t of targets) out.push({ type: "strike", target: t });
  return out;
}

function unitValue(u: Unit): number {
  const kw = CARD_BY_ID[u.cardId].keyword;
  let v = u.attack * 1.5 + u.hp + 1;
  if (kw === "Guard") v += 1.5;
  if (kw === "Leech") v += u.attack * 0.5;
  return v;
}

/** Static evaluation from `side`'s point of view (higher is better). */
export function evaluate(state: GameState, side: Side): number {
  const foeSide: Side = side === "bot" ? "player" : "bot";
  if (state.over) {
    const won = state.outcome === (side === "player" ? "win" : "loss");
    const lost = state.outcome === (side === "player" ? "loss" : "win");
    return won ? 1e6 : lost ? -1e6 : 0;
  }
  const me = state[side];
  const foe = state[foeSide];
  const hpScore = (hp: number) => hp * 1.2 + (hp <= 6 ? (hp - 6) * 1.5 : 0);
  const board = (units: Unit[]) => units.reduce((s, u) => s + unitValue(u), 0);
  // Pressure: damage each side's board could deal next turn.
  const myPressure = me.board.reduce((s, u) => s + u.attack, 0);
  const foePressure = foe.board.reduce((s, u) => s + u.attack, 0);
  let score = hpScore(me.hp) - hpScore(foe.hp) + board(me.board) - board(foe.board);
  score += (me.hand.length - foe.hand.length) * 1.5;
  score += myPressure * 0.3 - foePressure * 0.3;
  if (foePressure >= me.hp) score -= 25; // facing lethal next turn
  if (myPressure >= foe.hp && foe.board.every((u) => CARD_BY_ID[u.cardId].keyword !== "Guard")) score += 10;
  return score;
}

/**
 * The tuned bot policy: tries every legal action one step ahead and keeps the best by `evaluate`.
 * Ending the turn is only chosen when no action improves the position.
 */
export function chooseSmartAction(state: GameState, side: Side): Action {
  let best: Action = { type: "end" };
  let bestScore = evaluate(state, side);
  for (const a of legalActions(state, side)) {
    if (a.type === "end") continue;
    const next = applyAction(state, side, a);
    let score = evaluate(next, side);
    // Leftover energy is wasted at end of turn, so spending it is never worse than ending.
    if (a.type === "play") score += 0.5;
    if (score > bestScore + 1e-9) {
      bestScore = score;
      best = a;
    }
  }
  return best;
}

/** Run the whole bot turn. Returns the final state and a snapshot after every bot action (for animation). */
export function runBotTurn(state: GameState): { state: GameState; steps: GameState[] } {
  const steps: GameState[] = [];
  let s = state;
  let guard = 0;
  while (!s.over && s.turn === "bot" && guard++ < 50) {
    s = applyAction(s, "bot", chooseBotAction(s));
    steps.push(s);
  }
  return { state: s, steps };
}

/**
 * Bot deck pools by player XP. The lists were picked by simulating thousands of battles against
 * baseline players (see tests/balance.test.ts), so difficulty rises with XP instead of falling.
 */
export const BOT_DECKS: number[][] = [
  [1, 2, 3, 4, 5], // Shrine Rabble
  [2, 3, 5, 7, 8], // Night Procession
  [2, 3, 5, 6, 9], // Storm Gate
  [3, 5, 7, 9, 10], // Iron Vigil
];

export const BOT_DECK_TIERS: { minXp: number; decks: number[] }[] = [
  { minXp: 350, decks: [1, 2, 3] },
  { minXp: 100, decks: [0, 1] },
  { minXp: 0, decks: [0] },
];

export function botDeckFor(playerXp: number, roll: number): number[] {
  // New players face the gentle starter deck; later the bot draws from tougher lists.
  const tier = BOT_DECK_TIERS.find((t) => playerXp >= t.minXp) ?? BOT_DECK_TIERS[BOT_DECK_TIERS.length - 1];
  const r = Number.isFinite(roll) ? Math.min(Math.max(roll, 0), 0.999999) : 0;
  return BOT_DECKS[tier.decks[Math.floor(r * tier.decks.length)]];
}
