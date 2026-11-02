import PixelSprite from "./PixelSprite";

export default function Logo({ size = 40, withText = true }: { size?: number; withText?: boolean }) {
  return (
    <span className="inline-flex items-center gap-3">
      <PixelSprite name="logo" size={size} title="DUGON oni mask" className="drop-shadow-[0_0_10px_rgba(255,36,60,0.65)]" />
      {withText && (
        <span className="leading-none">
          <span className="block font-pixel text-sm tracking-[0.25em] text-bone glow-white sm:text-lg">DUGON</span>
          <span className="neon-soft mt-1 block font-mono text-xs tracking-[0.35em] sm:text-sm">鬼 TCG</span>
        </span>
      )}
    </span>
  );
}
