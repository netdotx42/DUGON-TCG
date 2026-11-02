# DUGON TCG — Security Review (MVP, testnet demo)

**Scope:** Next.js app (`app/`, `lib/`), API routes, wallet integrations, `contracts/DugonStarterCards.sol`, deploy script, dependencies.
**Date:** 2026-11-02 · **Networks:** Solana Devnet, Base Sepolia only.
**Method:** manual review of every route and the contract, plus automated tests that exercise the fixes
(`tests/server.test.ts`, `tests/engine.test.ts`, `contracts/test/DugonStarterCards.test.ts`) and `npm audit`.
No third-party audit and no static analyzer (e.g. Slither) has been run yet.

Status legend: **Fixed** = change made and covered by a passing test or build check · **Mitigated** = risk reduced, residual risk documented · **Accepted** = known limitation acceptable for a testnet demo.

## Summary

| # | Severity | Finding | Status |
|---|---|---|---|
| 1 | High | Combat could be decided by the client | Fixed |
| 2 | High | Hidden information (bot hand, RNG seed, deck order) could leak to the browser | Fixed |
| 3 | Medium | Battle state could be rewound by replaying an older token | Mitigated |
| 4 | High | Duplicate on-chain starter claims | Fixed |
| 5 | Medium | Claim farming through contracts | Mitigated |
| 6 | Medium | Wallet sign-in replay / forged challenges | Fixed (single-use per instance) |
| 7 | Medium | Wrong-network / malformed addresses | Fixed |
| 8 | High | Accidental mainnet transactions | Fixed |
| 9 | Critical | Private key / seed phrase exposure | Fixed (by design) |
| 10 | High | Weak or missing server secret in production | Fixed |
| 11 | Critical/High | Vulnerable dependencies (Next.js 14, wagmi 2 connector tree) | Fixed; 11 moderate remain |
| 12 | Low | Progression (XP, deck) stored client-side | Accepted |
| 13 | Low | Simulated claim registry is ephemeral on Vercel | Accepted |
| 14 | Medium | No rate limiting on API routes | Open (recommendation) |
| 15 | Low | No Content-Security-Policy | Mitigated |
| 16 | Low | Single-key contract owner | Accepted |

## Findings

### 1. Combat could be decided by the client — High — Fixed
A browser-side engine would let a player edit HP, energy or card stats.
**Fix:** the rules engine runs only in API routes. `/api/battle/start` validates the deck (exactly 5 distinct known card ids) and creates the game; `/api/battle/action` accepts a single action (`play`, `attack`, `end`), strictly parses its shape, and applies it with `applyAction`, which throws on any illegal move (wrong turn, card not in hand, not enough energy, full board, unit already attacked or summoning-sick, Guard rule, game over). The bot also goes through `applyAction`, so it can only make legal moves.
**Tests:** `rules enforcement` suite, `bot > only makes legal moves` (200 seeded games), `battle API > ... rejects illegal and replayed actions` (HTTP 422).

### 2. Hidden information could leak — High — Fixed
Signing (HMAC) the state would still let players read the bot's hand and the RNG seed and predict draws.
**Fix:** the full state is sealed with **AES-256-GCM** (`lib/server/battleToken.ts`): confidential and tamper-evident, with a 2-hour expiry. The browser only receives `publicView()`, which omits the bot hand, deck order and seed.
**Tests:** `sealed battle state > round-trips and detects tampering`, `public view hides the bot hand`.

### 3. Battle rewind by replaying an older token — Medium — Mitigated
A stateless token could be resubmitted to "undo" a move.
**Fix:** each state carries a `seq` counter; `lib/server/replay.ts` remembers the latest accepted `seq` per battle and rejects older tokens with HTTP 409.
**Residual risk:** the guard is in memory, so on multi-instance serverless deployments a replay that lands on a different instance is not caught. Impact is limited (XP only, no value). **Recommendation:** back the guard with Vercel KV / Upstash Redis.
**Test:** `battle API > ... replayed actions` (HTTP 409).

### 4. Duplicate on-chain starter claims — High — Fixed
**Fix:** `DugonStarterCards.claimStarter()` sets `hasClaimed[msg.sender] = true` **before** minting (checks-effects-interactions) and reverts with `AlreadyClaimed()` on a second call. The flag is independent of balances, so transferring the cards away does not allow a re-claim. The UI reads `hasClaimed` before sending a transaction.
**Tests:** `prevents duplicate claims`, `still blocks a re-claim after the cards are transferred away`.

### 5. Claim farming through contracts — Medium — Mitigated
A contract could deploy throwaway children to claim repeatedly.
**Fix:** `claimStarter` requires `msg.sender == tx.origin` (EOAs only).
**Trade-offs:** this blocks smart-contract wallets (e.g. Safe, Coinbase Smart Wallet), and EIP-7702-delegated EOAs still pass. Anyone can still create new EOAs (Sybil); for free testnet cards with no value this is accepted. For production, gate claims with a server-signed voucher or allowlist.
**Test:** `rejects claims made through another contract`.

