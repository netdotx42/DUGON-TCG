import { verifyChallenge } from "@/lib/server/auth";
import { getClaim, recordClaim } from "@/lib/server/claimStore";
import { STARTER_IDS } from "@/lib/cards";
import { ChainKind } from "@/lib/chains";
import { bad, json, readJson } from "@/lib/server/http";

export const dynamic = "force-dynamic";

/**
 * SIMULATED starter claim (demo only — nothing is minted).
 * Used for Solana Devnet, and for Base Sepolia when no contract address is configured.
 */
export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body) return bad("Malformed request");
  const { chain, address, message, token, signature } = body as Record<string, string>;
  const result = await verifyChallenge({ chain: chain as ChainKind, address, message, token, signature });
  if (!result.ok) return bad(result.error, 401);

  const existing = await getClaim(chain, address);
  if (existing) return json({ claim: existing, alreadyClaimed: true });
  const claim = await recordClaim({
    chain,
    address,
    cardIds: [...STARTER_IDS],
    claimedAt: new Date().toISOString(),
    simulated: true,
  });
  if (!claim) return json({ claim: await getClaim(chain, address), alreadyClaimed: true });
  return json({ claim, alreadyClaimed: false });
}
