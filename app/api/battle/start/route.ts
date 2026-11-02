import { randomBytes, randomInt } from "node:crypto";
import { createGame, publicView } from "@/lib/game/engine";
import { botDeckFor } from "@/lib/game/bot";
import { validateDeck } from "@/lib/cards";
import { sealState } from "@/lib/server/battleToken";
import { checkAndRecord } from "@/lib/server/replay";
import { bad, json, readJson } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await readJson(req, 2_000);
  if (!body) return bad("Malformed request");
  if (!validateDeck(body.deck)) return bad("Deck must be exactly 5 different valid cards");
  const xp = typeof body.xp === "number" && Number.isFinite(body.xp) ? Math.max(0, body.xp) : 0;
  const battleId = randomBytes(12).toString("hex");
  const seed = randomInt(0, 2 ** 32 - 1);
  const state = createGame(body.deck, botDeckFor(xp, (seed % 1000) / 1000), seed, battleId);
  checkAndRecord(battleId, state.seq);
  return json({ token: sealState(state), view: publicView(state) });
}
