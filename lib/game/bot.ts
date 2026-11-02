import { CARD_BY_ID } from "../cards";
import { Action, GameState, MAX_BOARD, applyAction, legalTargets } from "./engine";

/** Pick the bot's next legal action. Always returns a legal move ("end" when nothing else is useful). */
export function chooseBotAction(state: GameState): Action {
  const me = state.bot;
  const foe = state.player;

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
    const targets = legalTargets(state, "bot");
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
  return { type: "end" };
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

export const BOT_DECKS: number[][] = [
  [1, 2, 3, 4, 5], // Shrine Rabble
  [1, 3, 4, 6, 7], // Night Procession
  [2, 3, 5, 6, 9], // Storm Gate
];

export function botDeckFor(playerXp: number, roll: number): number[] {
  // New players face the gentle starter deck; later the bot draws from tougher lists.
  if (playerXp < 100) return BOT_DECKS[0];
  return BOT_DECKS[1 + Math.floor(roll * 2) % 2];
}
