import { useState, type AnimationEvent, type CSSProperties } from 'react';
import { leafShape } from './geometry';

export type FallArea = { left: number; right: number; top: number; bottom: number };

type LeafColors = { fill: string; light: string; vein: string };

type FallingLeavesProps = {
  count: number;
  area: FallArea;
  colors: readonly LeafColors[];
};

function FallingLeaf({ area, colors }: { area: FallArea; colors: LeafColors }) {
  const [motion] = useState(() => ({
    duration: 11 + Math.random() * 6,
    delay: Math.random() * 17,
    sway: 2.6 + Math.random() * 1.6,
    drift: (Math.random() - 0.3) * 80,
    land: Math.random() * 40,
    tilt: 70 + Math.random() * 40,
  }));
  const [shape] = useState(() => {
    const length = 14 + Math.random() * 5;
    return leafShape({
      length,
      width: length * 0.45,
      bend: length * 0.04,
      asym: 0.05,
      widest: 0.4,
      curl: length * 0.05,
    });
  });
  const [x, setX] = useState(() => area.left + Math.random() * (area.right - area.left));
  const fall = Math.max(0, area.bottom - motion.land - area.top);
  const style = {
    animationDuration: `${motion.duration.toFixed(2)}s`,
    animationDelay: `-${motion.delay.toFixed(2)}s`,
    '--leaf-fall': `${fall.toFixed(0)}px`,
    '--leaf-drift': `${motion.drift.toFixed(0)}px`,
  } as CSSProperties;

  function onIteration(event: AnimationEvent<SVGGElement>) {
    if (event.target !== event.currentTarget) return;
    setX(area.left + Math.random() * (area.right - area.left));
  }

  return (
    <g transform={`translate(${x.toFixed(1)} ${area.top.toFixed(1)})`} data-falling-leaf="">
      <g className="garden-leaf-fall" style={style} onAnimationIteration={onIteration}>
        <g className="garden-leaf-sway" style={{ animationDuration: `${motion.sway.toFixed(2)}s` }}>
          <g transform={`rotate(${motion.tilt.toFixed(0)})`}>
            <path d={shape.outline} fill={colors.fill} />
            <path d={shape.light} fill={colors.light} />
            <path
              d={shape.ribs}
              fill="none"
              stroke={colors.vein}
              strokeOpacity="0.3"
              strokeWidth="0.5"
            />
          </g>
        </g>
      </g>
    </g>
  );
}

export function FallingLeaves({ count, area, colors }: FallingLeavesProps) {
  return (
    <g aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <FallingLeaf key={index} area={area} colors={colors[index % colors.length]!} />
      ))}
    </g>
  );
}
