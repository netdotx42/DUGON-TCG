import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import type { GameState } from "../game/engine";
import { serverKey } from "./secret";

const TTL_MS = 2 * 60 * 60 * 1000;

/**
 * The full game state (including the bot's hidden hand and the RNG seed) is sealed with
 * AES-256-GCM. The browser holds the token but can neither read nor modify it, so the server
 * stays authoritative without a database.
 */
export function sealState(state: GameState): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", serverKey("battle"), iv);
  const body = JSON.stringify({ s: state, iat: Date.now() });
  const enc = Buffer.concat([cipher.update(body, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64url");
}

export function openState(token: unknown): GameState {
  if (typeof token !== "string" || token.length > 64_000) throw new Error("Invalid battle token");
  const raw = Buffer.from(token, "base64url");
  if (raw.length < 29) throw new Error("Invalid battle token");
  const decipher = createDecipheriv("aes-256-gcm", serverKey("battle"), raw.subarray(0, 12));
  decipher.setAuthTag(raw.subarray(12, 28));
  let body: { s: GameState; iat: number };
  try {
    body = JSON.parse(Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8"));
  } catch {
    throw new Error("Invalid battle token");
  }
  if (Date.now() - body.iat > TTL_MS) throw new Error("Battle expired");
  return body.s;
}
