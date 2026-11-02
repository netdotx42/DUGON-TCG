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
  /** Pack slug for cards that come from booster packs (ids 11+). Undefined for the original 10. */
  pack?: string;
}

export const KEYWORD_TEXT: Record<Keyword, string> = {
  Guard: "Enemies must attack Guard units first.",
  Swift: "Can attack the turn it is summoned.",
  Leech: "Damage this unit deals heals your hero.",
};

/** The original ten cards (starter pack + XP awakenings). */
export const ORIGIN_CARDS: CardDef[] = [
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

type PackCardRow = [name: string, jp: string, cost: number, attack: number, hp: number, keyword: Keyword | null, sprite: string, flavor: string];

/** Every pack holds six cards in this rarity order. */
export const PACK_RARITY_SLOTS: Rarity[] = ["Common", "Common", "Uncommon", "Rare", "Epic", "Legendary"];

/**
 * The 15 booster pack sets: 90 original cards, token ids 11..100.
 * Ids are assigned in order: pack n (0-based) holds ids 11 + 6n .. 16 + 6n.
 */
export const PACK_SETS: { slug: string; cards: PackCardRow[] }[] = [
  { slug: "ember-shrine", cards: [
    ["Cinder Pup", "燠犬", 1, 2, 1, null, "cinderPup", "Fetches coals. Drops them on your floor."],
    ["Torii Ember", "鳥居火", 2, 1, 4, "Guard", "toriiEmber", "A gate that refuses to finish burning."],
    ["Hearth Oni", "炉鬼", 2, 3, 2, null, "hearthOni", "Keeps the shrine fire, and the offerings."],
    ["Pyre Priestess", "火巫女", 3, 2, 3, "Leech", "pyrePriestess", "Every prayer she says ends in sparks."],
    ["Blaze Wheel", "火車輪", 4, 4, 3, "Swift", "blazeWheel", "Rolls down the shrine steps at midnight."],
    ["Homura, Shrine Flame", "焔", 5, 6, 5, null, "homura", "The shrine burned down. She stayed."],
  ] },
  { slug: "tide-hollow", cards: [
    ["Bell Crab", "鐘蟹", 1, 1, 2, "Guard", "bellCrab", "Wears a sunken temple bell for a shell."],
    ["Drowned Lamp", "水灯", 1, 2, 1, "Swift", "drownedLamp", "Floats ashore on the last night of summer."],
    ["Kelp Oni", "藻鬼", 3, 3, 4, null, "kelpOni", "Pulls the fishing boats down by their nets."],
    ["Pearl Diver", "真珠海女", 3, 2, 3, "Leech", "pearlDiver", "She surfaces once a year to breathe."],
    ["Whirlpool Serpent", "渦蛇", 4, 5, 4, null, "whirlpoolSerpent", "The tide turns wherever it coils."],
    ["Kaimon, Tide Giant", "海門", 5, 4, 7, "Guard", "kaimon", "A shadow taller than any mast."],
  ] },
  { slug: "cedar-peaks", cards: [
    ["Pine Sprite", "松精", 1, 1, 2, null, "pineSprite", "Counts its needles, loses count, starts over."],
    ["Rock Hopper", "岩跳", 2, 3, 1, "Swift", "rockHopper", "Never once touched the same ledge twice."],
    ["Pilgrim Ghost", "山伏霊", 3, 2, 5, "Guard", "yamabushiGhost", "Still walking the route he died on."],
    ["Gale Fan Tengu", "風扇天狗", 3, 3, 2, "Swift", "galeFanTengu", "One wave of the leaf fan, one fallen cedar."],
    ["Long-Nose Elder", "鼻高翁", 4, 4, 4, "Leech", "longNoseElder", "Teaches swordplay to anyone who climbs that high."],
    ["Takane, Summit King", "高嶺", 5, 5, 5, "Swift", "takane", "The clouds part when he lands."],
  ] },
  { slug: "lantern-night", cards: [
    ["Moth Wisp", "蛾灯", 1, 1, 2, "Swift", "mothWisp", "Drawn to every flame but its own."],
    ["Paper Umbrella", "傘化", 2, 2, 2, "Swift", "paperUmbrella", "Hops one step behind you, all the way home."],
    ["Festival Mask Imp", "祭面鬼", 2, 2, 3, null, "festivalMaskImp", "Wins every game at the stalls. Nobody knows how."],
    ["Candle Nun", "蝋尼", 3, 2, 4, "Leech", "candleNun", "Her vigil lasts as long as the wax."],
    ["Hundred Lights", "百灯", 4, 3, 6, "Guard", "hundredLights", "Every lantern is an eye, and all are open."],
    ["Akari, Lantern Queen", "灯女王", 5, 5, 5, "Leech", "akari", "The festival ends when she says it does."],
  ] },
  { slug: "bamboo-veil", cards: [
    ["Shoot Imp", "筍鬼", 1, 1, 2, null, "shootImp", "Grows a hand's width every night."],
    ["Grove Cutter", "伐竹", 2, 3, 2, null, "groveCutter", "The axe still swings after the woodsman left."],
    ["Leaf Mantis", "葉蟷", 2, 3, 1, "Swift", "leafMantis", "Looks like a leaf until the leaf strikes."],
    ["Hollow Hermit", "空竹仙", 3, 1, 6, "Guard", "hollowHermit", "Lives inside a single stalk. Will not come out."],
    ["Green Serpent", "青大将", 4, 4, 4, "Leech", "greenSerpent", "Sheds a skin for every traveller it swallows."],
    ["Sasara, Bamboo Lord", "笹羅", 5, 6, 6, null, "sasara", "The whole grove bends when he breathes."],
  ] },
  { slug: "iron-forge", cards: [
    ["Anvil Imp", "鉄床鬼", 1, 1, 2, "Guard", "anvilImp", "Takes every hammer blow and asks for more."],
    ["Bellows Toad", "鞴蛙", 2, 2, 3, null, "bellowsToad", "One croak and the furnace roars."],
    ["Tongs Oni", "鋏鬼", 3, 4, 3, null, "tongsOni", "Pulls red iron from the coals bare-handed."],
    ["Blade Spirit", "刀霊", 3, 3, 2, "Swift", "bladeSmith", "A sword so sharp it cut itself free of its smith."],
    ["Slag Golem", "鉱滓像", 4, 3, 7, "Guard", "slagGolem", "Built from everything the forge threw away."],
    ["Tetsuo, Forge Father", "鉄翁", 5, 5, 5, "Leech", "tetsuo", "Every oni blade was first his idea."],
  ] },
  { slug: "thunder-drum", cards: [
    ["Spark Imp", "火花鬼", 1, 2, 1, "Swift", "sparkImp", "Arrives a second before the thunder."],
    ["Drum Hare", "鼓兎", 2, 2, 3, null, "drumHare", "Keeps time for the storm."],
    ["Storm Crow", "嵐烏", 3, 3, 3, "Swift", "stormCrow", "Rides the front edge of every squall."],
    ["Bolt Weasel", "雷鼬", 3, 4, 2, "Swift", "boltWeasel", "Falls from the sky with the lightning."],
    ["Cloud Drummer", "雲鼓手", 4, 5, 4, null, "cloudDrummer", "Plays the same song every monsoon."],
    ["Ikazuchi, Storm Lord", "雷主", 5, 7, 4, "Swift", "ikazuchi", "When he strikes, the mountain answers."],
  ] },
  { slug: "bone-garden", cards: [
    ["Skull Moth", "髑蛾", 1, 1, 2, "Leech", "skullMoth", "Feeds on the last breath left in a room."],
    ["Grave Lantern", "墓灯", 2, 1, 4, "Guard", "graveLantern", "Its flame is cold to the touch."],
    ["Rib Crawler", "肋這", 2, 3, 2, null, "ribCrawler", "Scuttles between the graves on borrowed bones."],
    ["Ash Widow", "灰寡", 3, 3, 3, "Leech", "ashWidow", "Still waits at the gate in mourning grey."],
    ["Ossuary Giant", "骨巨人", 4, 4, 6, "Guard", "ossuaryGiant", "Built of a thousand bones, and all of them remember."],
    ["Shirahone, Bone Empress", "白骨", 5, 5, 6, "Leech", "shirahone", "Her garden grows nothing but white."],
  ] },
  { slug: "moon-fox", cards: [
    ["Kit Flame", "狐火子", 1, 2, 1, "Swift", "kitFlame", "Its tail lights the field after dark."],
    ["Rice Fox", "稲狐", 2, 2, 3, null, "riceFox", "Guards the harvest. Takes a share."],
    ["Twin-Tail Trickster", "二尾", 3, 3, 2, "Swift", "twinTail", "Two tails, two faces, no honest answers."],
    ["Moon Priest Fox", "月神官", 3, 2, 4, "Leech", "moonPriestFox", "Tends a shrine no human has ever found."],
    ["Seven-Tail Sage", "七尾", 4, 4, 4, "Swift", "sevenTail", "Each tail took a hundred years to grow."],
    ["Tsukiko, Nine-Moon Fox", "月狐", 5, 6, 5, "Swift", "tsukiko", "She casts her shadow on the moon."],
  ] },
  { slug: "frost-gate", cards: [
    ["Snow Mite", "雪虫", 1, 1, 2, null, "snowMite", "Arrives a week before the first snow."],
    ["Icicle Imp", "氷柱鬼", 2, 3, 1, "Swift", "icicleImp", "Drops from the eaves without a sound."],
    ["Frozen Monk", "凍僧", 3, 2, 5, "Guard", "frozenMonk", "Meditated through one winter too many."],
    ["White Breath Maiden", "白息女", 3, 3, 3, "Leech", "whiteBreathMaiden", "One sigh, and the lantern freezes."],
    ["Glacier Oni", "氷河鬼", 4, 4, 6, "Guard", "glacierOni", "Moves a step every hundred years."],
    ["Fubuki, Winter Gate", "吹雪", 5, 5, 6, "Guard", "fubuki", "No traveller passes until spring."],
  ] },
  { slug: "mist-marsh", cards: [
    ["Bog Frog", "沼蛙", 1, 1, 2, "Guard", "bogFrog", "Sits on the path and dares you to step around it."],
    ["Reed Wisp", "葦火", 2, 2, 2, "Swift", "reedWisp", "Leads travellers off the boardwalk."],
    ["Mud Oni", "泥鬼", 3, 3, 4, null, "mudOni", "Rises when the rice fields flood."],
    ["Heron Ghost", "鷺霊", 3, 3, 2, "Swift", "heronGhost", "Stands on one leg for a century."],
    ["Marsh Mother", "沼母", 4, 3, 6, "Leech", "marshMother", "Every lost thing sinks into her arms."],
    ["Kirisame, Mist Dragon", "霧雨", 5, 6, 6, null, "kirisame", "The fog is only her breath."],
  ] },
  { slug: "silk-spider", cards: [
    ["Thread Mite", "糸虫", 1, 1, 2, "Leech", "threadMite", "Lowers itself onto sleeping guests."],
    ["Cocoon Doll", "繭人形", 2, 1, 4, "Guard", "cocoonDoll", "Something inside is almost ready."],
    ["Loom Spider", "機蜘", 3, 3, 4, null, "loomSpider", "Weaves a bolt of silk every night, and a trap."],
    ["Web Weaver", "織女蜘", 3, 2, 4, "Leech", "webWeaver", "Its web catches dreams as well as flies."],
    ["Silk Widow", "絹寡婦", 4, 5, 3, "Swift", "silkWidow", "Marked in red, as a warning nobody heeds."],
    ["Itohime, Silk Princess", "糸姫", 5, 5, 6, "Leech", "itohime", "Every thread in the castle answers to her."],
  ] },
  { slug: "ink-scroll", cards: [
    ["Ink Blot", "墨滴", 1, 2, 1, "Swift", "inkBlot", "A mistake that ran away from the page."],
    ["Brush Imp", "筆鬼", 2, 2, 3, null, "brushImp", "Writes its own name on everything."],
    ["Scroll Snake", "巻蛇", 3, 3, 3, "Swift", "scrollSnake", "Unrolls to strike, rolls up to hide."],
    ["Seal Golem", "印像", 3, 1, 6, "Guard", "sealGolem", "Stamps 'denied' on all who approach."],
    ["Living Glyph", "生字", 4, 5, 4, null, "livingKanji", "A word written so well it stood up."],
    ["Sumie, Ink Sage", "墨絵", 5, 5, 5, "Swift", "sumie", "Paints a demon, and the demon walks."],
  ] },
  { slug: "mask-theatre", cards: [
    ["Fan Dancer Imp", "扇鬼", 1, 2, 1, "Swift", "fanDancer", "Never misses a cue, or a pocket."],
    ["Blank Mask", "無面", 2, 2, 3, null, "blankMask", "Becomes whoever wore it last."],
    ["Grinning Mask", "笑面", 3, 3, 4, null, "grinningMask", "The smile is painted on. The teeth are not."],
    ["Weeping Mask", "泣面", 3, 2, 4, "Leech", "weepingMask", "The audience cries with it, and grows weak."],
    ["Horned Mask Dancer", "角面舞", 4, 5, 3, "Swift", "hornedMaskDancer", "The dance ends when the mask comes off."],
    ["Kagura, Mask Lord", "神楽", 5, 5, 6, "Guard", "kagura", "Owns every face on the stage."],
  ] },
  { slug: "void-gate", cards: [
    ["Hollow Eye", "虚眼", 1, 1, 2, null, "hollowEye", "It does not blink. It does not need to."],
    ["Shadow Hand", "影手", 2, 3, 2, null, "shadowHand", "Reaches up through floors that are not there."],
    ["Eclipse Crow", "蝕烏", 3, 3, 2, "Swift", "eclipseCrow", "Carries the sun away in its beak."],
    ["Gate Keeper", "門番", 3, 2, 5, "Guard", "gateKeeper", "Asks one question. Nobody has answered it."],
    ["Night Devourer", "夜喰", 4, 4, 4, "Leech", "nightDevourer", "Eats the stars one at a time."],
    ["Kokuu, the Void Oni", "虚空", 5, 6, 6, "Leech", "kokuu", "Behind the last gate, there is only him."],
  ] },
];

export const PACK_CARD_FIRST_ID = 11;

export const PACK_CARDS: CardDef[] = PACK_SETS.flatMap((set, p) =>
  set.cards.map(([name, jp, cost, attack, hp, keyword, sprite, flavor], i) => ({
    id: PACK_CARD_FIRST_ID + p * 6 + i,
    name,
    jp,
    cost,
    attack,
    hp,
    rarity: PACK_RARITY_SLOTS[i],
    ...(keyword ? { keyword } : {}),
    sprite,
    flavor,
    pack: set.slug,
  })),
);

/** Every card in the game: the original ten followed by the 90 pack cards. */
export const CARDS: CardDef[] = [...ORIGIN_CARDS, ...PACK_CARDS];

export const CARD_BY_ID: Record<number, CardDef> = Object.fromEntries(CARDS.map((c) => [c.id, c]));

/** Token ids minted by the starter pack (on-chain and simulated). */
export const STARTER_IDS = [1, 2, 3, 4, 5] as const;

/** XP needed to unlock each non-starter card (cards 6..10). */
export const UNLOCK_XP: Record<number, number> = { 6: 100, 7: 200, 8: 350, 9: 500, 10: 700 };

export const DECK_SIZE = 5;

export function isValidCardId(id: unknown): id is number {
  return typeof id === "number" && Number.isInteger(id) && id in CARD_BY_ID;
}

/** Cards a player may use given their claim status, XP and any cards pulled from packs. */
export function unlockedCardIds(claimed: boolean, xp: number, owned: Record<string, number> = {}): number[] {
  if (!claimed) return [];
  return CARDS.filter(
    (c) => (STARTER_IDS as readonly number[]).includes(c.id) || (UNLOCK_XP[c.id] ?? Infinity) <= xp || (owned[c.id] ?? 0) > 0,
  ).map((c) => c.id);
}

/** The set a card belongs to for Pack Bond: its booster pack, or "origin" for the first ten cards. */
export function cardSet(cardId: number): string {
  return CARD_BY_ID[cardId]?.pack ?? "origin";
}

/** How many cards in a deck share a set with at least one other card in it (can trigger Pack Bond). */
export function bondedCount(deck: number[]): number {
  const counts = new Map<string, number>();
  for (const id of deck) counts.set(cardSet(id), (counts.get(cardSet(id)) ?? 0) + 1);
  return deck.filter((id) => (counts.get(cardSet(id)) ?? 0) >= 2).length;
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
