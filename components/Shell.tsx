"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDisconnect } from "wagmi";
import { useWallet } from "@solana/wallet-adapter-react";
import Logo from "./Logo";
import { useProfile } from "@/lib/client/profile";
import { explorerAddress, shortAddress, solanaExplorerAddress } from "@/lib/chains";

const STEPS = [
  { href: "/", label: "Home" },
  { href: "/connect", label: "Connect" },
  { href: "/claim", label: "Claim" },
  { href: "/collection", label: "Collection" },
  { href: "/packs", label: "Packs" },
  { href: "/deck", label: "Deck" },
  { href: "/battle", label: "Battle" },
  { href: "/results", label: "Results" },
];

const CHAIN_LABEL = { "solana-devnet": "Solana Devnet", "base-sepolia": "Base Sepolia", guest: "Guest (offline)" } as const;

export function WalletBadge() {
  const { identity, setIdentity } = useProfile();
  const { disconnect } = useDisconnect();
  const sol = useWallet();
  if (!identity) return null;
  const href =
    identity.chain === "base-sepolia" ? explorerAddress(identity.address) : identity.chain === "solana-devnet" ? solanaExplorerAddress(identity.address) : null;
  const signOut = () => {
    if (identity.chain === "base-sepolia") disconnect();
    if (identity.chain === "solana-devnet") sol.disconnect().catch(() => {});
    setIdentity(null);
  };
  return (
    <div className="flex items-center gap-2 font-mono text-[11px]">
      <span className={`h-2 w-2 ${identity.chain === "guest" ? "bg-ash" : "bg-bone animate-flicker"}`} aria-hidden />
      <span className="hidden text-ash sm:inline">{CHAIN_LABEL[identity.chain]}</span>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="text-bone underline decoration-dotted underline-offset-4">
          {shortAddress(identity.address)}
        </a>
      ) : (
        <span className="text-bone">guest</span>
      )}
      <button onClick={signOut} className="ml-1 text-ash hover:text-blood" aria-label="Disconnect wallet" title="Disconnect">
        ✕
      </button>
    </div>
  );
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const active = STEPS.findIndex((s) => s.href === path);
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-smoke bg-ink/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" aria-label="DUGON home">
            <Logo size={32} />
          </Link>
          <WalletBadge />
        </div>
        <nav aria-label="Progress" className="mx-auto max-w-6xl overflow-x-auto px-4 pb-2">
          <ol className="flex min-w-max items-center gap-1 font-pixel text-[7px] uppercase tracking-widest sm:text-[8px]">
            {STEPS.map((s, i) => (
              <li key={s.href} className="flex items-center gap-1">
                <Link
                  href={s.href}
                  className={`px-1 py-1 ${i === active ? "text-bone" : i < active ? "text-ash" : "text-smoke hover:text-ash"}`}
                  aria-current={i === active ? "step" : undefined}
                >
                  {s.label}
                </Link>
                {i < STEPS.length - 1 && <span className="text-smoke">→</span>}
              </li>
            ))}
          </ol>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t border-smoke px-4 py-4 text-center font-mono text-[10px] text-ash">
        DUGON TCG · testnet demo · Solana Devnet &amp; Base Sepolia · no real value, no mainnet transactions
      </footer>
    </div>
  );
}
