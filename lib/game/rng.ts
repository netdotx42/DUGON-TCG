/** Small deterministic PRNG (mulberry32). The state lives inside the encrypted game state. */
export function nextRandom(seed: number): [number, number] {
  let t = (seed + 0x6d2b79f5) >>> 0;
  let r = Math.imul(t ^ (t >>> 15), t | 1);
  r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
  const value = ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  return [value, t];
}

export function shuffle<T>(items: T[], seed: number): [T[], number] {
  const out = items.slice();
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    const [v, ns] = nextRandom(s);
    s = ns;
    const j = Math.floor(v * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return [out, s];
}
