import { useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { blendForHour, dominantPhase, localHour, mixHex, mixRecord } from '@/core/timeOfDay';
import { buildCanopy, type CanopyLeaf } from './canopy';
import type { FlowerType } from '@/core/flowers';
import { CandleCluster } from './CandleCluster';
import { FlowerVases } from './FlowerVases';
import { IncenseBurner } from './IncenseBurner';
import { StoneWeathering } from './StoneWeathering';
import { buildHedgeRow, type HedgeLobe } from './hedges';
import { FallingLeaves } from './FallingLeaves';
import { Fireflies } from './Fireflies';
import { seededRandom, smoothPath, type Point } from './geometry';
import { ORCHARD, type GardenPalette } from './palette';
import { fitView, GROUND_Y, SCENE_SPAN, viewBox } from './view';

type GardenSceneProps = {
  name: string;
  dates: string;
  label: string;
  now?: Date;
  candlesLit?: number;
  justLit?: boolean;
  flowers?: readonly FlowerType[];
  justPlaced?: boolean;
  incenseLit?: number;
  justLitIncense?: boolean;
  grime?: number;
  seed?: string;
  wiping?: boolean;
  overlays?: readonly SceneOverlay[];
};

export type SceneOverlay = {
  key: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  children: ReactNode;
};

export const STONE_PATH = 'M332 404 L332 246 Q332 188 400 188 Q468 188 468 246 L468 404Z';

function stoneLines(name: string): { lines: string[]; size: number } {
  const words = name.split(' ');
  let lines = [name];
  if (name.length > 16 && words.length > 1) {
    let best = 1;
    let bestDiff = Infinity;
    for (let i = 1; i < words.length; i += 1) {
      const diff = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = i;
      }
    }
    lines = [words.slice(0, best).join(' '), words.slice(best).join(' ')];
  }
  const longest = Math.max(...lines.map((line) => line.length));
  return { lines, size: Math.max(9, Math.min(19, (19 * 13) / Math.max(13, longest))) };
}

const { left: SPAN_LEFT, right: SPAN_RIGHT } = SCENE_SPAN;
const SPAN_WIDTH = SPAN_RIGHT - SPAN_LEFT;

function closeToGround(points: readonly Point[]): string {
  const [lastX] = points[points.length - 1]!;
  const [firstX] = points[0]!;
  return `${smoothPath(points)} L${lastX} ${GROUND_Y} L${firstX} ${GROUND_Y}Z`;
}

const BACKDROP = (() => {
  const random = seededRandom(5);
  const hill: Point[] = [];
  for (let x = SPAN_LEFT; x <= SPAN_RIGHT; x += 180) {
    hill.push([x, 262 + Math.sin(x / 260) * 18 + (random() - 0.5) * 20]);
  }
  return {
    farHill: closeToGround(hill),
    ground: closeToGround([
      [SPAN_LEFT, 380],
      [-400, 368],
      [0, 372],
      [400, 360],
      [800, 374],
      [1200, 366],
      [SPAN_RIGHT, 378],
    ]),
  };
})();

const HEDGE_SPAN = { from: -420, to: 1220 };

const HEDGES = {
  back: buildHedgeRow({ ...HEDGE_SPAN, base: 336, radius: [30, 44], seed: 21 }),
  front: buildHedgeRow({ ...HEDGE_SPAN, base: 360, radius: [24, 36], gap: [330, 470], seed: 22 }),
};

function Hedge({
  lobes,
  color,
  shade,
  light,
}: {
  lobes: HedgeLobe[];
  color: string;
  shade: string;
  light: string;
}) {
  return (
    <g aria-hidden="true">
      {lobes.map((lobe, index) => (
        <g key={index}>
          <path d={lobe.shade} fill={shade} />
          <path d={lobe.light} fill={light} />
          <path d={lobe.body} fill={color} />
          <path d={lobe.tips} fill={light} opacity="0.7" />
        </g>
      ))}
    </g>
  );
}

const PATH = 'M352 500 C374 456 391 428 388 404 L412 404 C409 428 426 456 448 500Z';

function leafFill(tone: number, p: GardenPalette): string {
  return tone < 0.5
    ? mixHex(p.leafShade, p.leaf, tone * 2)
    : mixHex(p.leaf, p.leafLight, (tone - 0.5) * 2);
}

const RIB_OPACITY = [0.1, 0.26, 0.34] as const;
const LIGHT_MIX = [0.12, 0.3, 0.38] as const;

