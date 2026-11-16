import { describe, expect, it } from 'vitest';
import { MAX_OPACITY } from '@/core/weathering';
import { buildMoss, spotOpacity, STONE, TEXT_BAND } from './moss';

describe('moss', () => {
  it('is the same for a memorial every time, and different between memorials', () => {
    expect(buildMoss('a')).toEqual(buildMoss('a'));
    expect(buildMoss('a')).not.toEqual(buildMoss('b'));
  });

  it('stays on and right around the stone', () => {
    for (const spot of buildMoss('rosa')) {
      expect(spot.x).toBeGreaterThanOrEqual(STONE.left - 14);
      expect(spot.x).toBeLessThanOrEqual(STONE.right + 14);
      expect(spot.y).toBeGreaterThanOrEqual(STONE.top);
      expect(spot.y).toBeLessThanOrEqual(STONE.base + 10);
    }
  });

  it('keeps lichen off the name and dates', () => {
    for (const spot of buildMoss('rosa').filter((s) => s.kind === 'lichen')) {
      expect(spot.y <= TEXT_BAND.top || spot.y >= TEXT_BAND.bottom).toBe(true);
    }
  });

  it('grows in as the stone weathers and never passes the cap', () => {
    const spots = buildMoss('rosa');
    const shown = (level: number) => spots.filter((s) => spotOpacity(s, level) > 0).length;
    expect(shown(0)).toBe(0);
    expect(shown(0.18)).toBeGreaterThan(0);
    expect(shown(0.5)).toBeGreaterThan(shown(0.18));
    expect(Math.max(...spots.map((s) => spotOpacity(s, 1)))).toBeLessThanOrEqual(MAX_OPACITY);
  });
});
