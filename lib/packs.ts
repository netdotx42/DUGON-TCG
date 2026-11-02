import { CARD_BY_ID, PACK_CARDS, PACK_SETS, Rarity } from "./cards";

/** Rarities from lowest to highest. */
export const RARITY_ORDER: Rarity[] = ["Common", "Uncommon", "Rare", "Epic", "Legendary"];

export interface PackDef {
  slug: string;
  name: string;
  jp: string;
  blurb: string;
  /** Sprite used as the pack's cover art (its Legendary). */
  cover: string;
  cardIds: number[];
}

const PACK_INFO: Record<string, { name: string; jp: string; blurb: string }> = {
  "ember-shrine": { name: "Ember Shrine", jp: "焔社", blurb: "Fire spirits of a shrine that never stopped burning." },
  "tide-hollow": { name: "Tide Hollow", jp: "潮洞", blurb: "Things that wash up in the sea caves after a storm." },
  "cedar-peaks": { name: "Cedar Peaks", jp: "杉嶺", blurb: "Mountain tengu and the pilgrims who never came down." },
  "lantern-night": { name: "Lantern Night", jp: "提灯夜", blurb: "The festival crowd, once the humans have gone home." },
  "bamboo-veil": { name: "Bamboo Veil", jp: "竹帳", blurb: "A grove so dense that nothing inside has seen the sun." },
  "iron-forge": { name: "Iron Forge", jp: "鉄工", blurb: "The smithy where oni clubs and blades are born." },
  "thunder-drum": { name: "Thunder Drum", jp: "雷鼓", blurb: "Storm spirits who beat the sky like a drum." },
  "bone-garden": { name: "Bone Garden", jp: "骨庭", blurb: "A temple graveyard where the residents keep busy." },
  "moon-fox": { name: "Moon Fox", jp: "月狐", blurb: "Fox spirits who gain a tail with every hundred years." },
  "frost-gate": { name: "Frost Gate", jp: "霜門", blurb: "Winter spirits that close the mountain passes." },
  "mist-marsh": { name: "Mist Marsh", jp: "霧沼", blurb: "Lost lights and patient things in the flooded fields." },
  "silk-spider": { name: "Silk Spider", jp: "絹蜘", blurb: "Weavers whose threads hold up an entire castle." },
  "ink-scroll": { name: "Ink Scroll", jp: "墨巻", blurb: "Brush strokes so alive they climbed off the page." },
  "mask-theatre": { name: "Mask Theatre", jp: "面舞", blurb: "A stage where the masks outlived the actors." },
  "void-gate": { name: "Void Gate", jp: "虚門", blurb: "The last gate, and whatever waits behind it." },
};

export const PACKS: PackDef[] = PACK_SETS.map((set) => {
  const cardIds = PACK_CARDS.filter((c) => c.pack === set.slug).map((c) => c.id);
  const legendary = cardIds.map((id) => CARD_BY_ID[id]).find((c) => c.rarity === "Legendary")!;
  return { slug: set.slug, ...PACK_INFO[set.slug], cover: legendary.sprite, cardIds };
});

export const PACK_BY_SLUG: Record<string, PackDef> = Object.fromEntries(PACKS.map((p) => [p.slug, p]));

export type TierId = "paper" | "bronze" | "silver" | "gold" | "obsidian";

export interface TierDef {
  id: TierId;
  name: string;
  jp: string;
  /** Cards in one pack. */
  size: number;
  /** Embers needed to open one pack. */
  price: number;
  /** Lifetime XP needed before this tier can be bought. */
  minXp: number;
  /** Relative drop weight of each rarity for normal slots. */
  weights: Record<Rarity, number>;
  /** The last slot is rolled again until it is at least this rarity. */
  guarantee?: Rarity;
}

