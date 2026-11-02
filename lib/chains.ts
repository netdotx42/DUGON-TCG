export type ChainKind = "solana-devnet" | "base-sepolia";

export const BASE_SEPOLIA_ID = 84532 as const; // Base Sepolia
export const SOLANA_DEVNET_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.devnet.solana.com";
export const BASE_SEPOLIA_RPC = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || "https://sepolia.base.org";

const rawContract = process.env.NEXT_PUBLIC_DUGON_CONTRACT_ADDRESS || "";
export const DUGON_CONTRACT: `0x${string}` | null = /^0x[0-9a-fA-F]{40}$/.test(rawContract)
  ? (rawContract as `0x${string}`)
  : null;

export const explorerTx = (hash: string) => `https://sepolia.basescan.org/tx/${hash}`;
export const explorerAddress = (addr: string) => `https://sepolia.basescan.org/address/${addr}`;
export const solanaExplorerAddress = (addr: string) => `https://explorer.solana.com/address/${addr}?cluster=devnet`;

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const EVM = /^0x[0-9a-fA-F]{40}$/;

export function isValidAddress(chain: ChainKind, address: unknown): address is string {
  if (typeof address !== "string") return false;
  return chain === "base-sepolia" ? EVM.test(address) : BASE58.test(address);
}

export const shortAddress = (a: string) => (a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a);

export const DUGON_ABI = [
  { type: "function", name: "claimStarter", stateMutability: "nonpayable", inputs: [], outputs: [] },
  { type: "function", name: "hasClaimed", stateMutability: "view", inputs: [{ name: "", type: "address" }], outputs: [{ type: "bool" }] },
  {
    type: "function",
    name: "balanceOfBatch",
    stateMutability: "view",
    inputs: [{ name: "accounts", type: "address[]" }, { name: "ids", type: "uint256[]" }],
    outputs: [{ type: "uint256[]" }],
  },
] as const;
