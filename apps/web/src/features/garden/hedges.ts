import { seededRandom, smoothPath, type Point } from './geometry';

export type HedgeLobe = { shade: string; light: string; body: string; tips: string };

type RowSpec = {
  from: number;
  to: number;
  base: number;
  radius: readonly [number, number];
  gap?: readonly [number, number];
  seed: number;
};

const fmt = (n: number) => n.toFixed(1);

function blob(cx: number, cy: number, r: number, random: () => number): string {
  const points: Point[] = [];
  const count = 26;
  const phase = random() * Math.PI * 2;
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2;
    const tip = i % 2 === 0 ? 0.04 : -0.03;
    const swell = Math.sin(angle * 3 + phase) * 0.05;
    const radius = r * (1 + tip + swell + (random() - 0.5) * 0.05);
    points.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius * 0.92]);
  }
  return smoothPath(points, true);
}

function leafTip(x: number, y: number, angle: number, length: number): string {
  const dx = (Math.cos(angle) * length) / 2;
  const dy = (Math.sin(angle) * length) / 2;
  const nx = -Math.sin(angle) * length * 0.45;
  const ny = Math.cos(angle) * length * 0.45;
  return ` M${fmt(x - dx)} ${fmt(y - dy)} Q${fmt(x + nx)} ${fmt(y + ny)} ${fmt(x + dx)} ${fmt(y + dy)} Q${fmt(x - nx)} ${fmt(y - ny)} ${fmt(x - dx)} ${fmt(y - dy)}Z`;
}

export function buildHedgeRow({ from, to, base, radius, gap, seed }: RowSpec): HedgeLobe[] {
  const random = seededRandom(seed);
  const between = (min: number, max: number) => min + random() * (max - min);
  const lobes: HedgeLobe[] = [];

  function lobe(lx: number, ly: number, lr: number) {
    let tips = '';
    const count = Math.round(lr / 9);
    for (let i = 0; i < count; i += 1) {
      const a = between(-Math.PI * 0.85, -Math.PI * 0.1);
      const d = lr * between(0.45, 0.82);
      tips += leafTip(
        lx + Math.cos(a) * d,
        ly + Math.sin(a) * d * 0.9,
        random() * Math.PI,
        between(3.5, 5.5),
      );
    }
    lobes.push({
      shade: blob(lx, ly, lr, random),
      light: blob(lx + lr * 0.05, ly - lr * 0.1, lr * 0.9, random),
      body: blob(lx - lr * 0.04, ly + lr * 0.02, lr * 0.86, random),
      tips: tips.trim(),
    });
  }

  let x = from;
  while (x < to) {
    const r = between(radius[0], radius[1]);
    const cx = x + r;
    x += r * between(1.35, 1.75);
    if (gap && cx + r * 1.4 > gap[0] && cx - r * 1.4 < gap[1]) continue;
    const top = base - r * between(0.55, 0.8);
    if (random() < 0.5) {
      lobe(cx + between(-0.35, 0.35) * r, top - r * between(0.35, 0.5), r * between(0.45, 0.6));
    }
    lobe(cx, top, r);
    for (const side of [-1, 1]) {
      const lr = r * between(0.55, 0.78);
      lobe(cx + side * r * between(0.65, 0.9), base - lr * between(0.35, 0.6), lr);
    }
  }
  return lobes;
}
