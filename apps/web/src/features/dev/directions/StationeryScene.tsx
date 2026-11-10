import { useId } from 'react';
import { STATIONERY as s } from './palettes';

export function StationeryScene({ companion, label }: { companion: boolean; label: string }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  return (
    <svg viewBox="0 0 800 500" role="img" aria-label={label} className="block h-auto w-full">
      <defs>
        <filter id={`wash-${id}`} x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.03"
            numOctaves="3"
            seed="2"
            result="noise"
          />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="18" result="edge" />
          <feGaussianBlur in="edge" stdDeviation="4" />
        </filter>
        <filter id={`paper-${id}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="9" />
          <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 0 0.3  0 0 0 0.07 0" />
        </filter>
      </defs>

      <rect width="800" height="500" fill={s.paper} />
      <rect
        x="28"
        y="24"
        width="744"
        height="452"
        rx="18"
        fill="none"
        stroke={s.frame}
        strokeWidth="2"
      />

      <g filter={`url(#wash-${id})`} opacity="0.55">
        <ellipse cx="610" cy="150" rx="150" ry="80" fill={s.sky} />
        <ellipse cx="400" cy="420" rx="330" ry="46" fill={s.sage} opacity="0.6" />
        <ellipse cx="300" cy="370" rx="46" ry="34" fill={s.rose} opacity="0.55" />
        <ellipse cx="510" cy="380" rx="44" ry="40" fill={s.gold} opacity="0.4" />
        <ellipse cx="400" cy="300" rx="64" ry="96" fill={s.stoneWash} />
      </g>

      <g fill="none" stroke={s.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M342 404 L342 252 Q342 200 400 200 Q458 200 458 252 L458 404" />
        <path d="M120 412 C260 404 540 404 680 412" stroke={s.inkSoft} />
      </g>
      <text
        x="400"
        y="282"
        textAnchor="middle"
        fontFamily="Fraunces, Georgia, serif"
        fontSize="18"
        fill={s.ink}
      >
        Rosa Martinez
      </text>
      <text
        x="400"
        y="306"
        textAnchor="middle"
        fontFamily="Fraunces, Georgia, serif"
        fontSize="13"
        fill={s.ink}
      >
        1932 – 2024
      </text>

      <g fill="none" stroke={s.sage} strokeWidth="1.6" strokeLinecap="round">
        {[150, 205, 600, 655].map((x, index) => (
          <g key={x}>
            <path d={`M${x} 410 C${x - 6} 360 ${x + 8} 320 ${x + 2} ${270 + index * 6}`} />
            <path d={`M${x - 2} 370 q-18 -8 -22 -24 q18 4 22 24`} />
            <path d={`M${x + 1} 340 q18 -10 24 -26 q-18 4 -24 26`} />
            <path d={`M${x} 390 q16 -4 22 -18 q-16 2 -22 18`} />
          </g>
        ))}
      </g>

      <g fill="none" stroke={s.rose} strokeWidth="1.6" strokeLinecap="round">
        <path d="M290 404 L292 382 L312 382 L314 404Z" stroke={s.ink} />
        {(
          [
            [298, 350],
            [308, 343],
            [317, 356],
            [291, 358],
          ] as const
        ).map(([cx, cy]) => (
          <g key={`${cx}-${cy}`}>
            <path d={`M${cx} 382 L${cx} ${cy + 6}`} stroke={s.sage} />
            <circle cx={cx} cy={cy} r="6" />
          </g>
        ))}
      </g>

      <g fill="none" stroke={s.ink} strokeWidth="1.6" strokeLinecap="round">
        <rect x="498" y="378" width="22" height="28" rx="4" />
        <path d="M509 372 q-4 -6 0 -12 q4 6 0 12" stroke={s.gold} />
      </g>

      {companion ? (
        <g fill="none" stroke={s.ink} strokeWidth="1.6" strokeLinecap="round">
          <path d="M146 404 C150 386 176 380 200 386 C222 392 226 404 214 406 L150 406Z" />
          <path d="M146 404 C136 400 132 388 140 382 L142 372 L150 380 L158 372 L160 384" />
          <path d="M214 406 C234 404 236 392 226 390" />
          <path d="M141 392 q3 2 6 0" />
        </g>
      ) : null}

      <rect
        width="800"
        height="500"
        filter={`url(#paper-${id})`}
        style={{ mixBlendMode: 'multiply' }}
      />
    </svg>
  );
}
