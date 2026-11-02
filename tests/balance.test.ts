import { describe, expect, it } from "vitest";
import { Action, GameState, Side, applyAction, createGame } from "@/lib/game/engine";
import { BOT_DECKS, botDeckFor, chooseBotAction, chooseGreedyAction, chooseSmartAction, legalActions } from "@/lib/game/bot";

type Policy = (s: GameState, side: Side) => Action;
const STARTER = [1, 2, 3, 4, 5];

function play(playerDeck: number[], botDeck: number[], seed: number, player: Policy, bot: Policy = (s) => chooseBotAction(s)) {
  let s = createGame(playerDeck, botDeck, seed, `sim${seed}`);
  let steps = 0;
  while (!s.over && steps++ < 600) s = applyAction(s, s.turn, s.turn === "player" ? player(s, "player") : bot(s, "bot"));
  expect(s.over).toBe(true);
  return s.outcome!;
}

function winRate(n: number, playerDeck: number[], botDeck: (i: number) => number[], player: Policy, bot?: Policy) {
  let wins = 0;
  for (let i = 0; i < n; i++) if (play(playerDeck, botDeck(i), (i * 2654435761 + 13) >>> 0, player, bot) === "win") wins++;
  return wins / n;
}

describe("bot balance", () => {
  it("legalActions only lists moves the engine accepts", () => {
    let s = createGame(STARTER, BOT_DECKS[3], 7, "legal");
    for (let i = 0; i < 200 && !s.over; i++) {
      for (const a of legalActions(s, s.turn)) expect(() => applyAction(s, s.turn, a)).not.toThrow();
      s = applyAction(s, s.turn, chooseSmartAction(s, s.turn));
    }
  });

  it("the tuned bot beats the old greedy bot", () => {
    // Same decks, same seeds, the tuned bot plays second against the old policy.
    const vsOld = winRate(300, STARTER, () => STARTER, chooseGreedyAction, chooseGreedyAction);
    const vsNew = winRate(300, STARTER, () => STARTER, chooseGreedyAction);
    expect(vsNew).toBeLessThan(vsOld - 0.3);
  });

  it("a starter deck player wins a fair share, not almost every game", () => {
    // Baseline players: the old greedy policy (weak) and the tuned policy (strong). A human sits between.
    const weak = winRate(300, STARTER, () => botDeckFor(0, 0), chooseGreedyAction);
    const strong = winRate(300, STARTER, () => botDeckFor(0, 0), chooseSmartAction);
    expect(weak).toBeGreaterThan(0.1);
    expect(weak).toBeLessThan(0.5);
    expect(strong).toBeGreaterThan(0.5);
    expect(strong).toBeLessThan(0.95);
  });

  it("bot decks get harder as XP rises", () => {
    const rate = (xp: number) => winRate(300, STARTER, (i) => botDeckFor(xp, (i % 100) / 100), chooseSmartAction);
    expect(rate(400)).toBeLessThan(rate(0));
  });

  it("botDeckFor always returns a deck from the pool, whatever the roll", () => {
    for (const xp of [0, 99, 100, 349, 350, 5000]) for (const roll of [0, 0.5, 0.999, 1, -1, NaN]) expect(BOT_DECKS).toContain(botDeckFor(xp, roll));
  });
});
