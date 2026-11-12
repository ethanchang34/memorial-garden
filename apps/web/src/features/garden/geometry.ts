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

export type LeafSpec = {
  length: number;
  width: number;
  bend: number;
  asym: number;
  widest: number;
  curl: number;
};

export type LeafShape = {
  outline: string;
  light: string;
  ribs: string;
  veins: number;
};

const LEAF_SAMPLES = [0, 0.06, 0.16, 0.3, 0.45, 0.6, 0.74, 0.86, 0.95, 1];

export function leafShape({ length, width, bend, asym, widest, curl }: LeafSpec): LeafShape {
  const k = Math.log(0.5) / Math.log(Math.min(0.6, Math.max(0.25, widest)));
  const half = (t: number) => (width / 2) * Math.pow(Math.sin(Math.PI * Math.pow(t, k)), 0.85);
  const rib = (t: number) => 4 * bend * t * (1 - t) + curl * t * t * t;
  const upper = LEAF_SAMPLES.map((t) => [t * length, rib(t) - half(t) * (1 + asym)] as const);
  const lower = LEAF_SAMPLES.map((t) => [t * length, rib(t) + half(t) * (1 - asym)] as const);
  const midrib = LEAF_SAMPLES.slice(0, -1).map((t) => [t * length, rib(t)] as const);
  const tail = (d: string) => d.replace(/^M[^C]*/, '');
  const outline = `${smoothPath(upper)}${tail(smoothPath([...lower].reverse()))}Z`;
  const light = `${smoothPath(upper)} L${(0.95 * length).toFixed(1)} ${rib(0.95).toFixed(1)}${tail(smoothPath([...midrib].reverse()))}Z`;
  const count = length > 26 ? 5 : 4;
  const fmt = (n: number) => n.toFixed(1);
  let ribs = `M${fmt(-length * 0.14)} ${fmt(-bend * 0.4)} L0 0${tail(smoothPath(midrib))}`;
  for (let i = 0; i < count; i += 1) {
    const t = 0.16 + (i * 0.58) / (count - 1);
    const end = Math.min(0.97, t + 0.15);
    for (const side of [-1, 1]) {
      const spread = side < 0 ? 1 + asym : 1 - asym;
      const sx = t * length;
      const sy = rib(t);
      const cx = sx + length * 0.04;
      const cy = sy + side * half(t) * 0.42 * spread;
      const ex = end * length;
      const ey = rib(end) + side * half(end) * 0.78 * spread;
      ribs += ` M${fmt(sx)} ${fmt(sy)} Q${fmt(cx)} ${fmt(cy)} ${fmt(ex)} ${fmt(ey)}`;
    }
  }
  return { outline, light, ribs, veins: count };
}
