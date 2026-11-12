export type Phase = 'morning' | 'day' | 'golden' | 'evening' | 'night';

const STOPS: readonly (readonly [number, Phase])[] = [
  [0, 'night'],
  [4, 'night'],
  [5.5, 'evening'],
  [7, 'morning'],
  [13, 'day'],
  [18.5, 'golden'],
  [21, 'evening'],
  [22.5, 'night'],
  [24, 'night'],
];

export type PhaseBlend = { from: Phase; to: Phase; t: number };

export function blendForHour(hour: number): PhaseBlend {
  const h = ((hour % 24) + 24) % 24;
  for (let i = 0; i < STOPS.length - 1; i += 1) {
    const [startHour, from] = STOPS[i]!;
    const [endHour, to] = STOPS[i + 1]!;
    if (h >= startHour && h < endHour) {
      return { from, to, t: (h - startHour) / (endHour - startHour) };
    }
  }
  return { from: 'night', to: 'night', t: 0 };
}

export function localHour(date: Date): number {
  return date.getHours() + date.getMinutes() / 60;
}

export function dominantPhase(blend: PhaseBlend): Phase {
  return blend.t < 0.5 ? blend.from : blend.to;
}

function channel(hex: string, index: number): number {
  return parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16);
}

export function mixHex(a: string, b: string, t: number): string {
  const parts = [0, 1, 2].map((index) => {
    const value = Math.round(channel(a, index) + (channel(b, index) - channel(a, index)) * t);
    return value.toString(16).padStart(2, '0');
  });
  return `#${parts.join('')}`;
}

export function mixRecord<T extends Record<string, string | number>>(a: T, b: T, t: number): T {
  const result: Record<string, string | number> = {};
  for (const key of Object.keys(a)) {
    const left = a[key]!;
    const right = b[key]!;
    result[key] =
      typeof left === 'number' && typeof right === 'number'
        ? left + (right - left) * t
        : mixHex(String(left), String(right), t);
  }
  return result as T;
}
