import Link from "next/link";

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" };

const BTN_BASE =
  "btn inline-flex min-h-[44px] items-center justify-center px-5 py-3 text-center font-pixel text-[10px] uppercase tracking-widest transition active:translate-y-[2px]";

export function Button({ variant = "primary", className = "", ...rest }: BtnProps) {
  const styles = variant === "ghost" ? "btn-ghost" : "btn-primary";
  return <button {...rest} className={`${BTN_BASE} disabled:cursor-not-allowed disabled:opacity-40 disabled:saturate-50 ${styles} ${className}`} />;
}

export function LinkButton({ href, children, variant = "primary", className = "" }: { href: string; children: React.ReactNode; variant?: "primary" | "ghost"; className?: string }) {
  const styles = variant === "primary" ? "btn-primary" : "btn-ghost";
  return (
    <Link href={href} className={`${BTN_BASE} ${styles} ${className}`}>
      {children}
    </Link>
  );
}

export function DemoBadge({ children = "SIMULATED · DEMO ONLY" }: { children?: React.ReactNode }) {
  return <span className="notice neon-soft inline-block px-3 py-2 font-pixel text-[8px] uppercase leading-relaxed tracking-widest sm:text-[9px]">{children}</span>;
}

export function PageTitle({ jp, title, sub }: { jp: string; title: string; sub?: React.ReactNode }) {
  return (
    <header className="mb-8 animate-rise">
      <div className="neon-soft font-mono text-xl sm:text-2xl">{jp}</div>
      <h1 className="neon mt-1 font-pixel text-2xl leading-snug sm:text-4xl">{title}</h1>
      {sub && <p className="mt-4 max-w-2xl font-mono text-sm leading-relaxed text-bone/90 sm:text-base">{sub}</p>}
    </header>
  );
}

export function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`section-label font-pixel text-xs text-bone glow-white sm:text-sm ${className}`}>{children}</h2>;
}

/** Original pixel ember gem. */
export function EmberGem({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 10 10" width={size} height={size} shapeRendering="crispEdges" className="ember-gem" aria-hidden>
      <rect x="3" y="0" width="4" height="1" fill="#ff6b78" />
      <rect x="2" y="1" width="6" height="1" fill="#ff3048" />
      <rect x="1" y="2" width="8" height="1" fill="#ff3048" />
      <rect x="0" y="3" width="10" height="3" fill="#c8102e" />
      <rect x="1" y="6" width="8" height="1" fill="#a00c24" />
      <rect x="2" y="7" width="6" height="1" fill="#8a0a1f" />
      <rect x="3" y="8" width="4" height="1" fill="#6a0716" />
      <rect x="4" y="9" width="2" height="1" fill="#6a0716" />
      <rect x="3" y="1" width="2" height="1" fill="#ffd0d5" />
      <rect x="2" y="2" width="2" height="2" fill="#ff9aa5" />
      <rect x="5" y="3" width="1" height="4" fill="#ff3048" />
    </svg>
  );
}

export function EmberPill({ embers }: { embers: number }) {
  return (
    <span className="ember-pill-wrap inline-block">
      <span className="ember-pill">
        <EmberGem />
        <span className="font-pixel text-base text-white glow-white sm:text-lg">{embers} EMBERS</span>
      </span>
    </span>
  );
}
