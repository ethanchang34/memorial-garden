import { describe, expect, it, vi } from 'vitest';
import { lightCandle, withNewCandle, type LightCandleDeps } from './candles';

function deps(overrides: Partial<LightCandleDeps> = {}) {
  const calls: string[] = [];
  const base: LightCandleDeps = {
    captcha: {
      getToken: vi.fn(() => {
        calls.push('captcha');
        return Promise.resolve('token-1');
      }),
    },
    auth: {
      signInAsVisitor: vi.fn((token: string | undefined) => {
        calls.push(`visitor:${token ?? 'none'}`);
        return Promise.resolve({ id: 'v1', isAnonymous: true });
      }),
    },
    profiles: {
      setTimeZone: vi.fn((zone: string) => {
        calls.push(`zone:${zone}`);
        return Promise.resolve(zone);
      }),
    },
    candles: {
      light: vi.fn((id: string) => {
        calls.push(`light:${id}`);
        return Promise.resolve({ lit: 1, litUntil: '2026-11-15T00:00:00Z', litToday: true });
      }),
    },
    timeZone: () => 'America/Chicago',
    ...overrides,
  };
  return { deps: base, calls };
}

describe('lightCandle', () => {
  it('signs a new visitor in behind the captcha and sets their day before lighting', async () => {
    const { deps: d, calls } = deps();
    const state = await lightCandle(d, null, 'm1');
    expect(calls).toEqual(['captcha', 'visitor:token-1', 'zone:America/Chicago', 'light:m1']);
    expect(state.lit).toBe(1);
  });

  it('lights straight away for someone already in a session', async () => {
    const { deps: d, calls } = deps();
    await lightCandle(d, { id: 'u1', isAnonymous: false }, 'm1');
    expect(calls).toEqual(['light:m1']);
  });

  it('still lights when the time zone cannot be saved', async () => {
    const { deps: d, calls } = deps({
      profiles: { setTimeZone: () => Promise.reject(new Error('offline')) },
    });
    await lightCandle(d, null, 'm1');
    expect(calls).toEqual(['captcha', 'visitor:token-1', 'light:m1']);
  });

  it('does not light when the captcha fails', async () => {
    const { deps: d, calls } = deps({
      captcha: { getToken: () => Promise.reject(new Error('captcha')) },
    });
    await expect(lightCandle(d, null, 'm1')).rejects.toThrow('captcha');
    expect(calls).toEqual([]);
  });
});

describe('withNewCandle', () => {
  const now = new Date('2026-11-16T12:00:00Z');

  it('adds to a burning cluster and restarts the timer', () => {
    const next = withNewCandle({ lit: 4, litUntil: '2026-11-17T00:00:00Z', litToday: false }, now);
    expect(next).toEqual({ lit: 5, litUntil: '2026-11-19T12:00:00.000Z', litToday: true });
  });

  it('starts a new cluster once the candles have gone out', () => {
    const next = withNewCandle({ lit: 9, litUntil: '2026-11-15T00:00:00Z', litToday: false }, now);
    expect(next.lit).toBe(1);
  });

  it('never grows past the cluster limit', () => {
    const next = withNewCandle({ lit: 15, litUntil: '2026-11-17T00:00:00Z', litToday: false }, now);
    expect(next.lit).toBe(15);
  });
});
