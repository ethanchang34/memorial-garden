import { describe, expect, it } from 'vitest';
import { grimeLevel } from './weathering';

const now = new Date('2026-11-20T12:00:00Z');
const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString();

describe('grimeLevel', () => {
  it('is clean right after cleaning', () => {
    expect(grimeLevel(daysAgo(0), now)).toBe(0);
  });

  it('shows faint moss by about a week', () => {
    expect(grimeLevel(daysAgo(7), now)).toBeCloseTo(0.18, 2);
  });

  it('is heavy by a month and full at 60 days', () => {
    expect(grimeLevel(daysAgo(30), now)).toBeGreaterThan(0.5);
    expect(grimeLevel(daysAgo(60), now)).toBe(1);
    expect(grimeLevel(daysAgo(400), now)).toBe(1);
  });

  it('treats missing, invalid and future dates as clean', () => {
    expect(grimeLevel(null, now)).toBe(0);
    expect(grimeLevel('not a date', now)).toBe(0);
    expect(grimeLevel(daysAgo(-3), now)).toBe(0);
  });
});
