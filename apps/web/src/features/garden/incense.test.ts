import { describe, expect, it } from 'vitest';
import { CANDLE_SLOTS } from './candleSlots';
import { BURNER, burningSticks, INCENSE_AREA, stickTip } from './incense';

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

describe('placement', () => {
  it('keeps the bowl off the path and clear of every candle', () => {
    const pathRightEdgeAtBowl = 418;
    expect(BURNER.x - BURNER.rx).toBeGreaterThan(pathRightEdgeAtBowl);
    for (const slot of CANDLE_SLOTS)
      expect(slot.x - 10 * slot.scale).toBeGreaterThan(BURNER.x + BURNER.rx);
  });

  it('reaches from above the sticks to below the bowl', () => {
    expect(INCENSE_AREA.y).toBeLessThan(BURNER.base - 9 - 36);
    expect(INCENSE_AREA.y + INCENSE_AREA.height).toBeGreaterThan(BURNER.base + 4);
  });
});
