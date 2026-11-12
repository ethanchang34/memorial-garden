import { describe, expect, it } from 'vitest';
import { blendForHour, dominantPhase, mixHex, mixRecord } from './timeOfDay';

describe('blendForHour', () => {
  it('sits exactly on each keyframe', () => {
    expect(blendForHour(7)).toEqual({ from: 'morning', to: 'day', t: 0 });
    expect(blendForHour(13)).toEqual({ from: 'day', to: 'golden', t: 0 });
    expect(blendForHour(18.5)).toEqual({ from: 'golden', to: 'evening', t: 0 });
    expect(blendForHour(21)).toEqual({ from: 'evening', to: 'night', t: 0 });
    expect(blendForHour(22.5)).toEqual({ from: 'night', to: 'night', t: 0 });
  });

  it('blends between keyframes', () => {
    const blend = blendForHour(19.75);
    expect(blend.from).toBe('golden');
    expect(blend.to).toBe('evening');
    expect(blend.t).toBeCloseTo(0.5);
    expect(dominantPhase(blendForHour(19))).toBe('golden');
    expect(dominantPhase(blendForHour(21.5))).toBe('evening');
    expect(dominantPhase(blendForHour(22))).toBe('night');
  });

  it('stays night overnight and dawns through evening into morning', () => {
    expect(dominantPhase(blendForHour(2))).toBe('night');
    expect(dominantPhase(blendForHour(23.9))).toBe('night');
    expect(dominantPhase(blendForHour(5))).toBe('evening');
    expect(dominantPhase(blendForHour(6.5))).toBe('morning');
  });
});

describe('mixing', () => {
  it('mixes colors and numbers', () => {
    expect(mixHex('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mixRecord({ color: '#ff0000', glow: 0 }, { color: '#0000ff', glow: 1 }, 0.25)).toEqual({
      color: '#bf0040',
      glow: 0.25,
    });
  });
});
