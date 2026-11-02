import PixelSprite from "./PixelSprite";

export default function Logo({ size = 40, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <span className="inline-flex items-center gap-3">
      <PixelSprite name="logo" size={size} title="DUGON oni mask" />
      {withText && (
        <span className="leading-none">
          <span className="block font-pixel text-[11px] tracking-[0.25em] text-bone">DUGON</span>
          <span className="block font-mono text-[10px] tracking-[0.3em] text-ash">鬼 TCG</span>
        </span>
      )}
    </span>
  );
}
