import { describe, expect, it, beforeEach } from "vitest";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { buildChallenge, verifyChallenge } from "@/lib/server/auth";
import { openState, sealState } from "@/lib/server/battleToken";
import { createGame } from "@/lib/game/engine";
import { _resetReplayGuard, checkAndRecord } from "@/lib/server/replay";
import { POST as actionPOST } from "@/app/api/battle/action/route";
import { POST as startPOST } from "@/app/api/battle/start/route";

const post = (body: unknown) => new Request("http://x", { method: "POST", body: JSON.stringify(body) });

describe("wallet signature verification", () => {
  it("accepts a valid Solana signature and rejects reuse", async () => {
    const kp = nacl.sign.keyPair();
    const address = bs58.encode(kp.publicKey);
    const { message, token } = buildChallenge("solana-devnet", address);
    const signature = bs58.encode(nacl.sign.detached(new TextEncoder().encode(message), kp.secretKey));
    expect(await verifyChallenge({ chain: "solana-devnet", address, message, token, signature })).toEqual({ ok: true });
    const again = await verifyChallenge({ chain: "solana-devnet", address, message, token, signature });
    expect(again.ok).toBe(false);
  });
  it("accepts a valid EVM signature", async () => {
    const acct = privateKeyToAccount(generatePrivateKey());
    const { message, token } = buildChallenge("base-sepolia", acct.address);
    const signature = await acct.signMessage({ message });
    expect(await verifyChallenge({ chain: "base-sepolia", address: acct.address, message, token, signature })).toEqual({ ok: true });
  });
  it("rejects a signature from a different wallet", async () => {
    const victim = privateKeyToAccount(generatePrivateKey());
    const attacker = privateKeyToAccount(generatePrivateKey());
    const { message, token } = buildChallenge("base-sepolia", victim.address);
    const signature = await attacker.signMessage({ message });
    const r = await verifyChallenge({ chain: "base-sepolia", address: victim.address, message, token, signature });
    expect(r).toEqual({ ok: false, error: "Invalid signature" });
  });
  it("rejects a tampered challenge message", async () => {
    const acct = privateKeyToAccount(generatePrivateKey());
    const { message, token } = buildChallenge("base-sepolia", acct.address);
    const forged = message.replace(/Nonce: .*/, "Nonce: deadbeef");
    const signature = await acct.signMessage({ message: forged });
    const r = await verifyChallenge({ chain: "base-sepolia", address: acct.address, message: forged, token, signature });
    expect(r.ok).toBe(false);
  });
  it("rejects addresses that do not match the network", async () => {
    const r = await verifyChallenge({ chain: "solana-devnet", address: "0x0000000000000000000000000000000000000001", message: "", token: "", signature: "" });
    expect(r).toEqual({ ok: false, error: "Invalid address" });
  });
});

describe("sealed battle state", () => {
  it("round-trips and detects tampering", () => {
    const s = createGame([1, 2, 3, 4, 5], [1, 2, 3, 4, 5], 7, "seal");
    const t = sealState(s);
    expect(openState(t)).toEqual(s);
    const raw = Buffer.from(t, "base64url");
    raw[raw.length - 1] ^= 1;
    expect(() => openState(raw.toString("base64url"))).toThrow(/Invalid/);
    expect(t).not.toContain("seed");
  });
});

describe("battle API", () => {
  beforeEach(() => _resetReplayGuard());
  it("rejects invalid decks", async () => {
    const r = await startPOST(post({ deck: [1, 1, 1, 1, 1] }));
    expect(r.status).toBe(400);
  });
  it("plays a turn, runs the bot, and rejects illegal and replayed actions", async () => {
    const start = await (await startPOST(post({ deck: [1, 2, 3, 4, 5], xp: 0 }))).json();
    expect(start.view.turn).toBe("player");

    const illegal = await actionPOST(post({ token: start.token, action: { type: "attack", attacker: 12345, target: "hero" } }));
    expect(illegal.status).toBe(422);

    const end = await actionPOST(post({ token: start.token, action: { type: "end" } }));
    expect(end.status).toBe(200);
    const after = await end.json();
    expect(after.view.turn).toBe("player");
    expect(after.view.round).toBe(2);
    expect(after.botSteps.length).toBeGreaterThan(0);

    const replay = await actionPOST(post({ token: start.token, action: { type: "end" } }));
    expect(replay.status).toBe(409);
  });
  it("still allows a fresh state on a different instance-like guard reset", () => {
    expect(checkAndRecord("x", 3)).toBe(true);
    expect(checkAndRecord("x", 2)).toBe(false);
  });
});
