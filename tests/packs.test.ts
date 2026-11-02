import { describe, expect, it } from "vitest";
import { CARDS, CARD_BY_ID, PACK_CARDS } from "@/lib/cards";
import { SPRITES, expandSprite } from "@/lib/sprites";
import { MAX_ENERGY } from "@/lib/game/engine";
import { PACKS, RARITY_ORDER, TIERS, openPack, rarityOdds } from "@/lib/packs";

/** Deterministic PRNG (mulberry32) so drop-rate tests are stable. */
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("card catalogue", () => {
  it("has 100 cards with unique sequential ids", () => {
    expect(CARDS).toHaveLength(100);
    expect(CARDS.map((c) => c.id)).toEqual(Array.from({ length: 100 }, (_, i) => i + 1));
  });
  it("gives every card a valid 16x16 sprite in the house palette", () => {
    for (const c of CARDS) {
      const s = SPRITES[c.sprite];
      expect(s, c.name).toBeDefined();
      const rows = expandSprite(s);
      expect(rows, c.name).toHaveLength(16);
      for (const r of rows) expect(r, c.name).toMatch(/^[.#+r]{16}$/);
    }
  });
  it("uses a different sprite and name for every card", () => {
    expect(new Set(CARDS.map((c) => c.sprite)).size).toBe(CARDS.length);
    expect(new Set(CARDS.map((c) => c.name)).size).toBe(CARDS.length);
  });
  it("keeps pack cards playable and within the stat curve", () => {
    for (const c of PACK_CARDS) {
      expect(c.cost).toBeGreaterThanOrEqual(1);
      expect(c.cost).toBeLessThanOrEqual(MAX_ENERGY);
      const budget = c.attack + c.hp + (c.keyword ? 1 : 0);
      expect(budget, c.name).toBeLessThanOrEqual(2 * c.cost + 3);
      expect(budget, c.name).toBeGreaterThanOrEqual(2 * c.cost);
    }
  });
});

describe("packs", () => {
  it("has 15 packs of 6 cards: 2 Common, 1 each of Uncommon to Legendary", () => {
    expect(PACKS).toHaveLength(15);
    for (const p of PACKS) {
      expect(p.cardIds).toHaveLength(6);
      const counts = RARITY_ORDER.map((r) => p.cardIds.filter((id) => CARD_BY_ID[id].rarity === r).length);
      expect(counts).toEqual([2, 1, 1, 1, 1]);
      expect(SPRITES[p.cover]).toBeDefined();
    }
  });
  it("has five tiers that get bigger, pricier and better", () => {
    expect(TIERS.map((t) => t.id)).toEqual(["paper", "bronze", "silver", "gold", "obsidian"]);
    for (let i = 1; i < TIERS.length; i++) {
      expect(TIERS[i].price).toBeGreaterThan(TIERS[i - 1].price);
      expect(TIERS[i].size).toBeGreaterThanOrEqual(TIERS[i - 1].size);
      expect(rarityOdds(TIERS[i]).Legendary).toBeGreaterThan(rarityOdds(TIERS[i - 1]).Legendary);
    }
    for (const t of TIERS) {
      const odds = rarityOdds(t);
      expect(Object.values(odds).reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
    }
  });
  it("only pulls cards from the chosen pack, in the tier's size", () => {
    const rand = seeded(7);
    for (const p of PACKS) {
      for (const t of TIERS) {
        const ids = openPack(p.slug, t.id, rand);
        expect(ids).toHaveLength(t.size);
        for (const id of ids) expect(p.cardIds).toContain(id);
      }
    }
  });
  it("always honours the tier guarantee on the last card", () => {
    const rand = seeded(42);
    for (const t of TIERS.filter((x) => x.guarantee)) {
      const floor = RARITY_ORDER.indexOf(t.guarantee!);
      for (let i = 0; i < 500; i++) {
        const ids = openPack("void-gate", t.id, rand);
        expect(RARITY_ORDER.indexOf(CARD_BY_ID[ids[ids.length - 1]].rarity)).toBeGreaterThanOrEqual(floor);
      }
    }
    const obsidian = openPack("moon-fox", "obsidian", rand);
    expect(CARD_BY_ID[obsidian[obsidian.length - 1]].rarity).toBe("Legendary");
  });
  it("roughly matches the published drop rates", () => {
    const rand = seeded(1234);
    const tier = TIERS.find((t) => t.id === "paper")!;
    const n = 20_000;
    const hits: Record<string, number> = {};
    for (let i = 0; i < n; i++) {
      const [id] = openPack("ember-shrine", "paper", rand);
      hits[CARD_BY_ID[id].rarity] = (hits[CARD_BY_ID[id].rarity] ?? 0) + 1;
    }
    const odds = rarityOdds(tier);
    for (const r of RARITY_ORDER) expect((hits[r] ?? 0) / n).toBeCloseTo(odds[r], 1);
  });
  it("rejects unknown packs and tiers", () => {
    expect(() => openPack("nope", "paper", Math.random)).toThrow();
    // @ts-expect-error invalid tier on purpose
    expect(() => openPack("void-gate", "diamond", Math.random)).toThrow();
  });
});
