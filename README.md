# DUGON TCG 鬼

A minimalist dark-fantasy trading card game with white pixel-art oni on a black field.
This repository is a **testnet-only PvE demo** for Solana Devnet and Base Sepolia.

> No payments, no token economy, no marketplace, no bridging, no mainnet transactions.
> Simulated claims are clearly labelled **SIMULATED · DEMO ONLY** in the UI.

## What's in the demo

| Screen | What happens |
| --- | --- |
| **Home** | Oni-mask logo, featured cards, how it works |
| **Connect** | Phantom (Solana Devnet) or MetaMask (Base Sepolia). Guest mode for people without a wallet (simulated) |
| **Claim** | Free 5-card starter pack, once per wallet. Real ERC-1155 mint on Base Sepolia when a contract is configured, otherwise a server-verified signature + simulated claim |
| **Collection** | All 100 cards, filterable by set: the 10 origin cards (6–10 awaken with XP) plus the 15 pack sets |
| **Packs** | Spend embers to open booster packs from any of 15 sets, at one of 5 tiers with published drop rates |
| **Deck** | Pick exactly 5 different cards from the origin set and anything you've pulled from packs |
| **Battle** | Turn-based PvE vs. the Oni Bot. Every action is validated on the server |
| **Results** | Victory / defeat / draw, XP earned, newly awakened cards, Play again |

### Rules

- Both heroes start at **20 HP**. Decks are **5 cards**. You start with 2 cards and draw 1 each turn (hand max 5).
- Energy is **1 in round 1 and grows by 1 per round up to 5**, refilling every turn.
- Summon a unit by paying its cost (max 4 on board). Units can attack the turn **after** they are summoned.
- A unit attacks once per turn: an enemy unit (both deal damage) or the enemy hero.
- Keywords: **Guard** (must be attacked first), **Swift** (can attack immediately), **Leech** (damage dealt heals your hero).
- Fallen units go to the graveyard and are reshuffled into an empty deck.
- First hero to 0 HP loses. After **15 rounds** the hero with more HP wins (equal HP is a draw).
- XP: win 100 (+5 per round left), draw 40, loss 25. Unlocks at 100 / 200 / 350 / 500 / 700 XP.

### The cards (original art, `lib/sprites.ts`)

| # | Card | Cost | ATK | HP | Rarity | Keyword |
|---|---|---|---|---|---|---|
| 1 | Ash Imp 灰鬼 | 1 | 1 | 2 | Common | |
| 2 | Lantern Wisp 提灯火 | 1 | 2 | 1 | Common | Swift |
| 3 | Moss Warden 苔守 | 2 | 1 | 4 | Common | Guard |
| 4 | Red Oni Brawler 赤鬼 | 2 | 3 | 2 | Uncommon | |
| 5 | Blue Oni Sentinel 青鬼 | 3 | 2 | 5 | Uncommon | Guard |
| 6 | Fox Shade 狐影 | 3 | 3 | 2 | Rare | Swift |
| 7 | Bone Monk 骨僧 | 3 | 2 | 3 | Rare | Leech |
| 8 | Crow Tengu 烏天狗 | 4 | 4 | 3 | Epic | Swift |
| 9 | Thunder Oni 雷鬼 | 4 | 5 | 3 | Epic | |
| 10 | Kurogane, Iron Oni 黒鉄 | 5 | 5 | 6 | Legendary | Guard |

Cards 1–5 are the starter pack (ERC-1155 token ids 1–5).

### Card packs and tiers (`lib/packs.ts`)

90 more original cards (token ids 11–100) come in **15 themed sets of 6**: two Commons, then one each of Uncommon, Rare, Epic and Legendary. All card stats and names live in `PACK_SETS` in `lib/cards.ts`, and the art is in `lib/sprites.ts`.

| Set | | Theme |
| --- | --- | --- |
| Ember Shrine | 焔社 | shrine fire spirits |
| Tide Hollow | 潮洞 | sea-cave spirits |
| Cedar Peaks | 杉嶺 | mountain tengu and pilgrims |
| Lantern Night | 提灯夜 | festival lanterns |
| Bamboo Veil | 竹帳 | bamboo grove |
| Iron Forge | 鉄工 | oni smithy |
| Thunder Drum | 雷鼓 | storm spirits |
| Bone Garden | 骨庭 | temple graveyard |
| Moon Fox | 月狐 | fox spirits |
| Frost Gate | 霜門 | winter spirits |
| Mist Marsh | 霧沼 | marsh lights |
| Silk Spider | 絹蜘 | weavers |
| Ink Scroll | 墨巻 | living calligraphy |
| Mask Theatre | 面舞 | stage masks |
| Void Gate | 虚門 | the last gate |

Packs cost **embers**. Every profile starts with 160, and each battle pays 1 ember per XP earned. A card you already own refunds embers (Common 5, Uncommon 10, Rare 20, Epic 40, Legendary 80).

