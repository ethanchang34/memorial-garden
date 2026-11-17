import { describe, expect, it } from 'vitest';
import { FLOWER_MAX } from '@/core/flowers';
import { bouquet, nextVase, shownVases, VASE_SLOTS } from './flowers';
import { fitView } from './view';

describe('bouquet', () => {
  it('fills the first vase before the next and keeps each chosen type', () => {
    const stems = bouquet(['rose', 'tulip', 'daisy', 'poppy', 'rose', 'daisy']);
    expect(stems.map((stem) => stem.vase)).toEqual([0, 0, 0, 0, 0, 1]);
    expect(stems.map((stem) => stem.type)).toEqual([
      'rose',
      'tulip',
      'daisy',
      'poppy',
      'rose',
      'daisy',
    ]);
  });

  it('never draws more than every vase can hold', () => {
    expect(bouquet(Array.from({ length: 20 }, () => 'rose' as const))).toHaveLength(FLOWER_MAX);
  });

  it('draws the same bouquet on every visit', () => {
    expect(bouquet(['rose', 'tulip'])).toEqual(bouquet(['rose', 'tulip']));
  });

  it('keeps every flower head on screen on the narrowest phone', () => {
    const view = fitView(0.4);
    for (const stem of bouquet(Array.from({ length: FLOWER_MAX }, () => 'daisy' as const))) {
      const slot = VASE_SLOTS[stem.vase]!;
      const x = slot.x + (stem.head[0] - 300) * slot.scale;
      expect(x - stem.size * slot.scale).toBeGreaterThanOrEqual(view.x);
      expect(x + stem.size * slot.scale).toBeLessThanOrEqual(view.x + view.width);
    }
  });
});

describe('vases', () => {
  it('shows one vase until it is full, back to front', () => {
    expect(shownVases(0).map((slot) => slot.index)).toEqual([0]);
    expect(shownVases(5).map((slot) => slot.index)).toEqual([1, 0]);
    expect(shownVases(10).map((slot) => slot.index)).toEqual([1, 0, 2]);
  });

  it('points the next flower at the vase with room', () => {
    expect([0, 4, 5, 10, 15].map((count) => nextVase(count).index)).toEqual([0, 0, 1, 2, 2]);
  });
});
