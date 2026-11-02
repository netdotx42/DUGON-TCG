import PixelSprite from "./PixelSprite";

/**
 * Fixed, decorative background: red haze, drifting pixel storm clouds, faint oni masks and rising embers.
 * Pure CSS/SVG, no JS at runtime. Everything is aria-hidden and pointer-events: none.
 */

// Original stepped "storm cloud" with a curled swirl, drawn on a 32x12 grid.
// "#" = cloud body, "o" = outline, "." = empty.
const CLOUD = [
  "..........oooooo................",
  "........oo######oo....oooo......",
  ".......o###oooo###o..o####o.....",
  "......o###o####o##oooo#oo##o....",
  "..oooo###o##oo#o##o####o#o#oooo.",
  ".o######o##o..o#o#######o##o###o",
  "o#######o##oooo#o###########oo#o",
  "o########o#####o##############o.",
  ".o########ooooo##############o..",
  "..oo##########################o.",
  "....oooooooooooooooooooooooooo..",
  "................................",
];

function Cloud({ className = "", width = 320 }: { className?: string; width?: number }) {
  const rects: React.ReactElement[] = [];
  CLOUD.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === ".") {
        x++;
        continue;
      }
      let w = 1;
      while (row[x + w] === ch) w++;
      rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={w} height={1} fill={ch === "o" ? "#3a1a1e" : "#140c0d"} />);
      x += w;
    }
  });
  return (
    <svg viewBox="0 0 32 12" width={width} height={(width * 12) / 32} shapeRendering="crispEdges" className={className} aria-hidden>
      {rects}
    </svg>
  );
}

// Deterministic ember layout so server and client markup match.
const EMBERS = Array.from({ length: 34 }, (_, i) => {
  // Integer hash (no floating-point trig) so every JS engine produces identical markup.
  const r = (n: number) => {
    let h = Math.imul(i + 1, 0x9e3779b1) ^ Math.imul(n + 1, 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
    return ((h ^ (h >>> 13)) >>> 0) / 4294967296;
  };
  return {
    left: `${(r(1) * 100).toFixed(2)}%`,
    size: 2 + Math.round(r(2) * 3),
    dur: `${(9 + r(3) * 10).toFixed(1)}s`,
    delay: `-${(r(4) * 18).toFixed(1)}s`,
    drift: `${Math.round((r(5) - 0.5) * 120)}px`,
    hue: r(6) > 0.65 ? "ember-hot" : "",
  };
});

export default function Atmosphere() {
  return (
    <div className="atmosphere" aria-hidden>
      <div className="atmo-haze" />
      <Cloud className="atmo-cloud atmo-cloud-a" width={420} />
      <Cloud className="atmo-cloud atmo-cloud-b" width={300} />
      <Cloud className="atmo-cloud atmo-cloud-c" width={360} />
      <div className="atmo-mask atmo-mask-a">
        <PixelSprite name="logo" size={520} mono="#c8102e" />
      </div>
      <div className="atmo-mask atmo-mask-b">
        <PixelSprite name="logo" size={300} mono="#f5f5f0" />
      </div>
      <div className="atmo-embers">
        {EMBERS.map((e, i) => (
          <span
            key={i}
            className={`ember ${e.hue}`}
            style={
              {
                left: e.left,
                width: e.size,
                height: e.size,
                animationDuration: e.dur,
                animationDelay: e.delay,
                "--drift": e.drift,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
      <div className="atmo-vignette" />
    </div>
  );
}
