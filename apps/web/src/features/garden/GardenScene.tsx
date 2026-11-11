import { useId, useState } from 'react';
import { blendForHour, dominantPhase, localHour, mixRecord } from '@/core/timeOfDay';
import { frontRing, vesselOutline, type Point } from './geometry';
import { ORCHARD, type GardenPalette } from './palette';

type GardenSceneProps = {
  name: string;
  dates: string;
  label: string;
  now?: Date;
};

const VASE: Point[] = [
  [416, 19],
  [410, 24],
  [394, 31],
  [376, 30],
  [360, 22],
  [348, 14],
  [340, 13],
  [334, 17],
];

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

export function GardenScene({ name, dates, label, now }: GardenSceneProps) {
  const [loadedAt] = useState(() => now ?? new Date());
  const blend = blendForHour(localHour(loadedAt));
  const p: GardenPalette = mixRecord(ORCHARD[blend.from], ORCHARD[blend.to], blend.t);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const id = (key: string) => `${key}-${uid}`;
  const url = (key: string) => `url(#${id(key)})`;
  const { lines, size } = stoneLines(name);
  const lineHeight = size * 1.15;
  const nameTop = 276 - ((lines.length - 1) * lineHeight) / 2;
  const vase = vesselOutline(300, VASE, 4, 3);
  const lip = frontRing(300, vase.rimY, vase.rimRx, vase.rimRy, 13, 2.5);

  return (
    <svg
      viewBox="0 0 800 500"
      role="img"
      aria-label={label}
      data-phase={dominantPhase(blend)}
      className="block h-auto w-full"
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
        <linearGradient id={id('clay')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={p.clayShade} />
          <stop offset="0.65" stopColor={p.clay} />
          <stop offset="1" stopColor={p.clayShade} />
        </linearGradient>
        <linearGradient id={id('wax')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={p.waxShade} />
          <stop offset="0.6" stopColor={p.wax} />
          <stop offset="1" stopColor={p.waxShade} />
        </linearGradient>
        <filter id={id('soft')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id={id('dapple')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter id={id('grain')}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" />
          <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.28  0 0 0 0 0.2  0 0 0 0.1 0" />
        </filter>
      </defs>

      <rect width="800" height="500" fill={url('sky')} />
      <circle cx="620" cy="175" r="190" fill={url('sun')} />
      <circle cx="620" cy="175" r="40" fill={p.sun} opacity="0.92" />
      <path
        d="M0 300 C120 255 220 272 330 258 C450 242 560 272 800 248 L800 500 L0 500Z"
        fill={p.farHill}
      />
      <rect y="220" width="800" height="120" fill={url('haze')} />
      <path
        d="M0 340 C30 296 80 300 112 318 C140 284 196 290 224 316 C256 292 300 300 318 322 L318 500 L0 500Z"
        fill={p.hedge}
      />
      <path
        d="M500 324 C530 292 580 296 606 318 C636 286 690 290 716 314 C746 294 790 300 800 312 L800 500 L500 500Z"
        fill={p.hedge}
      />
      <path
        d="M0 352 C120 340 220 344 318 350 L318 500 L0 500Z"
        fill={p.hedgeShade}
        opacity="0.5"
      />
      <rect x="70" y="326" width="220" height="38" rx="12" fill={p.wall} />
      <path d="M0 372 C200 352 600 360 800 374 L800 500 L0 500Z" fill={url('ground')} />
      <path
        d="M368 500 C382 452 398 424 392 404 L418 404 C414 426 432 456 456 500Z"
        fill={p.path}
        opacity="0.75"
      />

      <ellipse
        cx="400"
        cy="406"
        rx="86"
        ry="11"
        fill="#2f2e2b"
        opacity="0.18"
        filter={url('soft')}
      />
      <path d="M332 404 L332 246 Q332 188 400 188 Q468 188 468 246 L468 404Z" fill={url('stone')} />
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

      <g aria-hidden="true" data-slot="vase">
        <ellipse
          cx="300"
          cy="418"
          rx="34"
          ry="6"
          fill="#2f2e2b"
          opacity="0.2"
          filter={url('soft')}
        />
        <path d={vase.body} fill={url('clay')} />
        <ellipse cx="300" cy={vase.rimY} rx={vase.rimRx} ry={vase.rimRy + 3} fill={p.clay} />
        <ellipse cx="300" cy={vase.rimY + 1} rx="13" ry="2.5" fill={p.clayShade} />
        <path d={lip} fill={p.clay} />
      </g>

      <g aria-hidden="true" data-slot="candle">
        <circle
          cx="508"
          cy="384"
          r="60"
          fill="#ffd88a"
          opacity={0.12 * p.candleGlow}
          filter={url('dapple')}
        />
        <ellipse cx="508" cy="416" rx="20" ry="4" fill={p.wood} opacity="0.7" />
        <rect x="498" y="384" width="20" height="30" rx="4" fill={url('wax')} />
        <ellipse cx="508" cy="385" rx="10" ry="2.5" fill={p.wax} />
        <path d="M508 385 L508 378" stroke="#3d2a1c" strokeWidth="1.6" strokeLinecap="round" />
      </g>

      <path
        d="M0 70 C90 76 180 96 330 116"
        stroke={p.wood}
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
      />
      {[
        [40, 64, 34, 20, -10],
        [96, 82, 30, 18, 15],
        [150, 72, 36, 20, -5],
        [210, 104, 30, 17, 25],
        [300, 112, 34, 18, -15],
        [70, 96, 26, 15, 20],
      ].map(([cx, cy, rx, ry, rot], index) => (
        <ellipse
          key={index}
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          transform={`rotate(${rot} ${cx} ${cy})`}
          fill={index % 2 ? p.leafLight : p.leaf}
        />
      ))}
      {[
        [250, 430, 46, 10],
        [560, 444, 60, 12],
        [660, 416, 38, 8],
        [130, 456, 52, 10],
      ].map(([cx, cy, rx, ry], index) => (
        <ellipse
          key={index}
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          fill={p.dapple}
          opacity={p.dappleOpacity * 1.6}
          filter={url('dapple')}
        />
      ))}
      {p.fireflies > 0.05
        ? [
            [180, 300],
            [560, 280],
            [660, 330],
            [260, 250],
            [470, 240],
          ].map(([cx, cy], index) => (
            <g key={index} opacity={p.fireflies}>
              <circle cx={cx} cy={cy} r="9" fill="#ffe08a" opacity="0.25" />
              <circle cx={cx} cy={cy} r="2.5" fill="#fff1bf" />
            </g>
          ))
        : null}
      <rect width="800" height="500" filter={url('grain')} style={{ mixBlendMode: 'multiply' }} />
    </svg>
  );
}