### 6. Wallet sign-in replay / forged challenges — Medium — Fixed
**Fix:** `/api/auth/challenge` issues a human-readable message containing address, network, random nonce and timestamp, plus an HMAC over the message. `/api/claim` verifies the HMAC (constant-time compare), the 10-minute expiry, that the address in the message matches the claimed address, and the signature (ed25519 via `tweetnacl` for Solana, EIP-191 via `viem.verifyMessage` for Base). Nonces are single-use.
**Residual risk:** the used-nonce set is per instance (same caveat as #3).
**Tests:** valid Solana and EVM signatures, reuse rejected, wrong signer rejected, tampered message rejected.

### 7. Wrong-network / malformed addresses — Medium — Fixed
**Fix:** addresses are validated per network (EVM `0x` + 40 hex; Solana base58, 32–44 chars) on the client and server. The wagmi config contains **only** Base Sepolia, and writes pass `chainId: 84532`; the Claim screen detects a wrong MetaMask network and switches before minting. The signed message names the network.
**Note:** Phantom does not expose which Solana cluster it is set to; Solana is used only for message signing, so no devnet/mainnet funds can move.
**Test:** `rejects addresses that do not match the network`.

### 8. Accidental mainnet transactions — High — Fixed
**Fix:** no mainnet chain is configured in wagmi; the only transaction the app sends is `claimStarter()` (non-payable, no value). `contracts/scripts/deploy.ts` refuses any chain other than 84532 or 31337.
**Verified:** deploy script run against the local Hardhat network; `claimStarter` sending value is rejected (contract test).

### 9. Private key / seed phrase exposure — Critical — Fixed (by design)
The app never asks for keys or seed phrases; wallets sign in their own UI. The only key in the repo workflow is the **deployer** key, read from `contracts/.env` (git-ignored) and validated as 32-byte hex. The README instructs using a throwaway testnet key.

### 10. Weak or missing server secret — High — Fixed
`GAME_SECRET` derives separate keys for battle sealing and sign-in challenges. Without it the app falls back to a development key **outside production** and logs a warning; in Vercel production it throws instead of running insecurely.

### 11. Vulnerable dependencies — Critical/High — Fixed (11 moderate remain)
Initial `npm audit --omit=dev` on Next.js 14.2.35 + wagmi 2: **1 critical, 17 high, 21 moderate** (Next.js RCE/DoS/SSRF advisories, `ws`, `zod`, `postcss`, WalletConnect tree).
**Fix:** upgraded to **Next.js 16.4.4 / React 19.3** and **wagmi 3.7.9** (connectors are optional peers, so WalletConnect/MetaMask SDK/Coinbase SDK are no longer installed), pinned `postcss` 8.5.32, and import only the `injected` connector.
**After:** **0 critical, 0 high, 11 moderate.** All 11 come from `@solana/web3.js` 1.x → `jayson` → `uuid` / `stream-json` (no fix available upstream). Those code paths are the JSON-RPC client; the app uses web3.js only in the browser for the wallet adapter and never parses untrusted JSON-RPC server-side. **Recommendation:** move to `@solana/kit` when the wallet adapter supports it.

### 12. Progression stored client-side — Low — Accepted
XP, unlocked cards and deck live in `localStorage` and can be edited. XP is computed server-side per battle, but the total is not authoritative. There is no economy or transferable value, so this is acceptable for the demo. For production, store profiles server-side keyed by verified wallet.

### 13. Ephemeral simulated claim registry — Low — Accepted
Simulated claims are stored in `.data/claims.json` locally and `/tmp/dugon` on Vercel (per instance, lost on cold start). They are labelled simulated and have no value. Use a database/KV for anything persistent.

### 14. No rate limiting — Medium — Open
API routes do bounded work (request bodies capped at 2–70 KB, at most 50 bot actions per turn) but are not rate limited. **Recommendation:** enable the Vercel Firewall rate-limit rule or add Upstash rate limiting on `/api/*`.

### 15. No Content-Security-Policy — Low — Mitigated
`X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy` and `Permissions-Policy` are set in `next.config.mjs`, and Vercel adds HSTS.
**Fix:** a Content-Security-Policy is now sent on every route: `default-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`, images/fonts from self or `data:`.
**Residual risk:** `script-src` still allows `'unsafe-inline'` (Next.js inline bootstrap scripts) and `connect-src` allows any `https:`/`wss:` origin so custom RPC env vars keep working. **Recommendation:** move to nonce-based scripts and pin `connect-src` to the configured RPC hosts.
**Verified:** full guest flow (connect, claim, pack, deck, battle, results) on desktop and mobile viewports in a production build with no CSP violations in the console.

### 16. Single-key contract owner — Low — Accepted
The owner can only change the metadata base URI (`setBaseURI`). It cannot mint, burn or move player tokens. Consider `Ownable2Step` or a multisig for anything beyond testnet.

## Verification log

What was actually run for this review (2026-11-02):

- `npm test` → 28 Vitest tests passing (engine rules, bot legality over 200 seeded games, 300 full simulated games terminating within 15 rounds, signature verification, sealed tokens, battle API).
- `cd contracts && npm test` → 8 Hardhat tests passing (compiled with solc 0.8.24, OpenZeppelin 5.4.0).
- `npm run deploy:local` → deployment script succeeded on the local Hardhat network.
- `npm run lint`, `npm run typecheck`, `npm run build` → pass (lint: 0 errors, 7 warnings for intentional state syncs in effects).
- Headless-browser playthrough (desktop and mobile viewports) of Home → Connect (guest) → Claim → Collection → Deck → Battle → Results with no console errors.

**Not verified:** a real Base Sepolia deployment and mint, and Phantom / MetaMask flows in a browser with the extensions installed. These need a funded testnet key and wallet extensions, which were not available in the build environment.
