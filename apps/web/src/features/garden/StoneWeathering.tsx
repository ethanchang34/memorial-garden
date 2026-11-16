import { useMemo } from 'react';
import { mixHex } from '@/core/timeOfDay';
import { buildMoss, spotOpacity, STONE } from './moss';
import type { GardenPalette } from './palette';

type StoneWeatheringProps = {
  level: number;
  seed: string;
  wiping: boolean;
  stonePath: string;
  p: GardenPalette;
  id: (key: string) => string;
};

export function StoneWeathering({ level, seed, wiping, stonePath, p, id }: StoneWeatheringProps) {
  const spots = useMemo(() => buildMoss(seed), [seed]);
  const shade = mixHex(p.mossShade, p.stoneShade, 0.45);
  const body = mixHex(p.moss, p.stoneShade, 0.35);
  const light = mixHex(p.mossLight, p.stone, 0.4);
  const lichen = mixHex(p.lichen, p.stone, 0.35);
  const visible = spots
    .map((spot) => ({ spot, opacity: spotOpacity(spot, level) }))
    .filter(({ opacity }) => opacity > 0.01);

  return (
    <g aria-hidden="true" data-moss="" data-grime={level.toFixed(2)}>
      <defs>
        <clipPath id={id('stone-clip')}>
          <path d={stonePath} />
        </clipPath>
        <linearGradient id={id('grime')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.grime} stopOpacity="0" />
          <stop offset="0.55" stopColor={p.grime} stopOpacity="0.25" />
          <stop offset="1" stopColor={p.grime} stopOpacity="0.8" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${id('stone-clip')})`} className={wiping ? 'garden-moss-wipe' : undefined}>
        <rect
          x={STONE.left}
          y={STONE.top}
          width={STONE.right - STONE.left}
          height={STONE.base - STONE.top}
          fill={`url(#${id('grime')})`}
          opacity={0.45 * level}
        />
        {wiping ? (
          <rect
            className="garden-wipe-streak"
            x={STONE.left - 60}
            y={STONE.top}
            width="40"
            height={STONE.base - STONE.top}
            fill={p.wax}
            opacity="0.35"
            transform={`skewX(-12)`}
          />
        ) : null}
        {visible
          .filter(({ spot }) => spot.kind !== 'tuft')
          .map(({ spot, opacity }, index) =>
            spot.kind === 'lichen' ? (
              <g key={index} opacity={opacity * 0.8} fill={lichen}>
                <circle cx={spot.x} cy={spot.y} r={spot.r} />
                <circle cx={spot.x + spot.r * 0.8} cy={spot.y + spot.r * 0.3} r={spot.r * 0.6} />
                <circle cx={spot.x - spot.r * 0.5} cy={spot.y + spot.r * 0.7} r={spot.r * 0.45} />
              </g>
            ) : (
              <g key={index} opacity={opacity}>
                <ellipse
                  cx={spot.x}
                  cy={spot.y + 1}
                  rx={spot.r * 1.15}
                  ry={spot.r * 0.75}
                  fill={shade}
                />
                <ellipse cx={spot.x} cy={spot.y} rx={spot.r} ry={spot.r * 0.7} fill={body} />
                {spot.lobes.map(([dx, dy, r], lobe) => (
                  <circle key={lobe} cx={spot.x + dx} cy={spot.y + dy} r={r} fill={body} />
                ))}
                <ellipse
                  cx={spot.x - spot.r * 0.2}
                  cy={spot.y - spot.r * 0.35}
                  rx={spot.r * 0.55}
                  ry={spot.r * 0.28}
                  fill={light}
                  opacity="0.7"
                />
              </g>
            ),
          )}
      </g>
      {visible
        .filter(({ spot }) => spot.kind === 'tuft')
        .map(({ spot, opacity }, index) => (
          <g
            key={`tuft-${index}`}
            opacity={opacity}
            className={wiping ? 'garden-moss-wipe' : undefined}
          >
            <ellipse cx={spot.x} cy={spot.y} rx={spot.r * 1.2} ry={spot.r * 0.45} fill={shade} />
            {spot.lobes.map(([dx, dy, r], lobe) => (
              <circle key={lobe} cx={spot.x + dx} cy={spot.y + dy * 0.6} r={r * 0.9} fill={body} />
            ))}
          </g>
        ))}
    </g>
  );
}
