import { Action, IllegalAction, applyAction, publicView } from "@/lib/game/engine";
import { runBotTurn } from "@/lib/game/bot";
import { openState, sealState } from "@/lib/server/battleToken";
import { checkAndRecord } from "@/lib/server/replay";
import { bad, json, readJson } from "@/lib/server/http";

export const dynamic = "force-dynamic";

function parseAction(a: unknown): Action | null {
  if (!a || typeof a !== "object") return null;
  const o = a as Record<string, unknown>;
  const isId = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v > 0;
  if (o.type === "end") return { type: "end" };
  if (o.type === "play" && isId(o.uid)) return { type: "play", uid: o.uid };
  if (o.type === "attack" && isId(o.attacker) && (o.target === "hero" || isId(o.target))) {
    return { type: "attack", attacker: o.attacker, target: o.target as "hero" | number };
  }
  if (o.type === "strike" && (o.target === "hero" || isId(o.target))) {
    return { type: "strike", target: o.target as "hero" | number };
  }
  return null;
}

/** Every player action is validated here against the sealed server state, then the bot replies. */
export async function POST(req: Request) {
  const body = await readJson(req);
  if (!body) return bad("Malformed request");
  const action = parseAction(body.action);
  if (!action) return bad("Malformed action");

  let state;
  try {
    state = openState(body.token);
  } catch (e) {
    return bad((e as Error).message, 401);
  }
  if (!checkAndRecord(state.battleId, state.seq)) return bad("Stale battle state (replay rejected)", 409);

  try {
    state = applyAction(state, "player", action);
  } catch (e) {
    if (e instanceof IllegalAction) return bad(e.message, 422);
    throw e;
  }

  let botSteps: ReturnType<typeof publicView>[] = [];
  if (!state.over && state.turn === "bot") {
    const result = runBotTurn(state);
    state = result.state;
    botSteps = result.steps.map(publicView);
  }
  checkAndRecord(state.battleId, state.seq);
  return json({ token: sealState(state), view: publicView(state), botSteps });
}
