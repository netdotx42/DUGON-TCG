import { buildChallenge } from "@/lib/server/auth";
import { ChainKind, isValidAddress } from "@/lib/chains";
import { bad, json } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const chain = url.searchParams.get("chain") as ChainKind;
  const address = url.searchParams.get("address") ?? "";
  if (chain !== "base-sepolia" && chain !== "solana-devnet") return bad("Unsupported network");
  if (!isValidAddress(chain, address)) return bad("Invalid address for network");
  return json(buildChallenge(chain, address));
}
