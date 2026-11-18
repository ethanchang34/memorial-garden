import type { FlowerType } from '@/core/flowers';
import { mixHex } from '@/core/timeOfDay';
import {
  bouquet,
  shownVases,
  VASE_MOUTH_Y,
  VASE_ORIGIN,
  vaseTransform,
  type Stem,
} from './flowers';
import { frontRing, leafPath, petalPath, vesselOutline, type Point } from './geometry';
import {
  FLOWER_COLORS,
  sceneLit,
  STEM_COLORS,
  type BloomColors,
  type GardenPalette,
} from './palette';

const VASE_PROFILE: Point[] = [
  [416, 19],
  [410, 24],
  [394, 31],
  [376, 30],
  [360, 22],
  [348, 14],
  [340, 13],
  [VASE_MOUTH_Y, 17],
];

const VASE = vesselOutline(VASE_ORIGIN.x, VASE_PROFILE, 4, 3);
const LIP = frontRing(VASE_ORIGIN.x, VASE.rimY, VASE.rimRx, VASE.rimRy, 13, 2.5);

type FlowerVasesProps = {
  types: readonly FlowerType[];
  justPlaced: boolean;
  p: GardenPalette;
  id: (key: string) => string;
};

export function FlowerVases({ types, justPlaced, p, id }: FlowerVasesProps) {
  const stems = bouquet(types);
  const newest = justPlaced ? stems.length - 1 : -1;
  const lit = (hex: string) => sceneLit(hex, p);
  const url = (key: string) => `url(#${id(key)})`;

  return (
    <g aria-hidden="true" data-slot="vase" data-flowers={stems.length}>
      <defs>
        <linearGradient id={id('vase-clay')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={p.clayShade} />
          <stop offset="0.55" stopColor={p.clay} />
          <stop offset="1" stopColor={mixHex(p.clay, p.clayShade, 0.7)} />
        </linearGradient>
        <filter id={id('vase-grain')} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.6 1.4" numOctaves="2" seed="12" />
          <feColorMatrix values="0 0 0 0 0.25  0 0 0 0 0.12  0 0 0 0 0.06  0 0 0 0.35 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
      </defs>
      {shownVases(stems.length).map((slot) => (
        <g
          key={slot.index}
          transform={vaseTransform(slot)}
          data-vase={slot.index}
          data-stems={stems.filter((stem) => stem.vase === slot.index).length}
        >
          <ellipse
            cx={VASE_ORIGIN.x}
            cy={VASE_ORIGIN.base + 2}
            rx="34"
            ry="6"
            fill={p.shadow}
            opacity="0.2"
          />
          <path d={VASE.body} fill={url('vase-clay')} />
          <path d={VASE.body} fill={p.clay} filter={url('vase-grain')} />
          <ellipse
            cx={VASE_ORIGIN.x}
            cy={VASE.rimY}
            rx={VASE.rimRx}
            ry={VASE.rimRy + 3}
            fill={mixHex(p.clay, p.clayShade, 0.15)}
          />
          <ellipse
            cx={VASE_ORIGIN.x}
            cy={VASE.rimY + 1}
            rx="13"
            ry="2.5"
            fill={mixHex(p.clayShade, p.shadow, 0.4)}
          />
          {stems
            .map((stem, index) => ({ stem, index }))
            .filter(({ stem }) => stem.vase === slot.index)
            .map(({ stem, index }) => (
              <Flower key={stem.key} stem={stem} isNew={index === newest} lit={lit} />
            ))}
          <path d={LIP} fill={mixHex(p.clay, p.clayShade, 0.15)} />
        </g>
      ))}
    </g>
  );
}

function Flower({
  stem,
  isNew,
  lit,
}: {
  stem: Stem;
  isNew: boolean;
  lit: (hex: string) => string;
}) {
  const [bx, by] = stem.base;
  const [cx, cy] = stem.control;
  const [hx, hy] = stem.head;
  const path = `M${bx} ${by} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${hx.toFixed(1)} ${hy.toFixed(1)}`;
  const anchor = (
    <rect x={bx - 60} y={by - 100} width="120" height="100" fill="none" pointerEvents="none" />
  );

  return (
    <g className={isNew ? 'garden-flower-new' : undefined} data-flower={stem.type}>
      {anchor}
      <g className="garden-flower-sway" style={{ animationDuration: `${stem.sway}s` }}>
        {anchor}
        <path
          d={path}
          stroke={lit(STEM_COLORS.stem)}
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={path}
          stroke={lit(STEM_COLORS.light)}
          strokeOpacity="0.5"
          strokeWidth="0.6"
          fill="none"
          transform="translate(0.6 0)"
        />
        {stem.leaves.map((leaf, index) => (
          <g
            key={index}
            transform={`translate(${leaf.at[0].toFixed(1)} ${leaf.at[1].toFixed(1)}) rotate(${leaf.angle.toFixed(1)})`}
          >
            <path d={leafPath(leaf.length, leaf.length * 0.42)} fill={lit(STEM_COLORS.leaf)} />
            <path
              d={`M1 0 Q${(leaf.length * 0.5).toFixed(1)} -0.8 ${(leaf.length * 0.9).toFixed(1)} 0`}
              stroke={lit(STEM_COLORS.leafLight)}
              strokeOpacity="0.7"
              strokeWidth="0.5"
              fill="none"
            />
          </g>
        ))}
        <g
          transform={`translate(${hx.toFixed(1)} ${hy.toFixed(1)}) rotate(${stem.tilt.toFixed(1)})`}
        >
          <Bloom type={stem.type} size={stem.size} lit={lit} />
        </g>
      </g>
    </g>
  );
}

export function Bloom({
  type,
  size: r,
  lit,
}: {
  type: FlowerType;
  size: number;
  lit: (hex: string) => string;
}) {
  const c: BloomColors = FLOWER_COLORS[type];
  const deep = lit(c.deep);
  const mid = lit(c.mid);
  const light = lit(c.light);
  const center = lit(c.center);

  if (type === 'tulip') {
    const f = (n: number) => (n * r).toFixed(2);
    return (
      <g>
        <path
          d={`M${f(-0.5)} ${f(0.35)} C${f(-0.62)} ${f(-0.45)} ${f(-0.22)} ${f(-1.05)} 0 ${f(-1)} C${f(0.22)} ${f(-1.05)} ${f(0.62)} ${f(-0.45)} ${f(0.5)} ${f(0.35)} Q0 ${f(0.7)} ${f(-0.5)} ${f(0.35)}Z`}
          fill={deep}
        />
        <path
          d={`M${f(-0.52)} ${f(0.32)} C${f(-0.6)} ${f(-0.35)} ${f(-0.32)} ${f(-0.9)} ${f(-0.06)} ${f(-0.82)} C${f(0.12)} ${f(-0.35)} ${f(0.1)} ${f(0.25)} ${f(0.02)} ${f(0.58)} Q${f(-0.32)} ${f(0.55)} ${f(-0.52)} ${f(0.32)}Z`}
          fill={mid}
        />
        <path
          d={`M${f(0.52)} ${f(0.32)} C${f(0.6)} ${f(-0.35)} ${f(0.32)} ${f(-0.9)} ${f(0.06)} ${f(-0.82)} C${f(-0.12)} ${f(-0.35)} ${f(-0.1)} ${f(0.25)} ${f(-0.02)} ${f(0.58)} Q${f(0.32)} ${f(0.55)} ${f(0.52)} ${f(0.32)}Z`}
          fill={light}
          opacity="0.9"
        />
      </g>
    );
  }

  if (type === 'rose') {
    return (
      <g transform="scale(1 0.9)">
        {[0, 72, 144, 216, 288].map((angle) => (
          <circle
            key={angle}
            cx={(Math.cos((angle * Math.PI) / 180) * r * 0.42).toFixed(2)}
            cy={(Math.sin((angle * Math.PI) / 180) * r * 0.42).toFixed(2)}
            r={r * 0.52}
            fill={deep}
          />
        ))}
        <circle r={r * 0.66} fill={mid} />
        <path
          d={`M${r * 0.05} ${-r * 0.05} a${r * 0.16} ${r * 0.16} 0 1 1 ${-r * 0.24} ${r * 0.1} a${r * 0.32} ${r * 0.3} 0 1 1 ${r * 0.56} ${r * 0.1} a${r * 0.46} ${r * 0.42} 0 0 1 ${-r * 0.8} ${r * 0.12}`}
          fill="none"
          stroke={center}
          strokeWidth={Math.max(0.6, r * 0.09)}
          strokeLinecap="round"
        />
        <path
          d={`M${-r * 0.5} ${-r * 0.2} q${r * 0.3} ${-r * 0.42} ${r * 0.7} ${-r * 0.32}`}
          fill="none"
          stroke={light}
          strokeOpacity="0.7"
          strokeWidth={Math.max(0.5, r * 0.07)}
          strokeLinecap="round"
        />
      </g>
    );
  }

  const petals = type === 'daisy' ? 14 : 5;
  const length = type === 'daisy' ? r : r * 0.95;
  const width = type === 'daisy' ? r * 0.3 : r * 0.95;
  const tip = type === 'daisy' ? 0.62 : 0.5;
  return (
    <g transform="scale(1 0.86)">
      {Array.from({ length: petals }, (_, index) => {
        const angle = (index * 360) / petals + (type === 'poppy' ? 18 : 0);
        return (
          <g key={index} transform={`rotate(${angle.toFixed(1)})`}>
            <path
              d={petalPath(length, width, tip)}
              fill={deep}
              transform="translate(0.4 0.6)"
              opacity="0.5"
            />
            <path d={petalPath(length, width, tip)} fill={mid} />
            {type === 'poppy' ? (
              <path d={petalPath(length * 0.72, width * 0.62, tip)} fill={light} opacity="0.55" />
            ) : null}
          </g>
        );
      })}
      <circle r={r * (type === 'daisy' ? 0.3 : 0.24)} fill={center} />
      <circle
        cx={-r * 0.06}
        cy={-r * 0.07}
        r={r * 0.09}
        fill={type === 'daisy' ? light : mid}
        opacity="0.6"
      />
    </g>
  );
}
