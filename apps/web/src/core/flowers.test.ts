import { describe, expect, it } from 'vitest';
import {
  creditSummary,
  FLOWER_MAX,
  isFlowerType,
  vasesShown,
  withNewFlower,
  type FlowerCredit,
} from './flowers';

const now = new Date('2026-11-16T12:00:00Z');

describe('withNewFlower', () => {
  it('adds the chosen flower to a blooming bouquet and restarts the timer', () => {
    const next = withNewFlower(
      { types: ['rose'], bloomUntil: '2026-11-20T00:00:00Z', placedToday: false },
      'daisy',
      now,
    );
    expect(next).toEqual({
      types: ['rose', 'daisy'],
      bloomUntil: '2026-11-30T12:00:00.000Z',
      placedToday: true,
    });
  });

  it('starts a fresh bouquet once the flowers have faded', () => {
    const next = withNewFlower(
      { types: ['rose', 'tulip'], bloomUntil: '2026-11-01T00:00:00Z', placedToday: false },
      'poppy',
      now,
    );
    expect(next.types).toEqual(['poppy']);
  });

  it('only refreshes the bloom when every vase is full', () => {
    const full = Array.from({ length: FLOWER_MAX }, () => 'tulip' as const);
    const next = withNewFlower(
      { types: full, bloomUntil: '2026-11-20T00:00:00Z', placedToday: false },
      'rose',
      now,
    );
    expect(next.types).toHaveLength(FLOWER_MAX);
    expect(next.types).not.toContain('rose');
  });
});

describe('vasesShown', () => {
  it('shows the next vase once the one before it is full', () => {
    expect([0, 4, 5, 9, 10, 14, 15].map(vasesShown)).toEqual([1, 1, 2, 2, 3, 3, 3]);
  });
});

describe('isFlowerType', () => {
  it('accepts only the flowers the garden can draw', () => {
    expect(isFlowerType('rose')).toBe(true);
    expect(isFlowerType('cactus')).toBe(false);
  });
});

describe('creditSummary', () => {
  const credit = (giverName: string | null): FlowerCredit => ({
    stem: 1,
    id: 'f',
    type: 'rose',
    giverName,
    placedAt: '2026-11-03T12:00:00Z',
    message: null,
    messageHidden: false,
    mine: false,
  });

  it('names the first givers once each and counts the rest', () => {
    expect(
      creditSummary(['Alex C.', 'Sam R.', 'Alex C.', 'Jo P.', null, null].map(credit)),
    ).toEqual({ names: ['Alex C.', 'Sam R.'], others: 1, visitors: 2 });
  });
});
