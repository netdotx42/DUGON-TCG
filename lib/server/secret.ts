import { createHash } from "node:crypto";

let warned = false;

/** 32-byte key derived from GAME_SECRET. Falls back to a dev-only key outside production. */
export function serverKey(purpose: string): Buffer {
  let secret = process.env.GAME_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === "production") {
      throw new Error("GAME_SECRET (32+ chars) must be set in production");
    }
    if (!warned) {
      console.warn("[dugon] GAME_SECRET missing or short; using an insecure development key.");
      warned = true;
    }
    secret = "dugon-dev-only-secret-do-not-use-in-production";
  }
  return createHash("sha256").update(`${purpose}:${secret}`).digest();
}
