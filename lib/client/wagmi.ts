import { createConfig, http } from "wagmi";
import { baseSepolia } from "wagmi/chains";
// Import from @wagmi/core (not "wagmi/connectors") so unused SDK connectors are not bundled.
import { injected } from "@wagmi/core";
import { BASE_SEPOLIA_RPC } from "../chains";

// Only Base Sepolia is configured, so the app cannot send transactions to mainnet.
export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors: [injected({ target: "metaMask" })],
  transports: { [baseSepolia.id]: http(BASE_SEPOLIA_RPC) },
  ssr: true,
});
