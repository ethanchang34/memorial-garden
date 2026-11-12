import { useState, type CSSProperties } from 'react';

export type FireflyArea = { left: number; right: number; top: number; bottom: number };

type FirefliesProps = {
  count: number;
  glow: number;
  area: FireflyArea;
  core: string;
  halo: string;
};

const STONE_FACE = { left: 322, right: 478, top: 180, bottom: 410 };

function onStone(x: number, y: number) {
  return x > STONE_FACE.left && x < STONE_FACE.right && y > STONE_FACE.top && y < STONE_FACE.bottom;
}

function pick(area: FireflyArea) {
  let spot = { x: area.left, y: area.bottom };
  for (let tries = 0; tries < 8; tries += 1) {
    spot = {
      x: area.left + Math.random() * (area.right - area.left),
      y: area.top + Math.random() * (area.bottom - area.top),
    };
    if (!onStone(spot.x, spot.y)) break;
  }
  return spot;
}

function Firefly({ area, core, halo }: { area: FireflyArea; core: string; halo: string }) {
  const [rhythm] = useState(() => ({
    duration: 3 + Math.random() * 4,
    delay: Math.random() * 6,
    double: Math.random() < 0.3,
    dx: (Math.random() - 0.5) * 18,
    dy: -4 - Math.random() * 10,
  }));
  const [spot, setSpot] = useState(() => pick(area));
  const style = {
    animationDuration: `${rhythm.duration.toFixed(2)}s`,
    animationDelay: `-${rhythm.delay.toFixed(2)}s`,
    '--firefly-dx': `${rhythm.dx.toFixed(1)}px`,
    '--firefly-dy': `${rhythm.dy.toFixed(1)}px`,
  } as CSSProperties;

  return (
    <g transform={`translate(${spot.x.toFixed(1)} ${spot.y.toFixed(1)})`} data-firefly="">
      <g
        className={rhythm.double ? 'garden-firefly garden-firefly-double' : 'garden-firefly'}
        style={style}
        onAnimationIteration={() => setSpot(pick(area))}
      >
        <circle r="12" fill={halo} />
        <circle r="2.2" fill={core} />
      </g>
    </g>
  );
}

export function Fireflies({ count, glow, area, core, halo }: FirefliesProps) {
  if (count < 1) return null;
  return (
    <g aria-hidden="true" opacity={glow}>
      {Array.from({ length: count }, (_, index) => (
        <Firefly key={index} area={area} core={core} halo={halo} />
      ))}
    </g>
  );
}
