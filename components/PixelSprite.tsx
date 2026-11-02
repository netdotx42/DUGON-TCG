import type React from "react";
import { SPRITES, expandSprite } from "@/lib/sprites";

const FILL: Record<string, string> = { "#": "#f5f5f0", "+": "#8a8a85", r: "#c8102e" };

/** Renders a 16x16 sprite as crisp SVG rects. Consecutive pixels in a row are merged. */
export default function PixelSprite({ name, size = 64, className = "", title }: { name: string; size?: number; className?: string; title?: string }) {
  const sprite = SPRITES[name];
  if (!sprite) return null;
  const rows = expandSprite(sprite);
  const rects: React.ReactElement[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === ".") {
        x++;
        continue;
      }
      let w = 1;
      while (row[x + w] === ch) w++;
      rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={w} height={1} fill={FILL[ch] ?? FILL["#"]} />);
      x += w;
    }
  });
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {rects}
    </svg>
  );
}
