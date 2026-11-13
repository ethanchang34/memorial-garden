import { describe, expect, it } from 'vitest';
import { buildCanopy } from './canopy';
import { leafShape } from './geometry';
import { buildHedgeRow } from './hedges';
import { fitView, GROUND_Y, SCENE_SPAN } from './view';

const STONE = { left: 332, right: 468, top: 188 };
const VASE_LEFT = 266;
const CANDLE_RIGHT = 528;

describe('fitView', () => {
  for (const aspect of [0.4, 0.58, 0.94, 1.6, 2, 2.7, 2.96, 4, 6]) {
    it(`keeps the stone, vase and candle in view at aspect ${aspect}`, () => {
      const view = fitView(aspect);
      expect(view.y + view.height).toBe(GROUND_Y);
      expect(view.x).toBeLessThanOrEqual(VASE_LEFT);
      expect(view.x + view.width).toBeGreaterThanOrEqual(CANDLE_RIGHT);
      expect(view.y).toBeLessThan(STONE.top - 60);
      expect(view.x).toBeGreaterThan(SCENE_SPAN.left);
      expect(view.x + view.width).toBeLessThan(SCENE_SPAN.right);
    });
  }

  it('matches the container shape within the supported range', () => {
    const view = fitView(2);
    expect(view.width / view.height).toBeCloseTo(2);
    expect(view.x + view.width / 2).toBe(400);
  });
});

describe('leafShape', () => {
  it('draws an outline, a lit half and veins', () => {
    const leaf = leafShape({ length: 30, width: 12, bend: 1, asym: 0.1, widest: 0.4, curl: 1 });
    expect(leaf.outline).toMatch(/^M.*Z$/);
    expect(leaf.light).toMatch(/^M.*Z$/);
    expect(leaf.veins).toBe(5);
    expect(leaf.ribs.match(/M/g)).toHaveLength(1 + leaf.veins * 2);
  });
});

describe('buildCanopy', () => {
  it('is the same every time for the same view', () => {
    const view = fitView(1.6);
    expect(buildCanopy(view)).toEqual(buildCanopy(view));
  });

  for (const aspect of [0.58, 1.6, 2.96]) {
    it(`frames the top without covering the stone at aspect ${aspect}`, () => {
      const view = fitView(aspect);
      const canopy = buildCanopy(view);
      expect(canopy.leaves.length).toBeGreaterThan(60);
      expect(new Set(canopy.leaves.map((leaf) => leaf.layer))).toEqual(new Set([0, 1, 2]));
      for (const leaf of canopy.leaves) {
        expect(leaf.y).toBeLessThanOrEqual(view.y + canopy.depth);
        const overStone = leaf.x > STONE.left - 20 && leaf.x < STONE.right + 20;
        if (overStone) expect(leaf.y).toBeLessThan(STONE.top - 30);
      }
    });
  }
});

describe('buildHedgeRow', () => {
  it('is repeatable and leaves the gap behind the stone open', () => {
    const spec = {
      from: -400,
      to: 1200,
      base: 360,
      radius: [24, 36],
      gap: [330, 470],
      seed: 3,
    } as const;
    const row = buildHedgeRow(spec);
    expect(buildHedgeRow(spec)).toEqual(row);
    expect(row.length).toBeGreaterThan(40);
    for (const lobe of row) {
      const x = Number(/^M(-?[\d.]+)/.exec(lobe.shade)![1]);
      expect(x <= 350 || x >= 470).toBe(true);
    }
  });
});
