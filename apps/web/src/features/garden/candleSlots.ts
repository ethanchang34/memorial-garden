import { CANDLE_CLUSTER_MAX } from '@/core/candles';

export type CandleSlot = { index: number; x: number; base: number; scale: number; height: number };

const FRONT = { base: 418, scale: 1 };
const MIDDLE = { base: 408, scale: 0.84 };
const BACK = { base: 399, scale: 0.7 };

const ORDER: [tier: typeof FRONT, x: number, height: number][] = [
  [FRONT, 506, 30],
  [MIDDLE, 496, 34],
  [MIDDLE, 516, 28],
  [FRONT, 486, 24],
  [FRONT, 526, 27],
  [BACK, 506, 36],
  [MIDDLE, 536, 31],
  [MIDDLE, 476, 26],
  [FRONT, 466, 22],
  [BACK, 490, 30],
  [BACK, 522, 33],
  [MIDDLE, 545, 25],
  [BACK, 538, 29],
  [BACK, 474, 27],
  [BACK, 548, 34],
];

export const CANDLE_SLOTS: CandleSlot[] = ORDER.map(([tier, x, height], index) => ({
  index,
  x,
  base: tier.base,
  scale: tier.scale,
  height: height * tier.scale,
}));

export const CLUSTER_CENTER = { x: 506, y: 396 };

export function clusterSlots(lit: number): CandleSlot[] {
  const count = Math.min(CANDLE_CLUSTER_MAX, Math.max(1, Math.floor(lit)));
  return CANDLE_SLOTS.slice(0, count).sort((a, b) => a.base - b.base || a.x - b.x);
}

export function clusterGlow(lit: number): { radius: number; strength: number } {
  const count = Math.min(CANDLE_CLUSTER_MAX, Math.max(0, Math.floor(lit)));
  if (count === 0) return { radius: 0, strength: 0 };
  return { radius: 70 + 4 * count, strength: Math.min(1, 0.6 + 0.03 * count) };
}

export function flamePath(x: number, top: number, scale: number): string {
  const h = 13 * scale;
  const w = 3.6 * scale;
  const tip = top - h;
  return [
    `M${x} ${tip}`,
    `C${x + w * 1.1} ${tip + h * 0.4} ${x + w} ${tip + h * 0.78} ${x + w * 0.6} ${top - h * 0.08}`,
    `C${x + w * 0.3} ${top + h * 0.06} ${x - w * 0.3} ${top + h * 0.06} ${x - w * 0.6} ${top - h * 0.08}`,
    `C${x - w} ${tip + h * 0.78} ${x - w * 1.1} ${tip + h * 0.4} ${x} ${tip}Z`,
  ].join(' ');
}
