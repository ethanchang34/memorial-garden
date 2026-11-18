import { BURNER, burningSticks, stickTip } from './incense';
import { INCENSE_COLORS as C, sceneLit, type GardenPalette } from './palette';

type IncenseBurnerProps = {
  lit: number;
  justLit: boolean;
  p: GardenPalette;
  id: (key: string) => string;
};

export function IncenseBurner({ lit, justLit, p, id }: IncenseBurnerProps) {
  const sticks = burningSticks(lit);
  const tone = (hex: string) => sceneLit(hex, p);
  const { x, base, rx, ry } = BURNER;
  const newest = lit - 1;

  return (
    <g aria-hidden="true" data-slot="incense" data-incense={sticks.length}>
      <defs>
        <linearGradient id={id('incense-bowl')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={tone(C.bowlShade)} />
          <stop offset="0.6" stopColor={tone(C.bowl)} />
          <stop offset="0.85" stopColor={tone(C.bowlLight)} />
          <stop offset="1" stopColor={tone(C.bowlShade)} />
        </linearGradient>
        <radialGradient id={id('incense-ember')}>
          <stop offset="0" stopColor={C.ember} stopOpacity="0.9" />
          <stop offset="1" stopColor={C.ember} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx={x} cy={base + 2} rx={rx + 6} ry={ry} fill={p.shadow} opacity="0.2" />
      <path
        d={`M${x - rx} ${base - 9} Q${x - rx} ${base + 1} ${x} ${base + 1} Q${x + rx} ${base + 1} ${x + rx} ${base - 9}Z`}
        fill={`url(#${id('incense-bowl')})`}
      />
      <ellipse cx={x} cy={base - 9} rx={rx} ry={ry} fill={tone(C.bowlLight)} />
      <ellipse cx={x} cy={base - 8.6} rx={rx - 2} ry={ry - 1.2} fill={tone(C.sand)} />
      {sticks.map((slot) => {
        const foot = base - 9;
        const top = foot - slot.height;
        const [tx, ty] = stickTip(slot, top);
        const [ax, ay] = [x + (tx - slot.x) * 0.72 + (slot.x - x), foot - (foot - ty) * 0.72];
        return (
          <g
            key={slot.index}
            className={slot.index === newest && justLit ? 'garden-incense-new' : undefined}
            data-stick=""
          >
            <line
              x1={slot.x}
              y1={foot}
              x2={ax}
              y2={ay}
              stroke={tone(C.stick)}
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <line
              x1={ax}
              y1={ay}
              x2={tx}
              y2={ty}
              stroke={tone(C.ash)}
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            <circle
              cx={tx}
              cy={ty}
              r="4"
              fill={`url(#${id('incense-ember')})`}
              className="garden-ember"
            />
            <circle cx={tx} cy={ty} r="0.9" fill={C.ember} />
            {[0, 1].map((strand) => (
              <path
                key={strand}
                className="garden-smoke"
                style={{ animationDelay: `${-(slot.index * 1.3 + strand * 2.6)}s` }}
                d={`M${tx} ${ty - 1} C${tx - 4} ${ty - 10} ${tx + 5} ${ty - 18} ${tx} ${ty - 28} S${tx - 6} ${ty - 44} ${tx + 2} ${ty - 56}`}
                fill="none"
                stroke={C.smoke}
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            ))}
          </g>
        );
      })}
    </g>
  );
}
