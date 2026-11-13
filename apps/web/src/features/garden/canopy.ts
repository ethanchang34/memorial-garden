import { leafShape, seededRandom, smoothPath, type LeafShape, type Point } from './geometry';
import type { View } from './view';

export type CanopyLeaf = {
  x: number;
  y: number;
  angle: number;
  layer: 0 | 1 | 2;
  tone: number;
  shape: LeafShape;
  blotch: { x: number; y: number; r: number } | null;
};

export type Canopy = {
  depth: number;
  boughs: string[];
  twigs: string;
  leaves: CanopyLeaf[];
};

type Curve = readonly [Point, Point, Point, Point];

const STONE_LEFT = 300;
const STONE_RIGHT = 520;
const STONE_TOP = 150;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function cubicAt([a, b, c, d]: Curve, t: number): Point {
  const u = 1 - t;
  return [
    u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
    u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1],
  ];
}

function cubicAngle([a, b, c, d]: Curve, t: number): number {
  const u = 1 - t;
  const dx = 3 * u * u * (b[0] - a[0]) + 6 * u * t * (c[0] - b[0]) + 3 * t * t * (d[0] - c[0]);
  const dy = 3 * u * u * (b[1] - a[1]) + 6 * u * t * (c[1] - b[1]) + 3 * t * t * (d[1] - c[1]);
  return Math.atan2(dy, dx);
}

function taperedPath(curve: Curve, startWidth: number, endWidth: number): string {
  const steps = 14;
  const sideA: Point[] = [];
  const sideB: Point[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const [x, y] = cubicAt(curve, t);
    const angle = cubicAngle(curve, t) + Math.PI / 2;
    const half = (startWidth + (endWidth - startWidth) * t) / 2;
    sideA.push([x + Math.cos(angle) * half, y + Math.sin(angle) * half]);
    sideB.push([x - Math.cos(angle) * half, y - Math.sin(angle) * half]);
  }
  const back = smoothPath([...sideB].reverse()).replace(/^M/, ' L');
  return `${smoothPath(sideA)}${back}Z`;
}

export function canopyDepth(view: View): number {
  return clamp(view.height * 0.32, 95, 200);
}

export function buildCanopy(view: View, seed = 11): Canopy {
  const random = seededRandom(seed);
  const between = (min: number, max: number) => min + random() * (max - min);
  const depth = canopyDepth(view);
  const top = view.y;
  const floor = top + depth;
  const nearStone = floor > STONE_TOP;
  const boughs: string[] = [];
  const leaves: CanopyLeaf[] = [];
  let twigs = '';

  function addLeaf(x: number, y: number, angle: number, layer: 0 | 1 | 2, size: number) {
    if (random() < 0.1) return;
    const length = size * between(0.85, 1.15);
    const shape = leafShape({
      length,
      width: length * between(0.36, 0.5),
      bend: length * between(-0.06, 0.06),
      asym: between(-0.12, 0.12),
      widest: between(0.32, 0.48),
      curl: length * between(-0.08, 0.08),
    });
    const tone =
      layer === 0 ? between(0, 0.32) : layer === 1 ? between(0.3, 0.75) : between(0.6, 1);
    const blotch =
      layer > 0 && random() < 0.16
        ? {
            x: length * between(0.4, 0.7),
            y: length * between(-0.08, 0.08),
            r: length * between(0.05, 0.09),
          }
        : null;
    leaves.push({ x, y, angle: (angle * 180) / Math.PI, layer, tone, shape, blotch });
  }

  function cluster(
    cx: number,
    cy: number,
    radius: number,
    count: number,
    layer: 0 | 1 | 2,
    size: number,
    limit: (x: number) => number,
  ) {
    for (let i = 0; i < count; i += 1) {
      const spoke = (i / count) * Math.PI * 2 + between(-0.4, 0.4);
      const towardDown = Math.atan2(Math.sin(Math.PI / 2 - spoke), Math.cos(Math.PI / 2 - spoke));
      const angle = spoke + towardDown * (Math.sin(spoke) < 0 ? 0.3 : 0.15);
      const reach = radius * between(0.1, 0.45);
      const x = limit(cx + Math.cos(spoke) * reach);
      const y = Math.min(floor - size * 0.5, cy + Math.sin(spoke) * reach);
      addLeaf(x, y, angle, layer, size);
    }
  }

  for (const dir of [1, -1] as const) {
    const anchor = dir > 0 ? view.x : view.x + view.width;
    let reach = clamp(view.width * (dir > 0 ? 0.5 : 0.42), 150, 640);
    if (nearStone) reach = Math.min(reach, dir > 0 ? STONE_LEFT - anchor : anchor - STONE_RIGHT);
    reach = nearStone ? Math.max(reach, 110) : Math.max(reach, view.width * 0.62);
    const limit = (x: number) => {
      if (!nearStone) return x;
      return dir > 0 ? Math.min(x, STONE_LEFT - 10) : Math.max(x, STONE_RIGHT + 10);
    };
    const at = (fraction: number) => anchor + dir * reach * fraction;

    const main: Curve = [
      [anchor - dir * 30, top + depth * 0.62],
      [at(0.3), top + depth * 0.2],
      [at(0.68), top + depth * 0.18],
      [at(1), top + depth * 0.5],
    ];
    const upper: Curve = [
      [anchor - dir * 20, top + depth * 0.3],
      [at(0.3), top - depth * 0.04],
      [at(0.6), top - depth * 0.02],
      [at(0.85), top + depth * 0.2],
    ];

    for (let x = 0; x <= reach * 1.08; x += 24) {
      cluster(
        limit(anchor + dir * x),
        top + between(-12, depth * 0.3),
        34,
        5,
        0,
        between(28, 38),
        limit,
      );
    }

    boughs.push(taperedPath(upper, 11, 2.5), taperedPath(main, 19, 3));

    for (const curve of [upper, main]) {
      const spacing = 30 / reach;
      let side = dir;
      for (let t = 0.12; t <= 1; t += spacing * between(0.8, 1.2)) {
        const [bx, by] = cubicAt(curve, t);
        const angle = cubicAngle(curve, t) + side * between(0.45, 1.05);
        const length = between(18, 44) * (1 - t * 0.35);
        const ex = limit(bx + Math.cos(angle) * length);
        const ey = Math.min(floor - 18, by + Math.sin(angle) * length);
        const mx = (bx + ex) / 2 + between(-4, 4);
        const my = (by + ey) / 2 + between(-4, 4);
        twigs += ` M${bx.toFixed(1)} ${by.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`;
        cluster(ex, ey, 30, Math.round(between(6, 10)), 1, between(20, 30), limit);
        if (random() < 0.5) cluster(bx, by, 18, 3, 1, between(18, 26), limit);
        side = -side as 1 | -1;
      }
    }

    const front = Math.max(3, Math.round(reach / 45));
    for (let i = 0; i < front; i += 1) {
      const cx = limit(at(between(0, 0.55)));
      const cy = top + between(depth * 0.05, depth * 0.55);
      cluster(cx, cy, 26, Math.round(between(3, 5)), 2, between(28, 36), limit);
    }
  }

  leaves.sort((a, b) => a.layer - b.layer);
  return { depth, boughs, twigs: twigs.trim(), leaves };
}
