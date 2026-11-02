import PixelSprite from "@/components/PixelSprite";
import { LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <PixelSprite name="logo" size={96} title="DUGON oni mask" className="animate-flicker" />
      <p className="mt-6 font-mono text-sm tracking-[0.4em] text-ash">迷 い 道</p>
      <h1 className="mt-3 font-pixel text-lg text-bone sm:text-2xl">404 · Lost path</h1>
      <p className="mt-3 max-w-sm font-mono text-sm text-ash">No spirit dwells here. The page you were looking for does not exist.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <LinkButton href="/">Back to the gate</LinkButton>
        <LinkButton href="/collection" variant="ghost">
          View cards
        </LinkButton>
      </div>
    </div>
  );
}
