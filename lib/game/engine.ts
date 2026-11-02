import { CARD_BY_ID, validateDeck } from "../cards";
import { shuffle } from "./rng";

export const HERO_HP = 20;
export const MAX_ENERGY = 5;
export const MAX_ROUNDS = 15;
export const MAX_BOARD = 4;
export const MAX_HAND = 5;
export const STARTING_HAND = 2;

export type Side = "player" | "bot";

export interface Unit {
  uid: number;
  cardId: number;
  attack: number;
  hp: number;
  maxHp: number;
  canAttack: boolean;
}

export interface CardInHand {
  uid: number;
  cardId: number;
}

export interface HeroState {
  hp: number;
  energy: number;
  maxEnergy: number;
  deck: CardInHand[];
  hand: CardInHand[];
  board: Unit[];
  graveyard: CardInHand[];
}

export type Outcome = "win" | "loss" | "draw";

export interface GameState {
  version: 1;
  battleId: string;
  seq: number; // increments on every accepted action
  seed: number;
  nextUid: number;
  round: number;
  turn: Side;
  over: boolean;
  outcome?: Outcome; // from the player's perspective
  endReason?: "hero" | "rounds";
  player: HeroState;
  bot: HeroState;
  log: string[];
}

export type Action =
  | { type: "play"; uid: number }
  | { type: "attack"; attacker: number; target: "hero" | number }
  | { type: "end" };

export class IllegalAction extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "IllegalAction";
  }
}

const other = (s: Side): Side => (s === "player" ? "bot" : "player");
const label = (s: Side) => (s === "player" ? "You" : "Oni Bot");
const cardName = (id: number) => CARD_BY_ID[id]?.name ?? `#${id}`;

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

function pushLog(state: GameState, line: string) {
  state.log.push(line);
  if (state.log.length > 40) state.log.splice(0, state.log.length - 40);
}

function makeHero(cardIds: number[], state: GameState): HeroState {
  const cards = cardIds.map((cardId) => ({ uid: state.nextUid++, cardId }));
  const [deck, seed] = shuffle(cards, state.seed);
  state.seed = seed;
  return { hp: HERO_HP, energy: 0, maxEnergy: 0, deck, hand: [], board: [], graveyard: [] };
}

function draw(state: GameState, side: Side) {
  const h = state[side];
  if (h.deck.length === 0 && h.graveyard.length > 0) {
    // The spirits return: fallen cards are reshuffled into the deck.
    const [deck, seed] = shuffle(h.graveyard, state.seed);
    state.seed = seed;
    h.deck = deck;
    h.graveyard = [];
  }
  if (h.deck.length === 0 || h.hand.length >= MAX_HAND) return;
  h.hand.push(h.deck.shift()!);
}

function startTurn(state: GameState, side: Side) {
  const h = state[side];
  state.turn = side;
  h.maxEnergy = Math.min(MAX_ENERGY, state.round);
  h.energy = h.maxEnergy;
  h.board.forEach((u) => (u.canAttack = true));
  draw(state, side);
}

export function createGame(playerDeck: number[], botDeck: number[], seed: number, battleId: string): GameState {
  if (!validateDeck(playerDeck)) throw new IllegalAction("Invalid player deck");
  if (!validateDeck(botDeck)) throw new IllegalAction("Invalid bot deck");
  const state: GameState = {
    version: 1,
    battleId,
    seq: 0,
    seed: seed >>> 0,
    nextUid: 1,
    round: 1,
    turn: "player",
    over: false,
    player: undefined as unknown as HeroState,
    bot: undefined as unknown as HeroState,
    log: [],
  };
  state.player = makeHero(playerDeck, state);
  state.bot = makeHero(botDeck, state);
  for (let i = 0; i < STARTING_HAND; i++) {
    draw(state, "player");
    draw(state, "bot");
  }
  pushLog(state, "The battle begins. Round 1.");
  startTurn(state, "player");
  return state;
}

function finish(state: GameState, outcome: Outcome, reason: "hero" | "rounds") {
  state.over = true;
  state.outcome = outcome;
  state.endReason = reason;
  pushLog(state, outcome === "win" ? "Victory." : outcome === "loss" ? "Defeat." : "Draw.");
}

function checkHeroDeath(state: GameState) {
  if (state.bot.hp <= 0) finish(state, "win", "hero");
  else if (state.player.hp <= 0) finish(state, "loss", "hero");
}

/** Returns the legal attack targets for a side's attacker (Guard rule applied). */
export function legalTargets(state: GameState, side: Side): ("hero" | number)[] {
  const enemy = state[other(side)];
  const guards = enemy.board.filter((u) => CARD_BY_ID[u.cardId].keyword === "Guard");
  if (guards.length > 0) return guards.map((u) => u.uid);
  return ["hero", ...enemy.board.map((u) => u.uid)];
}

