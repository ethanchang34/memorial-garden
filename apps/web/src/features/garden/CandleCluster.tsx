import { clusterGlow, clusterSlots, flamePath } from './candleSlots';
import type { GardenPalette } from './palette';

type CandleClusterProps = {
  lit: number;
  justLit: boolean;
  p: GardenPalette;
  glow: string;
  id: (key: string) => string;
};

export function CandleCluster({ lit, justLit, p, glow, id }: CandleClusterProps) {
  const slots = clusterSlots(lit);
  const light = clusterGlow(lit);
  const newest = lit - 1;
  const glowOpacity = (0.35 + 0.65 * p.candleGlow) * light.strength;

  return (
    <g aria-hidden="true" data-slot="candle" data-candles={lit}>
      <defs>
        <radialGradient id={id('flame')} cx="0.5" cy="0.72" r="0.62">
          <stop offset="0" stopColor={p.flameCore} />
          <stop offset="0.35" stopColor={p.flameMid} />
          <stop offset="0.75" stopColor={p.flameEdge} />
          <stop offset="1" stopColor={p.flameTip} stopOpacity="0.8" />
        </radialGradient>
        <radialGradient id={id('candle-glow')}>
          <stop offset="0" stopColor={p.candleLight} stopOpacity="0.75" />
          <stop offset="0.45" stopColor={p.candleLight} stopOpacity="0.25" />
          <stop offset="1" stopColor={p.candleLight} stopOpacity="0" />
        </radialGradient>
      </defs>
      {lit > 0 ? (
        <g className={justLit ? 'garden-glow-bloom' : undefined} data-glow="">
          <circle
            cx="506"
            cy="392"
            r={light.radius}
            fill={`url(#${id('candle-glow')})`}
            opacity={glowOpacity}
          />
          <ellipse
            cx="506"
            cy="418"
            rx={light.radius * 0.8}
            ry="12"
            fill={p.candleLight}
            opacity={glowOpacity * 0.5}
            filter={glow}
          />
        </g>
      ) : null}
      {slots.map((slot) => {
        const half = 10 * slot.scale;
        const top = slot.base - slot.height;
        const wickTop = top - 6 * slot.scale;
        const isLit = slot.index < lit;
        return (
          <g key={slot.index}>
            <ellipse
              cx={slot.x}
              cy={slot.base + 1}
              rx={half * 1.6}
              ry={3.2 * slot.scale}
              fill={p.wood}
              opacity="0.55"
            />
            <rect
              x={slot.x - half}
              y={top}
              width={half * 2}
              height={slot.height}
              rx={3.5 * slot.scale}
              fill={`url(#${id('wax')})`}
            />
            <ellipse cx={slot.x} cy={top + 1} rx={half} ry={2.4 * slot.scale} fill={p.wax} />
            <path
              d={`M${slot.x} ${top + 1} L${slot.x} ${wickTop}`}
              stroke={p.wick}
              strokeWidth={1.6 * slot.scale}
              strokeLinecap="round"
            />
            {isLit ? (
              <g
                className={slot.index === newest && justLit ? 'garden-flame-new' : undefined}
                data-flame=""
              >
                <g
                  className="garden-flame"
                  style={{ animationDelay: `${-(slot.index * 0.37) % 1.9}s` }}
                >
                  <path
                    d={flamePath(slot.x, wickTop + 2, slot.scale)}
                    fill={`url(#${id('flame')})`}
                  />
                  <ellipse
                    cx={slot.x}
                    cy={wickTop - 1.5 * slot.scale}
                    rx={1.3 * slot.scale}
                    ry={2.4 * slot.scale}
                    fill={p.flameHeart}
                    opacity="0.9"
                  />
                </g>
              </g>
            ) : null}
          </g>
        );
      })}
    </g>
  );
}
