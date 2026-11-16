import { MAX_OPACITY } from '@/core/weathering';
import { seededRandom } from './geometry';

export type MossKind = 'moss' | 'lichen' | 'tuft';

export type MossSpot = {
  kind: MossKind;
  x: number;
  y: number;
  r: number;
  threshold: number;
  lobes: readonly (readonly [dx: number, dy: number, r: number])[];
};

export const STONE = { left: 332, right: 468, top: 188, shoulder: 246, base: 404 };
export const TEXT_BAND = { top: 236, bottom: 322 };

export function hashSeed(value: string): number {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function onArc(t: number): [number, number] {
  const mid = (STONE.left + STONE.right) / 2;
  if (t < 0.5) {
    const u = t * 2;
    const x = (1 - u) ** 2 * STONE.left + 2 * (1 - u) * u * STONE.left + u ** 2 * mid;
    const y = (1 - u) ** 2 * STONE.shoulder + 2 * (1 - u) * u * STONE.top + u ** 2 * STONE.top;
    return [x, y];
  }
  const u = (t - 0.5) * 2;
  const x = (1 - u) ** 2 * mid + 2 * (1 - u) * u * STONE.right + u ** 2 * STONE.right;
  const y = (1 - u) ** 2 * STONE.top + 2 * (1 - u) * u * STONE.top + u ** 2 * STONE.shoulder;
  return [x, y];
}

export function buildMoss(seed: string): MossSpot[] {
  const rand = seededRandom(hashSeed(seed));
  const between = (min: number, max: number) => min + rand() * (max - min);
  const lobes = (r: number, count: number) =>
    Array.from({ length: count }, () => {
      const angle = rand() * Math.PI;
      return [
        Math.cos(angle) * r * 0.8,
        -Math.sin(angle) * r * 0.5,
        r * between(0.45, 0.75),
      ] as const;
    });
  const spots: MossSpot[] = [];
  const add = (kind: MossKind, x: number, y: number, r: number, threshold: number) =>
    spots.push({
      kind,
      x,
      y,
      r,
      threshold,
      lobes: kind === 'lichen' ? [] : lobes(r, kind === 'moss' ? 4 + Math.floor(rand() * 3) : 3),
    });

  for (let i = 0; i < 22; i += 1) {
    add(
      'moss',
      between(STONE.left, STONE.right),
      between(380, STONE.base + 4),
      between(6, 13),
      between(0, 0.55),
    );
  }
  for (let i = 0; i < 14; i += 1) {
    const left = rand() < 0.5;
    const x = left
      ? between(STONE.left - 2, STONE.left + 12)
      : between(STONE.right - 12, STONE.right + 2);
    add('moss', x, between(TEXT_BAND.top + 50, 382), between(4, 9), between(0.15, 0.75));
  }
  for (let i = 0; i < 12; i += 1) {
    const [x, y] = onArc(between(0.08, 0.92));
    add('moss', x, y + between(0, 6), between(4, 8), between(0.3, 0.85));
  }
  for (let i = 0; i < 16; i += 1) {
    let y = between(204, 378);
    if (y > TEXT_BAND.top && y < TEXT_BAND.bottom)
      y = rand() < 0.5 ? between(204, TEXT_BAND.top) : between(TEXT_BAND.bottom, 378);
    add('lichen', between(STONE.left + 10, STONE.right - 10), y, between(2, 5), between(0.25, 0.9));
  }
  for (let i = 0; i < 18; i += 1) {
    add(
      'tuft',
      between(STONE.left - 14, STONE.right + 14),
      between(STONE.base + 1, STONE.base + 9),
      between(4, 9),
      between(0, 0.6),
    );
  }
  return spots;
}

export function spotOpacity(spot: MossSpot, level: number): number {
  const t = Math.min(1, Math.max(0, (level - spot.threshold) / 0.2));
  return MAX_OPACITY * t * t * (3 - 2 * t);
}
