import PixelSprite from "@/components/PixelSprite";
import CardView from "@/components/CardView";
import { LinkButton } from "@/components/ui";

export default function Home() {
  return (
    <div className="flex flex-col items-center text-center">
      <section className="flex flex-col items-center pt-6 sm:pt-12">
        <div className="animate-float">
          <PixelSprite name="logo" size={176} title="DUGON oni mask" className="drop-shadow-[0_0_24px_rgba(200,16,46,0.25)]" />
        </div>
        <p className="mt-6 font-mono text-base tracking-[0.6em] text-ash">鬼 の カ ー ド</p>
        <h1 className="mt-3 animate-rise font-pixel text-3xl tracking-[0.2em] text-bone sm:text-5xl">DUGON</h1>
        <p className="mt-4 max-w-md font-mono text-sm leading-relaxed text-ash">
          Summon oni, yokai and restless spirits. Break the enemy hero before the fifteenth bell.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <LinkButton href="/connect">Enter the gate</LinkButton>
          <LinkButton href="/collection" variant="ghost">
            View cards
          </LinkButton>
        </div>
        <p className="mt-4 font-mono text-[11px] text-ash">Testnet demo · Solana Devnet &amp; Base Sepolia · free to play</p>
      </section>

      <section aria-label="Featured cards" className="mt-16 flex w-full justify-center gap-3 overflow-x-auto pb-4 sm:gap-6">
        {[4, 10, 6].map((id, i) => (
          <div key={id} className="animate-rise" style={{ animationDelay: `${150 + i * 120}ms` }}>
            <CardView id={id} size="md" />
          </div>
        ))}
      </section>

      <section className="mt-16 grid w-full max-w-4xl gap-6 text-left sm:grid-cols-3">
        {[
          ["壱", "Connect", "Phantom on Solana Devnet or MetaMask on Base Sepolia. Signing is free and never touches funds."],
          ["弐", "Claim", "Five starter cards. Minted as ERC-1155 on Base Sepolia, or a clearly labelled simulated claim."],
          ["参", "Battle", "Build a five-card deck and duel the Oni Bot. Earn XP to awaken five rarer spirits."],
        ].map(([n, t, d]) => (
          <div key={t} className="pixel-border-dim p-4">
            <div className="font-mono text-2xl text-blood">{n}</div>
            <div className="mt-2 font-pixel text-[10px] text-bone">{t}</div>
            <p className="mt-2 font-mono text-xs leading-relaxed text-ash">{d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
