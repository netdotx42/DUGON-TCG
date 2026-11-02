import { CARD_BY_ID, KEYWORD_TEXT, Rarity } from "@/lib/cards";
import PixelSprite from "./PixelSprite";

const RARITY_PIPS: Record<Rarity, number> = { Common: 1, Uncommon: 2, Rare: 3, Epic: 4, Legendary: 5 };

export function RarityPips({ rarity }: { rarity: Rarity }) {
  const n = RARITY_PIPS[rarity];
  return (
    <span className="inline-flex gap-[3px]" aria-label={rarity} title={rarity}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`h-[5px] w-[5px] ${i < n ? (rarity === "Legendary" ? "bg-blood" : "bg-bone") : "bg-smoke"}`} />
      ))}
    </span>
  );
}

interface Props {
  id: number;
  size?: "sm" | "md" | "lg";
  locked?: boolean;
  lockLabel?: string;
  selected?: boolean;
  dim?: boolean;
  owned?: boolean;
  onClick?: () => void;
  showText?: boolean;
}

/** A full card face: cost, sprite, name, keyword, attack / HP. */
export default function CardView({ id, size = "md", locked, lockLabel, selected, dim, owned, onClick, showText = true }: Props) {
  const c = CARD_BY_ID[id];
  if (!c) return null;
  const sprite = size === "lg" ? 96 : size === "md" ? 72 : 48;
  const width = size === "lg" ? "w-48" : size === "md" ? "w-36" : "w-[6.5rem]";
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      aria-pressed={onClick ? !!selected : undefined}
      className={`pixel-border relative flex ${width} shrink-0 flex-col bg-ink p-2 text-left transition-transform duration-150 ${
        onClick ? "hover:-translate-y-1 focus-visible:-translate-y-1" : ""
      } ${selected ? "pixel-border-active -translate-y-1" : ""} ${dim || locked ? "opacity-40" : ""}`}
    >
      <div className="flex items-center justify-between">
        <span className="flex h-6 w-6 items-center justify-center bg-bone font-pixel text-[10px] text-ink" title="Energy cost">
          {c.cost}
        </span>
        <RarityPips rarity={c.rarity} />
      </div>
      <div className="my-2 flex justify-center">
        <PixelSprite name={c.sprite} size={sprite} className={locked ? "grayscale" : ""} />
      </div>
      <div className="min-h-[2.4em]">
        <div className={`font-pixel leading-tight text-bone ${size === "sm" ? "text-[8px]" : "text-[9px]"}`}>{c.name}</div>
        <div className="font-mono text-[10px] text-ash">{c.jp}</div>
      </div>
      {showText && size !== "sm" && (
        <p className="mt-1 min-h-[2.6em] font-mono text-[10px] leading-snug text-ash">
          {c.keyword ? (
            <>
              <span className="text-bone">{c.keyword}.</span> {KEYWORD_TEXT[c.keyword]}
            </>
          ) : (
            <span className="italic">{c.flavor}</span>
          )}
        </p>
      )}
      {size === "sm" && c.keyword && <div className="font-mono text-[9px] text-bone">{c.keyword}</div>}
      <div className="mt-2 flex items-center justify-between font-pixel text-[10px]">
        <span title="Attack">⚔ {c.attack}</span>
        <span title="HP" className="text-blood">
          ♥ <span className="text-bone">{c.hp}</span>
        </span>
      </div>
      {owned && <span className="absolute -right-1 -top-2 bg-bone px-1 font-pixel text-[7px] text-ink">OWNED</span>}
      {locked && (
        <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-ink/90 py-1 text-center font-pixel text-[8px] text-bone">
          {lockLabel ?? "LOCKED"}
        </span>
      )}
    </Tag>
  );
}