function Leaves({ leaves, p }: { leaves: CanopyLeaf[]; p: GardenPalette }) {
  return leaves.map((leaf, index) => {
    const fill = leafFill(leaf.tone, p);
    return (
      <g
        key={index}
        transform={`translate(${leaf.x.toFixed(1)} ${leaf.y.toFixed(1)}) rotate(${leaf.angle.toFixed(1)})`}
      >
        <path d={leaf.shape.outline} fill={fill} />
        <path d={leaf.shape.light} fill={mixHex(fill, p.leafLight, LIGHT_MIX[leaf.layer])} />
        {leaf.blotch ? (
          <ellipse
            cx={leaf.blotch.x}
            cy={leaf.blotch.y}
            rx={leaf.blotch.r * 1.4}
            ry={leaf.blotch.r}
            fill={p.leafShade}
            opacity="0.35"
          />
        ) : null}
        <path
          d={leaf.shape.ribs}
          fill="none"
          stroke={p.leafVein}
          strokeOpacity={RIB_OPACITY[leaf.layer]}
          strokeWidth={leaf.layer === 0 ? 0.5 : 0.6}
          strokeLinecap="round"
        />
      </g>
    );
  });
}

export function GardenScene({
  name,
  dates,
  label,
  now,
  candlesLit = 0,
  justLit = false,
  flowers = [],
  justPlaced = false,
  incenseLit = 0,
  justLitIncense = false,
  grime = 0,
  seed = name,
  wiping = false,
  overlays = [],
}: GardenSceneProps) {
  const [loadedAt] = useState(() => now ?? new Date());
  const [fireflyRoll] = useState(() => Math.random());
  const [aspect, setAspect] = useState(1.6);
  const ref = useRef<SVGSVGElement>(null);
  const blend = blendForHour(localHour(loadedAt));
  const p: GardenPalette = mixRecord(ORCHARD[blend.from], ORCHARD[blend.to], blend.t);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const id = (key: string) => `${key}-${uid}`;
  const url = (key: string) => `url(#${id(key)})`;
  const { lines, size } = stoneLines(name);
  const lineHeight = size * 1.15;
  const nameTop = 276 - ((lines.length - 1) * lineHeight) / 2;
  const view = fitView(aspect);
  const canopy = useMemo(() => buildCanopy(fitView(aspect)), [aspect]);
  const right = view.x + view.width;
  const rim = 0.08 + 0.3 * p.sunGlow;
  const sunX = Math.min(620, right - 90);
  const sunY = Math.min(175, view.y + canopy.depth + 40);
  const sunR = Math.min(40, Math.max(24, view.width * 0.05));
  const fireflies =
    p.fireflyMax < 1 ? 0 : Math.round(p.fireflyMin + fireflyRoll * (p.fireflyMax - p.fireflyMin));

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const update = () => {
      const box = node.getBoundingClientRect();
      if (box.width > 0 && box.height > 0)
        setAspect(Math.round((box.width / box.height) * 50) / 50);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const place = (overlay: SceneOverlay) => ({
    left: `${((overlay.x - view.x) / view.width) * 100}%`,
    top: `${((overlay.y - view.y) / view.height) * 100}%`,
    width: `${((overlay.width ?? 0) / view.width) * 100}%`,
    height: `${((overlay.height ?? 0) / view.height) * 100}%`,
  });

  return (
    <>
      <svg
        ref={ref}
        viewBox={viewBox(view)}
        preserveAspectRatio="xMidYMax slice"
        role="img"
        aria-label={label}
        data-phase={dominantPhase(blend)}
        className="block h-full w-full"
      >
        <defs>
          <linearGradient id={id('sky')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={p.skyTop} />
            <stop offset="1" stopColor={p.skyBottom} />
          </linearGradient>
          <radialGradient id={id('sun')}>
            <stop offset="0" stopColor={p.sun} stopOpacity={p.sunGlow} />
            <stop offset="1" stopColor={p.sun} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={id('firefly')}>
            <stop offset="0" stopColor={p.fireflyHalo} stopOpacity="0.55" />
            <stop offset="1" stopColor={p.fireflyHalo} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={id('haze')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={p.haze} stopOpacity="0" />
            <stop offset="1" stopColor={p.haze} stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id={id('ground')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={p.ground} />
            <stop offset="1" stopColor={p.groundShade} />
          </linearGradient>
          <linearGradient id={id('stone')} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={p.stoneShade} />
            <stop offset="0.6" stopColor={p.stone} />
            <stop offset="1" stopColor={p.stoneShade} />
          </linearGradient>
          <linearGradient id={id('wax')} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={p.waxShade} />
            <stop offset="0.6" stopColor={p.wax} />
            <stop offset="1" stopColor={p.waxShade} />
          </linearGradient>
          <filter id={id('soft')} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <filter id={id('glow')} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
          <filter id={id('grain')}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" />
            <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.28  0 0 0 0 0.2  0 0 0 0.1 0" />
          </filter>
        </defs>

        <rect x={view.x} y={view.y} width={view.width} height={view.height} fill={url('sky')} />
        <circle cx={sunX} cy={sunY} r="190" fill={url('sun')} />
        <circle cx={sunX} cy={sunY} r={sunR} fill={p.sun} opacity="0.92" />
        <path d={BACKDROP.farHill} fill={p.farHill} />
        <rect x={SPAN_LEFT} y="220" width={SPAN_WIDTH} height="120" fill={url('haze')} />
        <Hedge
          lobes={HEDGES.back}
          color={mixHex(p.hedge, p.haze, 0.35)}
          shade={mixHex(p.hedgeShade, p.haze, 0.3)}
          light={mixHex(mixHex(p.hedge, p.sun, rim), p.haze, 0.35)}
        />
        <Hedge
          lobes={HEDGES.front}
          color={p.hedge}
          shade={p.hedgeShade}
          light={mixHex(p.hedge, p.sun, rim)}
        />
        <path d={BACKDROP.ground} fill={url('ground')} />
        <path d={PATH} fill={p.path} opacity="0.75" />

        <ellipse
          cx="400"
          cy="406"
          rx="86"
          ry="11"
          fill={p.shadow}
          opacity="0.18"
          filter={url('soft')}
        />
        <path
          d="M332 404 L332 246 Q332 188 400 188 Q468 188 468 246 L468 404Z"
          fill={url('stone')}
        />
        <path d="M384 226 Q400 210 416 226 Q400 240 384 226Z" fill={p.engraving} opacity="0.45" />
        <text
          textAnchor="middle"
          fontFamily="Fraunces, Georgia, serif"
          fontSize={size}
          fill={p.engraving}
        >
          {lines.map((line, index) => (
            <tspan key={index} x="400" y={nameTop + index * lineHeight}>
              {line}
            </tspan>
          ))}
        </text>
        <text
          x="400"
          y={nameTop + (lines.length - 1) * lineHeight + 26}
          textAnchor="middle"
          fontFamily="Fraunces, Georgia, serif"
          fontSize="13"
          fill={p.engraving}
        >
          {dates}
        </text>

        <StoneWeathering
          level={grime}
          seed={seed}
          wiping={wiping}
          stonePath={STONE_PATH}
          p={p}
          id={id}
        />

        <FlowerVases types={flowers} justPlaced={justPlaced} p={p} id={id} />

        <CandleCluster lit={candlesLit} justLit={justLit} p={p} glow={url('glow')} id={id} />
        <IncenseBurner lit={incenseLit} justLit={justLitIncense} p={p} id={id} />

        <g aria-hidden="true" data-canopy="">
          <Leaves leaves={canopy.leaves.filter((leaf) => leaf.layer === 0)} p={p} />
          {canopy.boughs.map((d, index) => (
            <path key={index} d={d} fill={p.wood} />
          ))}
          <path
            d={canopy.twigs}
            fill="none"
            stroke={p.twig}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <Leaves leaves={canopy.leaves.filter((leaf) => leaf.layer === 1)} p={p} />
          <Leaves leaves={canopy.leaves.filter((leaf) => leaf.layer === 2)} p={p} />
        </g>

        <FallingLeaves
          count={view.width > 900 ? 4 : 3}
          colors={[0.45, 0.7, 0.9].map((tone) => {
            const fill = leafFill(tone, p);
            return { fill, light: mixHex(fill, p.leafLight, 0.35), vein: p.leafVein };
          })}
          area={{
            left: view.x + 30,
            right: right - 30,
            top: view.y + canopy.depth * 0.6,
            bottom: 470,
          }}
        />
        <Fireflies
          count={fireflies}
          glow={p.fireflyGlow}
          core={p.firefly}
          halo={url('firefly')}
          area={{
            left: view.x + 20,
            right: right - 20,
            top: Math.max(view.y + canopy.depth + 20, 250),
            bottom: 470,
          }}
        />
        <rect
          x={view.x}
          y={view.y}
          width={view.width}
          height={view.height}
          filter={url('grain')}
          style={{ mixBlendMode: 'multiply' }}
        />
      </svg>
      {overlays.map((overlay) => (
        <div
          key={overlay.key}
          className="absolute"
          style={place(overlay)}
          data-overlay={overlay.key}
        >
          {overlay.children}
        </div>
      ))}
    </>
  );
}
