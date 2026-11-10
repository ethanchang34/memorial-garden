import { useId } from 'react';
import type { ScenePalette } from './palettes';

type GardenSceneProps = {
  palette: ScenePalette;
  painted?: boolean;
  companion: boolean;
  label: string;
};

export function GardenScene({ palette: p, painted = false, companion, label }: GardenSceneProps) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const ref = (name: string) => `url(#${name}-${id})`;

  return (
    <svg viewBox="0 0 800 500" role="img" aria-label={label} className="block h-auto w-full">
      <defs>
        <linearGradient id={`sky-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.skyTop} />
          <stop offset="1" stopColor={p.skyBottom} />
        </linearGradient>
        <radialGradient id={`sun-${id}`}>
          <stop offset="0" stopColor={p.sun} stopOpacity={p.sunGlow} />
          <stop offset="1" stopColor={p.sun} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`haze-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.haze} stopOpacity="0" />
          <stop offset="1" stopColor={p.haze} stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id={`ground-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.ground} />
          <stop offset="1" stopColor={p.groundShade} />
        </linearGradient>
        <linearGradient id={`stone-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={p.stoneShade} />
          <stop offset="0.45" stopColor={p.stone} />
          <stop offset="1" stopColor={p.stoneShade} />
        </linearGradient>
        <radialGradient id={`candle-${id}`}>
          <stop offset="0" stopColor="#ffd88a" stopOpacity={0.9 * p.candleGlow} />
          <stop offset="1" stopColor="#ffd88a" stopOpacity="0" />
        </radialGradient>
        <filter id={`soft-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id={`dapple-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter id={`grain-${id}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" />
          <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.3  0 0 0 0 0.25  0 0 0 0.09 0" />
        </filter>
        <filter id={`paint-${id}`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.018"
            numOctaves="3"
            seed="8"
            result="noise"
          />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="7" result="wobble" />
          <feGaussianBlur in="wobble" stdDeviation="0.6" result="soft" />
          <feColorMatrix in="soft" type="saturate" values="1.2" />
        </filter>
        <filter id={`canvas-${id}`}>
          <feTurbulence type="turbulence" baseFrequency="0.04 0.9" numOctaves="2" seed="5" />
          <feColorMatrix values="0 0 0 0 0.4  0 0 0 0 0.32  0 0 0 0 0.22  0 0 0 0.2 0" />
        </filter>
      </defs>

      <g filter={painted ? ref('paint') : undefined}>
        <rect width="800" height="500" fill={ref('sky')} />
        <circle cx="620" cy="175" r="190" fill={ref('sun')} />
        <circle cx="620" cy="175" r="40" fill={p.sun} opacity={p.fireflies ? 0.85 : 0.95} />

        <path
          d="M0 300 C120 255 220 272 330 258 C450 242 560 272 800 248 L800 500 L0 500Z"
          fill={p.farHill}
        />
        <rect y="220" width="800" height="120" fill={ref('haze')} />

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
        <rect x="70" y="350" width="220" height="14" rx="6" fill={p.stoneShade} opacity="0.5" />

        <path d="M0 372 C200 352 600 360 800 374 L800 500 L0 500Z" fill={ref('ground')} />
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
          filter={ref('soft')}
        />
        <path
          d="M342 404 L342 252 Q342 200 400 200 Q458 200 458 252 L458 404Z"
          fill={ref('stone')}
        />
        <text
          x="400"
          y="282"
          textAnchor="middle"
          fontFamily="Fraunces, Georgia, serif"
          fontSize="18"
          fill={p.engraving}
        >
          Rosa Martinez
        </text>
        <text
          x="400"
          y="306"
          textAnchor="middle"
          fontFamily="Fraunces, Georgia, serif"
          fontSize="13"
          fill={p.engraving}
        >
          1932 – 2024
        </text>
        <path d="M384 236 Q400 220 416 236 Q400 250 384 236Z" fill={p.engraving} opacity="0.5" />
        <ellipse cx="358" cy="396" rx="20" ry="9" fill={p.moss} opacity="0.55" />
        <ellipse cx="446" cy="398" rx="14" ry="7" fill={p.moss} opacity="0.45" />

        <path d="M286 382 L314 382 L310 408 L290 408Z" fill={p.pot} />
        <path
          d="M292 382 C292 366 296 356 300 350 M300 382 C300 362 304 352 308 346 M308 382 C308 368 312 360 316 356"
          stroke={p.leaf}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="300" cy="348" r="8" fill={p.flowerA} />
        <circle cx="309" cy="343" r="7" fill={p.flowerB} />
        <circle cx="317" cy="354" r="6" fill={p.flowerA} />
        <circle cx="292" cy="356" r="6" fill={p.flowerB} />

        <circle cx="508" cy="384" r="70" fill={ref('candle')} />
        <rect x="496" y="378" width="24" height="30" rx="5" fill={p.wall} opacity="0.85" />
        <rect x="503" y="386" width="10" height="16" rx="2" fill="#f7efe0" />
        <ellipse cx="508" cy="381" rx="3.5" ry="6" fill="#ffcf6b" />

        <path
          d="M0 70 C90 76 180 96 330 116"
          stroke={p.wood}
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M180 96 C200 120 214 132 236 140"
          stroke={p.wood}
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />
        {[
          [40, 64, 34, 20, -10],
          [96, 82, 30, 18, 15],
          [150, 72, 36, 20, -5],
          [210, 104, 30, 17, 25],
          [250, 140, 26, 15, 10],
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
          [250, 420, 46, 10],
          [520, 440, 60, 12],
          [640, 412, 38, 8],
          [130, 452, 52, 10],
        ].map(([cx, cy, rx, ry], index) => (
          <ellipse
            key={index}
            cx={cx}
            cy={cy}
            rx={rx}
            ry={ry}
            fill={p.dapple}
            opacity={p.dappleOpacity * 1.6}
            filter={ref('dapple')}
          />
        ))}

        {companion ? <SleepingCat palette={p} /> : null}

        {p.fireflies
          ? [
              [180, 300],
              [560, 280],
              [640, 330],
              [260, 250],
              [470, 240],
            ].map(([cx, cy], index) => (
              <g key={index}>
                <circle cx={cx} cy={cy} r="9" fill="#ffe08a" opacity="0.25" />
                <circle cx={cx} cy={cy} r="2.5" fill="#fff1bf" />
              </g>
            ))
          : null}
      </g>

      <rect
        width="800"
        height="500"
        filter={ref(painted ? 'canvas' : 'grain')}
        style={{ mixBlendMode: 'multiply' }}
      />
    </svg>
  );
}

function SleepingCat({ palette: p }: { palette: ScenePalette }) {
  return (
    <g>
      <ellipse cx="178" cy="328" rx="44" ry="7" fill="#2f2e2b" opacity="0.12" />
      <path
        d="M210 318 C238 318 244 300 230 296 C222 294 218 302 224 306"
        stroke={p.cat}
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="180" cy="312" rx="36" ry="16" fill={p.cat} />
      <ellipse cx="186" cy="318" rx="26" ry="8" fill={p.catShade} opacity="0.5" />
      <circle cx="148" cy="310" r="13" fill={p.cat} />
      <path d="M138 302 L140 290 L148 299Z M150 298 L157 288 L159 301Z" fill={p.cat} />
      <path
        d="M142 311 Q145 313 148 311 M151 311 Q154 313 157 311"
        stroke={p.catShade}
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
}