function heal(h: HeroState, amount: number) {
  h.hp = Math.min(HERO_HP, h.hp + amount);
}

/**
 * Apply one action for `side`. Pure: returns a new state, never mutates input.
 * Throws IllegalAction for anything that breaks the rules.
 */
export function applyAction(input: GameState, side: Side, action: Action): GameState {
  if (input.over) throw new IllegalAction("The battle is over");
  if (input.turn !== side) throw new IllegalAction("Not your turn");
  if (!action || typeof action !== "object") throw new IllegalAction("Malformed action");
  const state = clone(input);
  const me = state[side];
  const foe = state[other(side)];

  switch (action.type) {
    case "play": {
      const idx = me.hand.findIndex((c) => c.uid === action.uid);
      if (idx < 0) throw new IllegalAction("Card is not in hand");
      const card = CARD_BY_ID[me.hand[idx].cardId];
      if (card.cost > me.energy) throw new IllegalAction("Not enough energy");
      if (me.board.length >= MAX_BOARD) throw new IllegalAction("Board is full");
      me.energy -= card.cost;
      const [played] = me.hand.splice(idx, 1);
      me.board.push({
        uid: played.uid,
        cardId: card.id,
        attack: card.attack,
        hp: card.hp,
        maxHp: card.hp,
        canAttack: card.keyword === "Swift",
      });
      pushLog(state, `${label(side)} summoned ${card.name}.`);
      break;
    }
    case "attack": {
      const attacker = me.board.find((u) => u.uid === action.attacker);
      if (!attacker) throw new IllegalAction("Attacker is not on your board");
      if (!attacker.canAttack) throw new IllegalAction("That unit cannot attack yet");
      const targets = legalTargets(state, side);
      if (!targets.includes(action.target)) throw new IllegalAction("Illegal target");
      attacker.canAttack = false;
      const leech = CARD_BY_ID[attacker.cardId].keyword === "Leech";
      if (action.target === "hero") {
        foe.hp -= attacker.attack;
        if (leech) heal(me, attacker.attack);
        pushLog(state, `${cardName(attacker.cardId)} strikes ${label(other(side))} for ${attacker.attack}.`);
      } else {
        const defender = foe.board.find((u) => u.uid === action.target)!;
        const dealt = Math.min(attacker.attack, defender.hp);
        const taken = Math.min(defender.attack, attacker.hp);
        defender.hp -= attacker.attack;
        attacker.hp -= defender.attack;
        if (leech) heal(me, dealt);
        if (CARD_BY_ID[defender.cardId].keyword === "Leech") heal(foe, taken);
        pushLog(state, `${cardName(attacker.cardId)} clashes with ${cardName(defender.cardId)}.`);
        for (const [h, u] of [[foe, defender], [me, attacker]] as const) {
          if (u.hp <= 0) {
            h.board = h.board.filter((x) => x.uid !== u.uid);
            h.graveyard.push({ uid: u.uid, cardId: u.cardId });
            pushLog(state, `${cardName(u.cardId)} falls.`);
          }
        }
      }
      checkHeroDeath(state);
      break;
    }
    case "end": {
      if (side === "bot") {
        if (state.round >= MAX_ROUNDS) {
          const p = state.player.hp;
          const b = state.bot.hp;
          finish(state, p > b ? "win" : p < b ? "loss" : "draw", "rounds");
          break;
        }
        state.round += 1;
        pushLog(state, `Round ${state.round}.`);
      }
      startTurn(state, other(side));
      break;
    }
    default:
      throw new IllegalAction("Unknown action");
  }
  state.seq += 1;
  return state;
}

/** XP awarded for a finished battle. */
export function xpFor(state: GameState): number {
  if (!state.over || !state.outcome) return 0;
  const base = state.outcome === "win" ? 100 : state.outcome === "draw" ? 40 : 25;
  const speedBonus = state.outcome === "win" ? Math.max(0, (MAX_ROUNDS - state.round) * 5) : 0;
  return base + speedBonus;
}

/** Public view sent to the browser: hides the bot's hand and both deck orders. */
export function publicView(state: GameState) {
  const hideHero = (h: HeroState) => ({
    hp: h.hp,
    energy: h.energy,
    maxEnergy: h.maxEnergy,
    board: h.board,
    handCount: h.hand.length,
    deckCount: h.deck.length,
    graveyardCount: h.graveyard.length,
  });
  return {
    battleId: state.battleId,
    seq: state.seq,
    round: state.round,
    maxRounds: MAX_ROUNDS,
    turn: state.turn,
    over: state.over,
    outcome: state.outcome,
    endReason: state.endReason,
    xp: xpFor(state),
    player: { ...hideHero(state.player), hand: state.player.hand },
    bot: hideHero(state.bot),
    log: state.log.slice(-12),
  };
}

export type PublicView = ReturnType<typeof publicView>;
