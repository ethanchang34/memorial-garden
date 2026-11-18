import { describe, expect, it } from 'vitest';
import { BURNER, burningSticks, stickTip } from './incense';

describe('burningSticks', () => {
  it('fills the centre first and holds at most three', () => {
    expect(burningSticks(0)).toEqual([]);
    expect(burningSticks(1).map((slot) => slot.index)).toEqual([0]);
    expect(burningSticks(9)).toHaveLength(3);
  });

  it('keeps every tip above the bowl and below the name on the stone', () => {
    for (const slot of burningSticks(3)) {
      const top = BURNER.base - slot.height;
      const [, y] = stickTip(slot, top);
      expect(y).toBeLessThan(BURNER.base);
      expect(y).toBeGreaterThan(330);
    }
  });
});
