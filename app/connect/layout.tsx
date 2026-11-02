import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({ title: "Enter the gate", description: "Connect Phantom on Solana Devnet or MetaMask on Base Sepolia. Signing is free and never touches funds.", path: "/connect" });

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
