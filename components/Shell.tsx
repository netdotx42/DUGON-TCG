"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDisconnect } from "wagmi";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useRef } from "react";
import Logo from "./Logo";
import Atmosphere from "./Atmosphere";
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
    <div className="flex items-center gap-2 bg-ink/70 px-3 py-2 font-mono text-xs shadow-[inset_0_0_0_1px_#2a2a28] sm:text-sm">
      <span className={`h-2 w-2 ${identity.chain === "guest" ? "bg-blood/80" : "bg-blood shadow-[0_0_6px_rgba(255,40,60,0.9)] animate-flicker"}`} aria-hidden />
      <span className="hidden text-ash sm:inline">{CHAIN_LABEL[identity.chain]}</span>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="text-bone underline decoration-dotted underline-offset-4">
          {shortAddress(identity.address)}
        </a>
      ) : (
        <span className="text-bone">guest</span>
      )}
      <button onClick={signOut} className="-my-2 -mr-2 ml-1 px-2 py-2 text-ash hover:text-blood" aria-label="Disconnect wallet" title="Disconnect">
        ✕
      </button>
    </div>
  );
}

const MARQUEE = ["Connect", "Claim", "Collect", "Build a deck", "Battle", "Earn embers", "Open packs", "Testnet only"];

function Marquee() {
  const items = [...MARQUEE, ...MARQUEE];
  return (
    <div className="marquee relative z-10" aria-hidden>
      <div className="marquee-track py-3">
        {items.map((t, i) => (
          <span key={i} className="flex items-center whitespace-nowrap px-4 font-pixel text-[9px] uppercase tracking-[0.2em] text-bone/80">
            <span className="neon-soft mr-4">◆</span>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const active = STEPS.findIndex((s) => s.href === path);
  const activeRef = useRef<HTMLAnchorElement>(null);
  // Keep the current step visible in the horizontally scrolling nav on small screens.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [path]);
  return (
    <div className="flex min-h-screen flex-col">
      <Atmosphere />
      <header className="sticky top-0 z-30 bg-ink/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" aria-label="DUGON home" className="transition hover:brightness-125">
            <Logo size={44} />
          </Link>
          <WalletBadge />
        </div>
        <nav aria-label="Progress" className="no-scrollbar mx-auto max-w-6xl overflow-x-auto px-4 pb-3">
          <ol className="flex min-w-max items-center gap-1 font-pixel text-[8px] uppercase tracking-widest sm:text-[9px]">
            {STEPS.map((s, i) => (
              <li key={s.href} className="flex items-center gap-1">
                <Link
                  ref={i === active ? activeRef : undefined}
                  href={s.href}
                  className={`step-link px-2 py-2 ${i === active ? "step-active" : i < active ? "text-bone/70 hover:text-bone" : "text-ash hover:text-bone"}`}
                  aria-current={i === active ? "step" : undefined}
                >
                  {s.label}
                </Link>
                {i < STEPS.length - 1 && (
                  <span className={`flex items-center ${i < active ? "text-blood" : "text-smoke"}`} aria-hidden>
                    <span className="step-dots inline-block h-2 w-5" />
                    <span className="-ml-px text-[10px]">›</span>
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <div className="header-glow-line" aria-hidden />
      </header>
      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-10">{children}</main>
      <Marquee />
      <footer className="relative z-10 bg-ink/80 px-4 py-4 text-center font-mono text-[11px] text-ash">
        DUGON TCG · testnet demo · Solana Devnet &amp; Base Sepolia · no real value, no mainnet transactions
      </footer>
    </div>
  );
}
