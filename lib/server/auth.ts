import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { verifyMessage } from "viem";
import { ChainKind, isValidAddress } from "../chains";
import { serverKey } from "./secret";

const NONCE_TTL_MS = 10 * 60 * 1000;
const usedNonces = new Map<string, number>();

function mac(message: string) {
  return createHmac("sha256", serverKey("auth")).update(message).digest("base64url");
}

export function buildChallenge(chain: ChainKind, address: string, now = Date.now()) {
  const nonce = randomBytes(16).toString("hex");
  const message = [
    "DUGON TCG — sign in (testnet demo)",
    "",
    "This signature proves wallet ownership. It is free, sends no transaction,",
    "and never grants access to your funds.",
    "",
    `Address: ${address}`,
    `Network: ${chain === "base-sepolia" ? "Base Sepolia (84532)" : "Solana Devnet"}`,
    `Nonce: ${nonce}`,
    `Issued At: ${new Date(now).toISOString()}`,
  ].join("\n");
  return { message, token: mac(message) };
}

function field(message: string, name: string) {
  return message.match(new RegExp(`^${name}: (.+)$`, "m"))?.[1];
}

export type VerifyResult = { ok: true } | { ok: false; error: string };

/** Verify a signed challenge: server-issued (HMAC), fresh, single-use, address matches, signature valid. */
export async function verifyChallenge(input: {
  chain: ChainKind;
  address: string;
  message: string;
  token: string;
  signature: string;
}): Promise<VerifyResult> {
  const { chain, address, message, token, signature } = input;
  if (chain !== "base-sepolia" && chain !== "solana-devnet") return { ok: false, error: "Unsupported network" };
  if (!isValidAddress(chain, address)) return { ok: false, error: "Invalid address" };
  if (typeof message !== "string" || typeof token !== "string" || typeof signature !== "string") {
    return { ok: false, error: "Malformed request" };
  }
  const expected = Buffer.from(mac(message));
  const given = Buffer.from(token);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return { ok: false, error: "Challenge was not issued by this server" };
  }
  if (field(message, "Address") !== address) return { ok: false, error: "Address mismatch" };
  const issued = Date.parse(field(message, "Issued At") ?? "");
  if (!Number.isFinite(issued) || Date.now() - issued > NONCE_TTL_MS) return { ok: false, error: "Challenge expired" };
  const nonce = field(message, "Nonce")!;
  if (usedNonces.has(nonce)) return { ok: false, error: "Challenge already used" };

  let valid = false;
  try {
    if (chain === "base-sepolia") {
      valid = await verifyMessage({ address: address as `0x${string}`, message, signature: signature as `0x${string}` });
    } else {
      valid = nacl.sign.detached.verify(new TextEncoder().encode(message), bs58.decode(signature), bs58.decode(address));
    }
  } catch {
    valid = false;
  }
  if (!valid) return { ok: false, error: "Invalid signature" };

  usedNonces.set(nonce, Date.now());
  for (const [n, t] of usedNonces) if (Date.now() - t > NONCE_TTL_MS) usedNonces.delete(n);
  return { ok: true };
}
