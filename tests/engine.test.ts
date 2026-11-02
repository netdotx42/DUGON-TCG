import { describe, expect, it } from "vitest";
import {
  Action,
  GameState,
  HERO_HP,
  IllegalAction,
  MAX_ROUNDS,
  STRIKE_COST,
  applyAction,
  createGame,
  legalTargets,
  publicView,
  xpFor,
} from "@/lib/game/engine";
import { BOT_DECKS, chooseBotAction, runBotTurn } from "@/lib/game/bot";
import { CARD_BY_ID, bondedCount, cardSet, validateDeck, unlockedCardIds } from "@/lib/cards";

const STARTER = [1, 2, 3, 4, 5];
const newGame = (seed = 42) => createGame(STARTER, BOT_DECKS[0], seed, "test");

/** Put a specific unit on a board for targeted rule tests. */
function withUnit(s: GameState, side: "player" | "bot", cardId: number, canAttack = true) {
  const c = CARD_BY_ID[cardId];
  const uid = s.nextUid++;
  s[side].board.push({ uid, cardId, attack: c.attack, hp: c.hp, maxHp: c.hp, canAttack });
  return uid;
}

describe("deck validation", () => {
  it("accepts exactly 5 distinct valid cards", () => {
    expect(validateDeck([1, 2, 3, 4, 5])).toBe(true);
    expect(validateDeck([1, 2, 3, 4])).toBe(false);
    expect(validateDeck([1, 1, 2, 3, 4])).toBe(false);
    expect(validateDeck([1, 2, 3, 4, 999])).toBe(false);
    expect(validateDeck([11, 23, 47, 70, 100])).toBe(true);
    expect(validateDeck("12345")).toBe(false);
  });
  it("unlocks starter cards on claim and more with XP", () => {
    expect(unlockedCardIds(false, 9999)).toEqual([]);
    expect(unlockedCardIds(true, 0)).toEqual([1, 2, 3, 4, 5]);
    expect(unlockedCardIds(true, 200)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(unlockedCardIds(true, 0, { 16: 1, 11: 2 })).toEqual([1, 2, 3, 4, 5, 11, 16]);
    expect(unlockedCardIds(false, 0, { 16: 1 })).toEqual([]);
  });
});

describe("game setup", () => {
  it("starts with 20 HP, 1 energy, player to move, 3 cards in hand", () => {
    const s = newGame();
    expect(s.player.hp).toBe(HERO_HP);
    expect(s.bot.hp).toBe(HERO_HP);
    expect(s.player.energy).toBe(1);
    expect(s.turn).toBe("player");
    expect(s.player.hand.length).toBe(3);
    expect(s.player.hand.length + s.player.deck.length).toBe(5);
  });
  it("energy ramps by 1 per round and caps at 5", () => {
    let s = newGame();
    const seen: number[] = [];
    for (let r = 0; r < 7; r++) {
      seen.push(s.player.maxEnergy);
      s = applyAction(s, "player", { type: "end" });
      s = applyAction(s, "bot", { type: "end" });
    }
    expect(seen).toEqual([1, 2, 3, 4, 5, 5, 5]);
  });
});

describe("rules enforcement", () => {
  it("rejects acting out of turn", () => {
    const s = newGame();
    expect(() => applyAction(s, "bot", { type: "end" })).toThrow(IllegalAction);
  });
  it("rejects playing a card not in hand or without enough energy", () => {
    const s = newGame();
    expect(() => applyAction(s, "player", { type: "play", uid: 999 })).toThrow(/not in hand/);
    s.player.energy = 0;
    expect(() => applyAction(s, "player", { type: "play", uid: s.player.hand[0].uid })).toThrow(/energy/);
  });
  it("does not mutate the input state", () => {
    const s = newGame();
    const before = JSON.stringify(s);
    applyAction(s, "player", { type: "end" });
    expect(JSON.stringify(s)).toBe(before);
  });
  it("summoned units cannot attack the same turn unless Swift", () => {
    const s = newGame();
    s.player.energy = 5;
    s.player.hand = [{ uid: 900, cardId: 1 }, { uid: 901, cardId: 2 }];
    let n = applyAction(s, "player", { type: "play", uid: 900 });
    n = applyAction(n, "player", { type: "play", uid: 901 });
    expect(() => applyAction(n, "player", { type: "attack", attacker: 900, target: "hero" })).toThrow(/cannot attack/);
    const hit = applyAction(n, "player", { type: "attack", attacker: 901, target: "hero" });
    expect(hit.bot.hp).toBe(HERO_HP - 3); // Wisp 2/1 bonded with the Imp (both Origin): 3/2
  });
  it("Guard units must be attacked first", () => {
    const s = newGame();
    const atk = withUnit(s, "player", 4);
    const guard = withUnit(s, "bot", 3);
    expect(legalTargets(s, "player")).toEqual([guard]);
    expect(() => applyAction(s, "player", { type: "attack", attacker: atk, target: "hero" })).toThrow(/Illegal target/);
  });
  it("combat damages both units and removes the dead", () => {
    const s = newGame();
    const brawler = withUnit(s, "player", 4); // 3/2
    const imp = withUnit(s, "bot", 1); // 1/2
    const n = applyAction(s, "player", { type: "attack", attacker: brawler, target: imp });
    expect(n.bot.board.find((u) => u.uid === imp)).toBeUndefined();
    expect(n.player.board.find((u) => u.uid === brawler)?.hp).toBe(1);
    expect(n.bot.graveyard.some((c) => c.uid === imp)).toBe(true);
  });
  it("a unit can only attack once per turn", () => {
    const s = newGame();
    const u = withUnit(s, "player", 4);
    const n = applyAction(s, "player", { type: "attack", attacker: u, target: "hero" });
    expect(() => applyAction(n, "player", { type: "attack", attacker: u, target: "hero" })).toThrow();
  });
  it("Leech heals the hero, capped at 20", () => {
    const s = newGame();
    s.player.hp = 15;
    const monk = withUnit(s, "player", 7);
    const n = applyAction(s, "player", { type: "attack", attacker: monk, target: "hero" });
    expect(n.player.hp).toBe(17);
  });
  it("hero at 0 HP ends the game", () => {
    const s = newGame();
    s.bot.hp = 3;
    const u = withUnit(s, "player", 4);
    const n = applyAction(s, "player", { type: "attack", attacker: u, target: "hero" });
    expect(n.over).toBe(true);
    expect(n.outcome).toBe("win");
    expect(() => applyAction(n, "player", { type: "end" })).toThrow(/over/);
    expect(xpFor(n)).toBeGreaterThanOrEqual(100);
  });
  it("after 15 rounds the higher HP wins", () => {
    let s = newGame();
    s.player.hp = 12;
    s.bot.hp = 9;
    while (!s.over) {
      s = applyAction(s, "player", { type: "end" });
      if (!s.over) s = applyAction(s, "bot", { type: "end" });
    }
    expect(s.round).toBe(MAX_ROUNDS);
    expect(s.outcome).toBe("win");
    expect(s.endReason).toBe("rounds");
  });
  it("equal HP after 15 rounds is a draw", () => {
    let s = newGame();
    while (!s.over) {
      s = applyAction(s, "player", { type: "end" });
      if (!s.over) s = applyAction(s, "bot", { type: "end" });
    }
    expect(s.outcome).toBe("draw");
  });
});

describe("Ember Strike", () => {
  it("costs 2 energy, deals 1 damage to the enemy hero, once per turn", () => {
    const s = newGame();
    s.player.energy = 5;
    const n = applyAction(s, "player", { type: "strike", target: "hero" });
    expect(n.bot.hp).toBe(HERO_HP - 1);
    expect(n.player.energy).toBe(5 - STRIKE_COST);
    expect(publicView(n).player.struck).toBe(true);
    expect(() => applyAction(n, "player", { type: "strike", target: "hero" })).toThrow(/already used/);
  });
  it("needs enough energy", () => {
    const s = newGame();
    s.player.energy = 1;
    expect(() => applyAction(s, "player", { type: "strike", target: "hero" })).toThrow(/energy/);
  });
  it("respects Guard and can finish off a unit", () => {
    const s = newGame();
    s.player.energy = 5;
    const guard = withUnit(s, "bot", 3); // Moss Warden 1/4, Guard
    const wisp = withUnit(s, "bot", 2); // Lantern Wisp 2/1
    expect(() => applyAction(s, "player", { type: "strike", target: "hero" })).toThrow(/Illegal target/);
    expect(() => applyAction(s, "player", { type: "strike", target: wisp })).toThrow(/Illegal target/);
    const n = applyAction(s, "player", { type: "strike", target: guard });
    expect(n.bot.board.find((u) => u.uid === guard)?.hp).toBe(3);
    s.bot.board = s.bot.board.filter((u) => u.uid !== guard);
    const k = applyAction(s, "player", { type: "strike", target: wisp });
    expect(k.bot.board.find((u) => u.uid === wisp)).toBeUndefined();
    expect(k.bot.graveyard.some((c) => c.uid === wisp)).toBe(true);
  });
  it("recharges at the start of your next turn", () => {
    let s = newGame();
    for (let r = 0; r < 2; r++) {
      s = applyAction(s, "player", { type: "end" });
      s = applyAction(s, "bot", { type: "end" });
    }
    s = applyAction(s, "player", { type: "strike", target: "hero" });
    s = applyAction(s, "player", { type: "end" });
    s = applyAction(s, "bot", { type: "end" });
    expect(s.player.struck).toBe(false);
    expect(() => applyAction(s, "player", { type: "strike", target: "hero" })).not.toThrow();
  });
  it("can win the battle", () => {
    const s = newGame();
    s.player.energy = 2;
    s.bot.hp = 1;
    const n = applyAction(s, "player", { type: "strike", target: "hero" });
    expect(n.over).toBe(true);
    expect(n.outcome).toBe("win");
  });
  it("opens battles sealed before the hero power existed", () => {
    const s = newGame();
    delete s.player.struck;
    s.player.energy = 2;
    expect(applyAction(s, "player", { type: "strike", target: "hero" }).bot.hp).toBe(HERO_HP - 1);
  });
});

describe("Pack Bond", () => {
  it("groups cards by booster pack, with the first ten as Origin", () => {
    expect(cardSet(1)).toBe("origin");
    expect(cardSet(11)).toBe("ember-shrine");
    expect(bondedCount([1, 2, 11, 23, 47])).toBe(2);
    expect(bondedCount([11, 12, 13, 17, 18])).toBe(5);
    expect(bondedCount([11, 17, 23, 29, 35])).toBe(0);
  });
  it("gives +1/+1 when summoned beside an ally from the same pack", () => {
    const s = newGame();
    s.player.energy = 5;
    withUnit(s, "player", 11); // Cinder Pup, ember-shrine
    s.player.hand = [{ uid: 900, cardId: 13 }, { uid: 901, cardId: 17 }]; // Hearth Oni (ember-shrine), Bell Crab (tide-hollow)
    let n = applyAction(s, "player", { type: "play", uid: 900 });
    const oni = n.player.board.find((u) => u.uid === 900)!;
    expect([oni.attack, oni.hp, oni.maxHp, oni.bonded]).toEqual([4, 3, 3, true]);
    expect(n.log.at(-1)).toMatch(/Pack Bond/);
    n = applyAction(n, "player", { type: "play", uid: 901 });
    const crab = n.player.board.find((u) => u.uid === 901)!;
    expect([crab.attack, crab.hp, crab.bonded]).toEqual([1, 2, undefined]);
  });
  it("does not bond with the enemy board", () => {
    const s = newGame();
    s.player.energy = 5;
    withUnit(s, "bot", 1);
    s.player.hand = [{ uid: 900, cardId: 2 }];
    const n = applyAction(s, "player", { type: "play", uid: 900 });
    expect(n.player.board[0].bonded).toBeUndefined();
    expect(n.player.board[0].attack).toBe(CARD_BY_ID[2].attack);
  });
});

describe("bot", () => {
  it("only makes legal moves and always finishes its turn", () => {
    for (let seed = 1; seed <= 200; seed++) {
      let s = createGame(STARTER, BOT_DECKS[seed % BOT_DECKS.length], seed, `b${seed}`);
      while (!s.over) {
        s = applyAction(s, "player", { type: "end" });
        if (s.over) break;
        const r = runBotTurn(s); // applyAction throws on any illegal bot move
        s = r.state;
        expect(s.over || s.turn === "player").toBe(true);
      }
    }
  });
  it("goes for lethal when it can", () => {
    const s = newGame();
    s.turn = "bot";
    s.player.hp = 3;
    s.bot.hand = [];
    const u = withUnit(s, "bot", 4);
    expect(chooseBotAction(s)).toEqual({ type: "attack", attacker: u, target: "hero" });
  });
  it("spends leftover energy on Ember Strike, preferring a kill", () => {
    const s = newGame();
    s.turn = "bot";
    s.bot.hand = [];
    s.bot.energy = 3;
    const wisp = withUnit(s, "player", 2); // 2/1
    expect(chooseBotAction(s)).toEqual({ type: "strike", target: wisp });
    s.player.board = [];
    expect(chooseBotAction(s)).toEqual({ type: "strike", target: "hero" });
    s.bot.struck = true;
    expect(chooseBotAction(s)).toEqual({ type: "end" });
  });
});

describe("full games", () => {
  /** Simple greedy player: play everything affordable, attack face (or Guards). */
  function greedy(s: GameState): Action {
    const me = s.player;
    const card = me.hand.find((c) => CARD_BY_ID[c.cardId].cost <= me.energy);
    if (card && me.board.length < 4) return { type: "play", uid: card.uid };
    const ready = me.board.find((u) => u.canAttack);
    if (ready) return { type: "attack", attacker: ready.uid, target: legalTargets(s, "player")[0] };
    return { type: "end" };
  }
  it("every game terminates within 15 rounds with a valid outcome", () => {
    const outcomes = { win: 0, loss: 0, draw: 0 };
    for (let seed = 1; seed <= 300; seed++) {
      let s = createGame(STARTER, BOT_DECKS[seed % BOT_DECKS.length], seed, `g${seed}`);
      let steps = 0;
      while (!s.over && steps++ < 2000) {
        s = applyAction(s, "player", greedy(s));
        if (!s.over && s.turn === "bot") s = runBotTurn(s).state;
      }
      expect(s.over).toBe(true);
      expect(s.round).toBeLessThanOrEqual(MAX_ROUNDS);
      outcomes[s.outcome!]++;
    }
    // Both sides should be able to win; the game is not one-sided.
    expect(outcomes.win).toBeGreaterThan(0);
    expect(outcomes.loss).toBeGreaterThan(0);
  });
  it("public view hides the bot hand", () => {
    const v = publicView(newGame()) as Record<string, any>;
    expect(v.bot.hand).toBeUndefined();
    expect(v.bot.handCount).toBe(2); // bot has not drawn for its first turn yet
    expect(JSON.stringify(v)).not.toContain('"seed"');
  });
});
