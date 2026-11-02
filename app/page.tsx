import PixelSprite from "@/components/PixelSprite";
import CardView from "@/components/CardView";
import { LinkButton, SectionLabel } from "@/components/ui";

export default function Home() {
  return (
    <div className="flex flex-col items-center text-center">
      <section className="relative flex flex-col items-center pt-4 sm:pt-10">
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 bg-[radial-gradient(circle,rgba(255,36,60,0.35),transparent_65%)] sm:h-96 sm:w-96"
          aria-hidden
        />
        <div className="relative animate-float">
          <PixelSprite name="logo" size={176} title="DUGON oni mask" className="drop-shadow-[0_0_28px_rgba(255,36,60,0.6)]" />
        </div>
        <p className="neon-soft relative mt-6 font-mono text-lg tracking-[0.6em]">鬼 の カ ー ド</p>
        <h1 className="neon relative mt-3 animate-rise font-pixel text-4xl tracking-[0.2em] sm:text-6xl">DUGON</h1>
        <p className="relative mt-5 max-w-lg font-mono text-base leading-relaxed text-bone/90 sm:text-lg">
          Summon oni, yokai and restless spirits. Break the enemy hero before the fifteenth bell.
        </p>
        <div className="relative mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <LinkButton href="/connect" className="sm:min-w-[14rem]">
            Enter the gate
          </LinkButton>
          <LinkButton href="/collection" variant="ghost" className="sm:min-w-[14rem]">
            View cards
          </LinkButton>
        </div>
        <p className="relative mt-5 font-mono text-xs text-ash">Testnet demo · Solana Devnet &amp; Base Sepolia · free to play</p>
      </section>

      <section aria-label="Featured cards" className="mt-16 flex w-full justify-center gap-3 overflow-x-auto px-2 pb-4 pt-3 sm:gap-6">
        {[4, 10, 6].map((id, i) => (
          <div key={id} className={`animate-rise ${i === 1 ? "sm:-translate-y-4" : ""}`} style={{ animationDelay: `${150 + i * 120}ms` }}>
            <div className={i === 1 ? "drop-shadow-[0_0_18px_rgba(255,36,60,0.5)]" : ""}>
              <CardView id={id} size="md" />
            </div>
          </div>
        ))}
      </section>

      <section className="mt-16 w-full max-w-4xl text-left">
        <SectionLabel className="mb-6">HOW TO PLAY</SectionLabel>
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            ["壱", "Connect", "Phantom on Solana Devnet or MetaMask on Base Sepolia. Signing is free and never touches funds."],
            ["弐", "Claim", "Five starter cards. Minted as ERC-1155 on Base Sepolia, or a clearly labelled simulated claim."],
            ["参", "Battle", "Build a five-card deck and duel the Oni Bot. Earn XP to awaken five rarer spirits."],
          ].map(([n, t, d]) => (
            <div key={t} className="panel p-5">
              <div className="neon font-mono text-3xl">{n}</div>
              <div className="mt-3 font-pixel text-xs text-bone">{t}</div>
              <p className="mt-2 font-mono text-sm leading-relaxed text-bone/75">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