| Tier | Cards | Price | Unlocks at | Guarantee (last card) | Common / Uncommon / Rare / Epic / Legendary per slot |
| --- | --- | --- | --- | --- | --- |
| Paper 紙 | 3 | 40 | 0 XP | none | 60 / 25 / 10 / 4 / 1 % |
| Bronze 銅 | 4 | 80 | 0 XP | Uncommon+ | 50 / 30 / 13 / 5 / 2 % |
| Silver 銀 | 5 | 150 | 150 XP | Rare+ | 40 / 30 / 20 / 7 / 3 % |
| Gold 金 | 5 | 300 | 350 XP | Epic+ | 25 / 30 / 25 / 15 / 5 % |
| Obsidian 黒曜 | 5 | 600 | 700 XP | Legendary | 10 / 25 / 30 / 25 / 10 % |

Pack pulls are **off-chain and simulated** (browser storage, `crypto.getRandomValues`). The ERC-1155 metadata and art for ids 11–100 are generated, but the contract still only mints the starter pack.

## Tech stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS, API routes for the backend
- **wagmi 3 / viem** (MetaMask via the injected connector, Base Sepolia only)
- **Solana Wallet Adapter** (Phantom) + `tweetnacl` for server-side signature verification
- **Solidity 0.8.24 + OpenZeppelin 5** ERC-1155, Hardhat for tests and deployment
- Storage: `localStorage` (profile, XP, deck) and a local JSON file for simulated claims

## Project layout

```
app/                    pages (home, connect, claim, collection, packs, deck, battle, results)
app/api/auth/challenge  issues a signed sign-in message (nonce, expiry)
app/api/claim           verifies a wallet signature, records a SIMULATED claim
app/api/battle/start    validates the deck, creates a sealed battle
app/api/battle/action   validates a player action, runs the bot turn
lib/cards.ts            card definitions (origin + 15 pack sets), deck validation, unlocks
lib/packs.ts            pack sets, tiers, drop rates, pack opening
lib/game/engine.ts      pure rules engine (shared by server and tests)
lib/game/bot.ts         Oni Bot AI (only legal moves)
lib/server/*            sealed battle tokens, wallet signature checks, claim store
contracts/              Hardhat project: DugonStarterCards.sol, tests, deploy script
tests/                  Vitest gameplay + server tests
scripts/generate-assets.mts  card SVGs, pack covers + ERC-1155 metadata into public/
SECURITY_AUDIT.md       security review: findings and fixes
```

## Run locally

Requires Node 22+.

```bash
npm install
cp .env.example .env.local      # set GAME_SECRET (openssl rand -hex 32)
npm run dev                     # http://localhost:3000
```

Without wallets you can play everything in **guest mode**. With Phantom, switch the wallet to Devnet
in its developer / testnet settings (sign-in only uses a message signature, so no SOL is needed). With MetaMask the app will ask to add/switch to
Base Sepolia (chain id 84532).

### Tests

```bash
npm test                 # gameplay engine, bot, signature verification, battle API (Vitest)
npm run test:contracts   # ERC-1155 contract tests (Hardhat)  — run `npm install` in contracts/ first
npm run lint && npm run typecheck && npm run build
```

## Deploy the Base Sepolia contract

You need a **throwaway testnet key** with a little Base Sepolia ETH
(from a Base Sepolia faucet). Never use a key that holds real funds.

```bash
cd contracts
npm install
cp .env.example .env      # set DEPLOYER_PRIVATE_KEY, optionally BASESCAN_API_KEY
npm test
npm run deploy:base-sepolia
```

The script refuses to deploy to any chain other than Base Sepolia (84532) or the local Hardhat
network. It prints the contract address and the next steps:

1. Set `NEXT_PUBLIC_DUGON_CONTRACT_ADDRESS=<address>` in `.env.local` / Vercel.
2. Optional: verify on Basescan with `npm run verify:base-sepolia -- <address> "<baseUri>" <owner>`.

Once the address is set, the Claim screen on Base switches from simulated mode to a real
`claimStarter()` mint, shows the transaction hash with a Basescan link, and the contract rejects a
second claim from the same address.

Token metadata is served from `public/metadata/{id}.json`. Set `CARD_METADATA_BASE_URI` to
`https://<your-domain>/metadata/` before deploying (or call `setBaseURI` later as the owner), and
regenerate metadata with `PUBLIC_BASE_URL=https://<your-domain> npm run assets`.

## Deploy the web app to Vercel

1. Import the repository in Vercel (framework preset: Next.js, root directory: repo root).
2. Environment variables:
   - `GAME_SECRET` (**required**; the app refuses to run battles in Vercel production without it)
   - `NEXT_PUBLIC_DUGON_CONTRACT_ADDRESS` (optional, enables real Base Sepolia minting)
   - `NEXT_PUBLIC_BASE_SEPOLIA_RPC`, `NEXT_PUBLIC_SOLANA_RPC` (optional)
3. Deploy. Or from the CLI: `npx vercel --prod`.

Demo-grade storage note: simulated claims are written to `/tmp` on Vercel, which is per-instance and
ephemeral. Player progress (XP, deck) lives in the browser. See `SECURITY_AUDIT.md` for what to
change before anything beyond a demo.

## Simulated vs. on-chain

| Network | Wallet connect | Signature verified server-side | Starter cards |
| --- | --- | --- | --- |
| Solana Devnet | Phantom | yes (ed25519) | **simulated** (demo only) |
| Base Sepolia, contract configured | MetaMask | n/a (on-chain tx) | **real ERC-1155 mint**, one per address |
| Base Sepolia, no contract | MetaMask | yes (EIP-191) | **simulated** (demo only) |
| Guest | none | no | **simulated**, browser only |
