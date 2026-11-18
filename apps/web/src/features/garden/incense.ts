import { INCENSE_MAX } from '@/core/incense';

export const BURNER = { x: 400, base: 428, rx: 15, ry: 4 };

export type StickSlot = { index: number; x: number; lean: number; height: number };

const SLOTS: readonly StickSlot[] = [
  { index: 0, x: 400, lean: 0, height: 36 },
  { index: 1, x: 394, lean: -5, height: 32 },
  { index: 2, x: 406, lean: 5, height: 34 },
];

export function burningSticks(lit: number): StickSlot[] {
  return SLOTS.slice(0, Math.min(INCENSE_MAX, Math.max(0, Math.floor(lit))));
}

export function stickTip(slot: StickSlot, top: number): [number, number] {
  const radians = (slot.lean * Math.PI) / 180;
  return [
    slot.x + Math.sin(radians) * slot.height,
    top + slot.height - Math.cos(radians) * slot.height,
  ];
}
