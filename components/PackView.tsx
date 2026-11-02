import PixelSprite from "./PixelSprite";
import { PACK_BY_SLUG, TIER_BY_ID, TIERS, TierId } from "@/lib/packs";

/** Small row of squares showing a tier's rank (1 = Paper .. 5 = Obsidian). */
export function TierPips({ tier }: { tier: TierId }) {
  const n = TIERS.findIndex((t) => t.id === tier) + 1;
  return (
    <span className="inline-flex gap-[3px]" aria-label={`${TIER_BY_ID[tier].name} tier`}>
      {TIERS.map((t, i) => (
        <span key={t.id} className={`h-[5px] w-[5px] ${i < n ? (tier === "obsidian" ? "bg-blood" : "bg-bone") : "bg-smoke"}`} />
      ))}
    </span>
  );
}

interface Props {
  pack: string;
  tier: TierId;
  size?: "sm" | "md" | "lg";
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

/** A sealed booster pack: crimped edges, the set's Legendary as cover art, and a tier frame. */
export default function PackView({ pack, tier, size = "md", selected, onClick, className = "" }: Props) {
  const p = PACK_BY_SLUG[pack];
  const t = TIER_BY_ID[tier];
  if (!p || !t) return null;
  const width = size === "lg" ? "w-52" : size === "md" ? "w-36" : "w-28";
  const sprite = size === "lg" ? 112 : size === "md" ? 72 : 56;
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      aria-pressed={onClick ? !!selected : undefined}
      aria-label={onClick ? `${p.name} pack` : undefined}
      className={`relative flex ${width} shrink-0 flex-col bg-ink text-left transition-transform duration-150 tier-${tier} ${
        onClick ? "hover:-translate-y-1 focus-visible:-translate-y-1" : ""
      } ${selected ? "-translate-y-1 ring-2 ring-blood ring-offset-2 ring-offset-ink" : ""} ${className}`}
    >
      <div className="pack-crimp h-2 w-full" aria-hidden />
      <div className="flex items-center justify-between px-3 pt-2">
        <span className="font-mono text-[10px] text-ash">{t.jp}</span>
        <TierPips tier={tier} />
      </div>
      <div className="flex justify-center py-2">
        <PixelSprite name={p.cover} size={sprite} className={tier === "obsidian" ? "animate-flicker" : ""} />
      </div>
      <div className="px-3 pb-2">
        <div className={`font-pixel leading-tight text-bone ${size === "sm" ? "text-[7px]" : "text-[9px]"}`}>{p.name}</div>
        <div className="font-mono text-[10px] text-ash">
          {p.jp} · {t.name}
        </div>
      </div>
      <div className="pack-crimp h-2 w-full rotate-180" aria-hidden />
    </Tag>
  );
}
