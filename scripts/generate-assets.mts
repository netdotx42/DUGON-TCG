// Generates public/icon.svg, public/cards/{id}.svg, ERC-1155 metadata public/metadata/{id}.json and pack covers public/packs/{slug}.svg
// Run: node scripts/generate-assets.mts   (Node 22.18+ strips TypeScript types natively)
import { mkdirSync, writeFileSync } from "node:fs";
import { SPRITES, expandSprite } from "../lib/sprites.ts";
import { CARDS } from "../lib/cards.ts";

const FILL: Record<string, string> = { "#": "#f5f5f0", "+": "#8a8a85", r: "#c8102e" };

function svg(name: string, pad = 2) {
  const rows = expandSprite(SPRITES[name]);
  const n = 16 + pad * 2;
  let rects = "";
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch !== ".") rects += `<rect x="${x + pad}" y="${y + pad}" width="1" height="1" fill="${FILL[ch]}"/>`;
    }),
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges"><rect width="${n}" height="${n}" fill="#000"/>${rects}</svg>\n`;
}

const base = process.env.PUBLIC_BASE_URL || "https://dugon-tcg.vercel.app";
mkdirSync("public/cards", { recursive: true });
mkdirSync("public/metadata", { recursive: true });
writeFileSync("public/icon.svg", svg("logo", 1));
for (const c of CARDS) {
  writeFileSync(`public/cards/${c.id}.svg`, svg(c.sprite));
  const meta = {
    name: `${c.name} (${c.jp})`,
    description: `${c.flavor} DUGON TCG testnet demo card — no monetary value.`,
    image: `${base}/cards/${c.id}.svg`,
    attributes: [
      { trait_type: "Rarity", value: c.rarity },
      { trait_type: "Set", value: c.pack ?? "origin" },
      { trait_type: "Cost", value: c.cost, display_type: "number" },
      { trait_type: "Attack", value: c.attack, display_type: "number" },
      { trait_type: "HP", value: c.hp, display_type: "number" },
      ...(c.keyword ? [{ trait_type: "Keyword", value: c.keyword }] : []),
    ],
  };
  writeFileSync(`public/metadata/${c.id}.json`, JSON.stringify(meta, null, 2) + "\n");
}

// Booster pack covers: the set's Legendary on a crimped, framed wrapper (one per set).
function packSvg(sprite: string) {
  const rows = expandSprite(SPRITES[sprite]);
  let rects = "";
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch !== ".") rects += `<rect x="${x + 4}" y="${y + 6}" width="1" height="1" fill="${FILL[ch]}"/>`;
    }),
  );
  let crimp = "";
  for (let x = 0; x < 24; x += 2) crimp += `<rect x="${x}" y="0" width="1" height="1" fill="#2a2a28"/><rect x="${x + 1}" y="31" width="1" height="1" fill="#2a2a28"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" shape-rendering="crispEdges"><rect width="24" height="32" fill="#000"/>${crimp}<rect x="1" y="2" width="22" height="28" fill="none" stroke="#f5f5f0" stroke-width="0.5"/><rect x="3" y="25" width="18" height="1" fill="#c8102e"/>${rects}</svg>\n`;
}
mkdirSync("public/packs", { recursive: true });
const packSlugs = [...new Set(CARDS.filter((c) => c.pack).map((c) => c.pack!))];
for (const slug of packSlugs) {
  const legendary = CARDS.find((c) => c.pack === slug && c.rarity === "Legendary")!;
  writeFileSync(`public/packs/${slug}.svg`, packSvg(legendary.sprite));
}
console.log(`Generated icon, ${CARDS.length} card SVGs and metadata, ${packSlugs.length} pack covers (base ${base}).`);
