import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Demo claim registry stored as a local JSON file. On Vercel the writable dir is /tmp, which is
 * per-instance and ephemeral, so this is demo-grade only. Replace with Vercel KV / a database for real use.
 */
export interface ClaimRecord {
  chain: string;
  address: string;
  cardIds: number[];
  claimedAt: string;
  simulated: true;
}

const DIR = process.env.VERCEL ? "/tmp/dugon" : path.join(process.cwd(), ".data");
const FILE = path.join(DIR, "claims.json");
let chain: Promise<unknown> = Promise.resolve();

async function readAll(): Promise<Record<string, ClaimRecord>> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8"));
  } catch {
    return {};
  }
}

const keyOf = (chainName: string, address: string) =>
  `${chainName}:${chainName === "base-sepolia" ? address.toLowerCase() : address}`;

export async function getClaim(chainName: string, address: string) {
  return (await readAll())[keyOf(chainName, address)] ?? null;
}

/** Atomically (within this process) records a claim. Returns null if this wallet already claimed. */
export function recordClaim(rec: ClaimRecord): Promise<ClaimRecord | null> {
  const run = chain.then(async () => {
    const all = await readAll();
    const k = keyOf(rec.chain, rec.address);
    if (all[k]) return null;
    all[k] = rec;
    await fs.mkdir(DIR, { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(all, null, 2));
    return rec;
  });
  chain = run.catch(() => undefined);
  return run;
}
