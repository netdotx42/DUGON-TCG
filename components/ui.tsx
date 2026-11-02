import Link from "next/link";

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" };

export function Button({ variant = "primary", className = "", ...rest }: BtnProps) {
  const styles =
    variant === "primary"
      ? "bg-bone text-ink hover:bg-white"
      : variant === "danger"
        ? "bg-blood text-bone hover:brightness-110"
        : "bg-transparent text-bone pixel-border hover:bg-smoke";
  return (
    <button
      {...rest}
      className={`px-4 py-3 font-pixel text-[10px] uppercase tracking-widest transition active:translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-40 ${styles} ${className}`}
    />
  );
}

export function LinkButton({ href, children, variant = "primary", className = "" }: { href: string; children: React.ReactNode; variant?: "primary" | "ghost"; className?: string }) {
  const styles = variant === "primary" ? "bg-bone text-ink hover:bg-white" : "pixel-border text-bone hover:bg-smoke";
  return (
    <Link href={href} className={`inline-block px-4 py-3 text-center font-pixel text-[10px] uppercase tracking-widest transition ${styles} ${className}`}>
      {children}
    </Link>
  );
}

export function DemoBadge({ children = "SIMULATED · DEMO ONLY" }: { children?: React.ReactNode }) {
  return (
    <span className="inline-block border border-dashed border-blood px-2 py-1 font-pixel text-[8px] uppercase tracking-widest text-blood">
      {children}
    </span>
  );
}

export function PageTitle({ jp, title, sub }: { jp: string; title: string; sub?: React.ReactNode }) {
  return (
    <header className="mb-8 animate-rise">
      <div className="font-mono text-sm text-ash">{jp}</div>
      <h1 className="font-pixel text-lg leading-relaxed text-bone sm:text-2xl">{title}</h1>
      {sub && <p className="mt-2 max-w-2xl font-mono text-sm text-ash">{sub}</p>}
    </header>
  );
}
