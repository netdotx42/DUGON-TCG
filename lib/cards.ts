export type Rarity = "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";
export type Keyword = "Guard" | "Swift" | "Leech";

export interface CardDef {
  id: number; // also the ERC-1155 token id on Base Sepolia
  name: string;
  jp: string;
  cost: number;
  attack: number;
  hp: number;
  rarity: Rarity;
  keyword?: Keyword;
  sprite: string;
  flavor: string;
}

export const KEYWORD_TEXT: Record<Keyword, string> = {
  Guard: "Enemies must attack Guard units first.",
  Swift: "Can attack the turn it is summoned.",
  Leech: "Damage this unit deals heals your hero.",
};

export const CARDS: CardDef[] = [
  { id: 1, name: "Ash Imp", jp: "灰鬼", cost: 1, attack: 1, hp: 2, rarity: "Common", sprite: "ashImp", flavor: "Born from the last ember of a burnt shrine." },
  { id: 2, name: "Lantern Wisp", jp: "提灯火", cost: 1, attack: 2, hp: 1, rarity: "Common", keyword: "Swift", sprite: "lanternWisp", flavor: "It lights the road. Never the way home." },
  { id: 3, name: "Moss Warden", jp: "苔守", cost: 2, attack: 1, hp: 4, rarity: "Common", keyword: "Guard", sprite: "mossWarden", flavor: "A gate-stone that remembers every traveller." },
  { id: 4, name: "Red Oni Brawler", jp: "赤鬼", cost: 2, attack: 3, hp: 2, rarity: "Uncommon", sprite: "redOni", flavor: "Settles every argument with an iron club." },
  { id: 5, name: "Blue Oni Sentinel", jp: "青鬼", cost: 3, attack: 2, hp: 5, rarity: "Uncommon", keyword: "Guard", sprite: "blueOni", flavor: "Patient as winter. Twice as cold." },
  { id: 6, name: "Fox Shade", jp: "狐影", cost: 3, attack: 3, hp: 2, rarity: "Rare", keyword: "Swift", sprite: "foxShade", flavor: "You saw it once. That was already too late." },
  { id: 7, name: "Bone Monk", jp: "骨僧", cost: 3, attack: 2, hp: 3, rarity: "Rare", keyword: "Leech", sprite: "boneMonk", flavor: "Still counting beads for a prayer no one hears." },
  { id: 8, name: "Crow Tengu", jp: "烏天狗", cost: 4, attack: 4, hp: 3, rarity: "Epic", keyword: "Swift", sprite: "crowTengu", flavor: "Descends from the cedar peaks with the storm." },
  { id: 9, name: "Thunder Oni", jp: "雷鬼", cost: 4, attack: 5, hp: 3, rarity: "Epic", sprite: "thunderOni", flavor: "Each drumbeat splits a mountain." },
  { id: 10, name: "Kurogane, Iron Oni", jp: "黒鉄", cost: 5, attack: 5, hp: 6, rarity: "Legendary", keyword: "Guard", sprite: "kurogane", flavor: "The forge-lord who wears the night as armour." },
];

export const CARD_BY_ID: Record<number, CardDef> = Object.fromEntries(CARDS.map((c) => [c.id, c]));

/** Token ids minted by the starter pack (on-chain and simulated). */
export const STARTER_IDS = [1, 2, 3, 4, 5] as const;

/** XP needed to unlock each non-starter card (cards 6..10). */
export const UNLOCK_XP: Record<number, number> = { 6: 100, 7: 200, 8: 350, 9: 500, 10: 700 };

export const DECK_SIZE = 5;

export function isValidCardId(id: unknown): id is number {
  return typeof id === "number" && Number.isInteger(id) && id in CARD_BY_ID;
}

/** Cards a player may use given their claim status and XP. */
export function unlockedCardIds(claimed: boolean, xp: number): number[] {
  if (!claimed) return [];
  return CARDS.filter((c) => (STARTER_IDS as readonly number[]).includes(c.id) || (UNLOCK_XP[c.id] ?? Infinity) <= xp).map((c) => c.id);
}

/** A deck is exactly 5 distinct, valid card ids. */
export function validateDeck(deck: unknown): deck is number[] {
  return (
    Array.isArray(deck) &&
    deck.length === DECK_SIZE &&
    deck.every(isValidCardId) &&
    new Set(deck).size === DECK_SIZE
  );
}
