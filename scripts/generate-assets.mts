// Generates public/icon.svg, public/cards/{id}.svg and ERC-1155 metadata public/metadata/{id}.json
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
      { trait_type: "Cost", value: c.cost, display_type: "number" },
      { trait_type: "Attack", value: c.attack, display_type: "number" },
      { trait_type: "HP", value: c.hp, display_type: "number" },
      ...(c.keyword ? [{ trait_type: "Keyword", value: c.keyword }] : []),
    ],
  };
  writeFileSync(`public/metadata/${c.id}.json`, JSON.stringify(meta, null, 2) + "\n");
}
console.log(`Generated icon, ${CARDS.length} card SVGs and metadata (base ${base}).`);
