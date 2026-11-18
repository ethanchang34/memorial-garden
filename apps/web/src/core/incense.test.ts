import { describe, expect, it } from 'vitest';
import { INCENSE_MAX, withNewStick } from './incense';

const now = new Date('2026-11-18T12:00:00Z');

describe('withNewStick', () => {
  it('adds a stick while the others still burn and restarts the day', () => {
    expect(
      withNewStick({ lit: 1, litUntil: '2026-11-18T20:00:00Z', litToday: false }, now),
    ).toEqual({ lit: 2, litUntil: '2026-11-19T12:00:00.000Z', litToday: true });
  });

  it('starts fresh once the incense has burned out', () => {
    expect(
      withNewStick({ lit: 3, litUntil: '2026-11-18T01:00:00Z', litToday: false }, now).lit,
    ).toBe(1);
  });

  it('never holds more than three sticks', () => {
    expect(
      withNewStick({ lit: INCENSE_MAX, litUntil: '2026-11-18T20:00:00Z', litToday: false }, now)
        .lit,
    ).toBe(INCENSE_MAX);
  });
});