export const TIERS: TierDef[] = [
  { id: "paper", name: "Paper", jp: "紙", size: 3, price: 40, minXp: 0, weights: { Common: 60, Uncommon: 25, Rare: 10, Epic: 4, Legendary: 1 } },
  { id: "bronze", name: "Bronze", jp: "銅", size: 4, price: 80, minXp: 0, weights: { Common: 50, Uncommon: 30, Rare: 13, Epic: 5, Legendary: 2 }, guarantee: "Uncommon" },
  { id: "silver", name: "Silver", jp: "銀", size: 5, price: 150, minXp: 150, weights: { Common: 40, Uncommon: 30, Rare: 20, Epic: 7, Legendary: 3 }, guarantee: "Rare" },
  { id: "gold", name: "Gold", jp: "金", size: 5, price: 300, minXp: 350, weights: { Common: 25, Uncommon: 30, Rare: 25, Epic: 15, Legendary: 5 }, guarantee: "Epic" },
  { id: "obsidian", name: "Obsidian", jp: "黒曜", size: 5, price: 600, minXp: 700, weights: { Common: 10, Uncommon: 25, Rare: 30, Epic: 25, Legendary: 10 }, guarantee: "Legendary" },
];

export const TIER_BY_ID: Record<TierId, TierDef> = Object.fromEntries(TIERS.map((t) => [t.id, t])) as Record<TierId, TierDef>;

/** Embers granted when a pull is a card you already own. */
export const DUPLICATE_EMBERS: Record<Rarity, number> = { Common: 5, Uncommon: 10, Rare: 20, Epic: 40, Legendary: 80 };

/** Embers every new profile starts with (enough for a few Paper or Bronze packs). */
export const STARTING_EMBERS = 160;

/** Embers earned for a battle: the same as the XP it awarded. */
export const embersForXp = (xp: number) => Math.max(0, Math.floor(xp));

/** Chance (0..1) of each rarity for a normal slot of a tier. */
export function rarityOdds(tier: TierDef, floor: Rarity = "Common"): Record<Rarity, number> {
  const min = RARITY_ORDER.indexOf(floor);
  const allowed = RARITY_ORDER.filter((_, i) => i >= min);
  const total = allowed.reduce((s, r) => s + tier.weights[r], 0);
  return Object.fromEntries(RARITY_ORDER.map((r) => [r, allowed.includes(r) ? tier.weights[r] / total : 0])) as Record<Rarity, number>;
}

function rollRarity(tier: TierDef, rand: () => number, floor: Rarity = "Common"): Rarity {
  const odds = rarityOdds(tier, floor);
  let x = rand();
  for (const r of RARITY_ORDER) {
    if (odds[r] === 0) continue;
    if (x < odds[r]) return r;
    x -= odds[r];
  }
  return RARITY_ORDER.filter((r) => odds[r] > 0).pop()!; // float rounding guard
}

/**
 * Open one pack. `rand` returns a float in [0, 1). Returns card ids in reveal order
 * (the guaranteed slot is last so the best pull is revealed at the end).
 */
export function openPack(packSlug: string, tierId: TierId, rand: () => number): number[] {
  const pack = PACK_BY_SLUG[packSlug];
  const tier = TIER_BY_ID[tierId];
  if (!pack || !tier) throw new Error("Unknown pack or tier");
  const byRarity = (r: Rarity) => pack.cardIds.filter((id) => CARD_BY_ID[id].rarity === r);
  const pick = (r: Rarity) => {
    const pool = byRarity(r);
    return pool[Math.min(pool.length - 1, Math.floor(rand() * pool.length))];
  };
  const out: number[] = [];
  for (let i = 0; i < tier.size; i++) {
    const last = i === tier.size - 1;
    out.push(pick(rollRarity(tier, rand, last && tier.guarantee ? tier.guarantee : "Common")));
  }
  return out;
}

/** Browser-safe uniform float in [0, 1) backed by crypto.getRandomValues. */
export function cryptoRandom(): number {
  const buf = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buf);
  return buf[0] / 2 ** 32;
}
