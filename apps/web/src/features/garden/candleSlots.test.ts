import { describe, expect, it } from 'vitest';
import { CANDLE_SLOTS, clusterGlow, clusterSlots } from './candleSlots';
import { fitView } from './view';

describe('candle cluster', () => {
  it('has a slot for every candle up to 15', () => {
    expect(CANDLE_SLOTS).toHaveLength(15);
    const keys = new Set(CANDLE_SLOTS.map((slot) => `${slot.x}:${slot.base}`));
    expect(keys.size).toBe(15);
  });

  it('always shows one candle, and never more than 15', () => {
    expect(clusterSlots(0)).toHaveLength(1);
    expect(clusterSlots(1)).toHaveLength(1);
    expect(clusterSlots(7)).toHaveLength(7);
    expect(clusterSlots(40)).toHaveLength(15);
  });

  it('starts with the candle beside the stone', () => {
    expect(clusterSlots(1)[0]).toMatchObject({ x: 506, base: 418 });
  });

  it('draws back tiers first', () => {
    const bases = clusterSlots(15).map((slot) => slot.base);
    expect(bases).toEqual([...bases].sort((a, b) => a - b));
  });

  it('stays clear of the stone and inside the narrowest view', () => {
    const narrow = fitView(0.4);
    for (const slot of CANDLE_SLOTS) {
      const half = 10 * slot.scale;
      expect(slot.x - half).toBeGreaterThanOrEqual(455);
      expect(slot.x + half).toBeLessThanOrEqual(narrow.x + narrow.width - 14);
    }
  });

  it('spreads the glow as candles are added', () => {
    expect(clusterGlow(0).strength).toBe(0);
    expect(clusterGlow(5).radius).toBeGreaterThan(clusterGlow(1).radius);
    expect(clusterGlow(99)).toEqual(clusterGlow(15));
  });
});
