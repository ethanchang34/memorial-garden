export type Point = readonly [number, number];

export function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function smoothPath(points: readonly Point[], closed = false): string {
  if (points.length < 2) return '';
  const at = (index: number): Point => {
    if (closed) return points[(index + points.length) % points.length]!;
    return points[Math.max(0, Math.min(points.length - 1, index))]!;
  };
  const [x0, y0] = at(0);
  let d = `M${x0.toFixed(1)} ${y0.toFixed(1)}`;
  const segments = closed ? points.length : points.length - 1;
  for (let i = 0; i < segments; i += 1) {
    const [ax, ay] = at(i - 1);
    const [bx, by] = at(i);
    const [cx, cy] = at(i + 1);
    const [dx, dy] = at(i + 2);
    const c1x = bx + (cx - ax) / 6;
    const c1y = by + (cy - ay) / 6;
    const c2x = cx - (dx - bx) / 6;
    const c2y = cy - (dy - by) / 6;
    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)}`;
  }
  return closed ? `${d}Z` : d;
}

export type VesselOutline = {
  body: string;
  rimY: number;
  rimRx: number;
  rimRy: number;
};

export function vesselOutline(
  centerX: number,
  profile: readonly Point[],
  rimRy: number,
  baseRy: number,
): VesselOutline {
  const right = profile.map(([y, r]) => [centerX + r, y] as const);
  const left = [...profile].reverse().map(([y, r]) => [centerX - r, y] as const);
  const [rimY, rimR] = profile[profile.length - 1]!;
  const [, baseR] = profile[0]!;
  const rightSide = smoothPath(right);
  const leftSide = smoothPath(left).replace(/^M[^C]*/, '');
  const body = [
    rightSide,
    `A${rimR} ${rimRy} 0 0 0 ${centerX - rimR} ${rimY}`,
    leftSide,
    `A${baseR} ${baseRy} 0 0 0 ${centerX + baseR} ${profile[0]![0]}`,
    'Z',
  ].join(' ');
  return { body, rimY, rimRx: rimR, rimRy };
}

export function frontRing(
  centerX: number,
  y: number,
  outerRx: number,
  outerRy: number,
  innerRx: number,
  innerRy: number,
): string {
  return [
    `M${centerX - outerRx} ${y}`,
    `A${outerRx} ${outerRy} 0 0 0 ${centerX + outerRx} ${y}`,
    `L${centerX + innerRx} ${y}`,
    `A${innerRx} ${innerRy} 0 0 1 ${centerX - innerRx} ${y}`,
    'Z',
  ].join(' ');
}

export function petalPath(length: number, width: number, tipBias = 0.62): string {
  const w = width / 2;
  const shoulder = length * tipBias;
  return [
    'M0 0',
    `C${(w * 0.9).toFixed(1)} ${(-shoulder * 0.35).toFixed(1)} ${(w * 1.15).toFixed(1)} ${(-shoulder).toFixed(1)} ${(w * 0.35).toFixed(1)} ${(-length * 0.96).toFixed(1)}`,
    `Q0 ${(-length * 1.04).toFixed(1)} ${(-w * 0.35).toFixed(1)} ${(-length * 0.96).toFixed(1)}`,
    `C${(-w * 1.15).toFixed(1)} ${(-shoulder).toFixed(1)} ${(-w * 0.9).toFixed(1)} ${(-shoulder * 0.35).toFixed(1)} 0 0Z`,
  ].join(' ');
}

export function leafPath(length: number, width: number): string {
  const w = width / 2;
  return `M0 0 C${(length * 0.25).toFixed(1)} ${(-w * 1.3).toFixed(1)} ${(length * 0.75).toFixed(1)} ${(-w * 1.1).toFixed(1)} ${length.toFixed(1)} 0 C${(length * 0.7).toFixed(1)} ${(w * 0.8).toFixed(1)} ${(length * 0.3).toFixed(1)} ${(w * 0.9).toFixed(1)} 0 0Z`;
}
