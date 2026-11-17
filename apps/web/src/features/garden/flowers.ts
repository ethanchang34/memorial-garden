import { FLOWER_MAX, STEMS_PER_VASE, vasesShown, type FlowerType } from '@/core/flowers';
import { seededRandom, type Point } from './geometry';

export type VaseSlot = { index: number; x: number; base: number; scale: number; spread: number };

export const VASE_ORIGIN = { x: 300, base: 416 };
export const VASE_MOUTH_Y = 334;

export const VASE_SLOTS: readonly VaseSlot[] = [
  { index: 0, x: 300, base: 416, scale: 1, spread: 1 },
  { index: 1, x: 262, base: 404, scale: 0.8, spread: 0.7 },
  { index: 2, x: 344, base: 430, scale: 0.72, spread: 0.85 },
];

export const DRAW_ORDER = [1, 0, 2] as const;

const STEM_POINTS: readonly { base: number; head: Point; size: number }[] = [
  { base: 0, head: [0, -74], size: 11 },
  { base: -4, head: [-24, -56], size: 10 },
  { base: 4, head: [24, -60], size: 10.5 },
  { base: -7, head: [-37, -34], size: 9 },
  { base: 7, head: [36, -36], size: 9.5 },
];

export type Stem = {
  key: string;
  vase: number;
  type: FlowerType;
  base: Point;
  control: Point;
  head: Point;
  size: number;
  tilt: number;
  leaves: { at: Point; angle: number; length: number }[];
  sway: number;
};

export function vaseTransform(slot: VaseSlot): string {
  return `translate(${slot.x} ${slot.base}) scale(${slot.scale}) translate(${-VASE_ORIGIN.x} ${-VASE_ORIGIN.base})`;
}

export function shownVases(count: number): VaseSlot[] {
  const shown = vasesShown(count);
  return DRAW_ORDER.filter((index) => index < shown).map((index) => VASE_SLOTS[index]!);
}

export function nextVase(count: number): VaseSlot {
  return VASE_SLOTS[Math.min(VASE_SLOTS.length - 1, Math.floor(count / STEMS_PER_VASE))]!;
}

export function bouquet(types: readonly FlowerType[]): Stem[] {
  return types.slice(0, FLOWER_MAX).map((type, index) => {
    const vase = Math.floor(index / STEMS_PER_VASE);
    const slot = VASE_SLOTS[vase]!;
    const point = STEM_POINTS[index % STEMS_PER_VASE]!;
    const random = seededRandom(index * 97 + 13);
    const jitter = (amount: number) => (random() - 0.5) * amount;
    const base: Point = [VASE_ORIGIN.x + point.base, VASE_MOUTH_Y + 4];
    const head: Point = [
      VASE_ORIGIN.x + point.head[0] * slot.spread + jitter(4),
      VASE_MOUTH_Y + point.head[1] + jitter(5),
    ];
    const control: Point = [
      base[0] + (head[0] - base[0]) * 0.2 + jitter(6),
      base[1] - (base[1] - head[1]) * 0.55,
    ];
    const along = (t: number): Point => [
      (1 - t) ** 2 * base[0] + 2 * (1 - t) * t * control[0] + t ** 2 * head[0],
      (1 - t) ** 2 * base[1] + 2 * (1 - t) * t * control[1] + t ** 2 * head[1],
    ];
    const side = index % 2 === 0 ? 1 : -1;
    return {
      key: `${vase}-${index % STEMS_PER_VASE}`,
      vase,
      type,
      base,
      control,
      head,
      size: point.size + jitter(1.5),
      tilt: (head[0] - base[0]) * 0.45 + jitter(8),
      leaves: [0.38, 0.62].map((t, leaf) => ({
        at: along(t),
        angle: (leaf % 2 ? side : -side) > 0 ? -30 - random() * 20 : -150 + random() * 20,
        length: 11 + random() * 4,
      })),
      sway: 6 + random() * 3,
    };
  });
}
