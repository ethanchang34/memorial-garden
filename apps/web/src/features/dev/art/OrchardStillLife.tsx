import { useId } from 'react';
import { latheOutline, leafPath, petalPath, seededRandom, type Point } from './geometry';

const C = {
  skyTop: '#eebd86',
  skyBottom: '#f7e1bd',
  hedge: '#8a8a4e',
  hedgeDeep: '#6f7140',
  bokeh: '#ffe2a6',
  ledgeTop: '#d8c6a8',
  ledgeFace: '#b29e80',
  ledgeShade: '#8f7d63',
  moss: '#7d8a45',
  mossLight: '#a3a85a',
  stem: '#6f7a3e',
  leaf: '#7d8a45',
  leafLight: '#b0a95a',
  petalDeep: '#9b3f2c',
  petalMid: '#c8553d',
  petalLight: '#e88a66',
  goldDeep: '#b9802f',
  gold: '#e9b14c',
  goldLight: '#f6d58b',
  center: '#5a3220',
  wax: '#f4e6cd',
  waxShade: '#d8c2a0',
  brass: '#b88a45',
  brassLight: '#e6c27a',
  ink: '#3d2a1c',
};

const VASE_PROFILE: Point[] = [
  [520, 58],
  [512, 66],
  [488, 84],
  [452, 92],
  [412, 84],
  [378, 62],
  [352, 44],
  [336, 42],
  [326, 54],
  [320, 56],
];

type Bloom = {
  seed: number;
  base: Point;
  head: Point;
  size: number;
  tilt: number;
  petals: number;
  color: 'rust' | 'gold';
  sway: number;
};

const BLOOMS: Bloom[] = [
  {
    seed: 11,
    base: [292, 326],
    head: [236, 196],
    size: 46,
    tilt: -18,
    petals: 8,
    color: 'rust',
    sway: 7.2,
  },
  {
    seed: 23,
    base: [302, 326],
    head: [318, 148],
    size: 52,
    tilt: 6,
    petals: 9,
    color: 'rust',
    sway: 8.4,
  },
  {
    seed: 37,
    base: [310, 326],
    head: [388, 214],
    size: 42,
    tilt: 22,
    petals: 8,
    color: 'gold',
    sway: 6.6,
  },
  {
    seed: 41,
    base: [298, 326],
    head: [270, 252],
    size: 34,
    tilt: -8,
    petals: 7,
    color: 'gold',
    sway: 7.8,
  },
];

export function OrchardStillLife({ label }: { label: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const id = (name: string) => `${name}-${uid}`;
  const url = (name: string) => `url(#${id(name)})`;
  const vase = latheOutline(300, VASE_PROFILE);

  return (
    <svg viewBox="0 0 600 600" role="img" aria-label={label} className="block h-auto w-full">
      <style>{`
        .sway-${uid} { transform-box: view-box; animation: sway-${uid} ease-in-out infinite alternate; }
        @keyframes sway-${uid} { from { transform: rotate(-1.8deg); } to { transform: rotate(1.8deg); } }
        .flame-${uid} { transform-box: view-box; transform-origin: 452px 418px; animation: flame-${uid} 1.9s ease-in-out infinite; }
        @keyframes flame-${uid} {
          0%, 100% { transform: scale(1, 1) skewX(0deg); }
          22% { transform: scale(0.96, 1.07) skewX(-2deg); }
          48% { transform: scale(1.03, 0.94) skewX(1.5deg); }
          71% { transform: scale(0.98, 1.04) skewX(-1deg); }
        }
        .glow-${uid} { animation: glow-${uid} 2.6s ease-in-out infinite; }
        @keyframes glow-${uid} { 0%, 100% { opacity: 0.85; } 40% { opacity: 1; } 70% { opacity: 0.75; } }
        .drift-${uid} { transform-box: fill-box; transform-origin: center; animation: drift-${uid} 16s linear infinite; }
        @keyframes drift-${uid} {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
          8% { opacity: 1; }
          50% { transform: translate(-70px, 210px) rotate(160deg); }
          88% { opacity: 1; }
          100% { transform: translate(-150px, 400px) rotate(320deg); opacity: 0; }
        }
      `}</style>
      <defs>
        <linearGradient id={id('sky')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.skyTop} />
          <stop offset="1" stopColor={C.skyBottom} />
        </linearGradient>
        <radialGradient id={id('bokeh')}>
          <stop offset="0" stopColor={C.bokeh} stopOpacity="0.9" />
          <stop offset="0.6" stopColor={C.bokeh} stopOpacity="0.35" />
          <stop offset="1" stopColor={C.bokeh} stopOpacity="0" />
        </radialGradient>
        <filter id={id('depth')} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter id={id('contact')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id={id('soften')} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        <filter id={id('grain')}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4" />
          <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.26  0 0 0 0 0.16  0 0 0 0.16 0" />
        </filter>
        <filter id={id('clay')}>
          <feTurbulence type="fractalNoise" baseFrequency="0.035 0.2" numOctaves="3" seed="12" />
          <feColorMatrix values="0 0 0 0 0.3  0 0 0 0 0.15  0 0 0 0 0.08  0 0 0 0.18 0" />
        </filter>
        <radialGradient id={id('vignette')} cx="0.5" cy="0.45" r="0.75">
          <stop offset="0.6" stopColor="#6b4a2a" stopOpacity="0" />
          <stop offset="1" stopColor="#6b4a2a" stopOpacity="0.28" />
        </radialGradient>

        <linearGradient id={id('vase')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6c3221" />
          <stop offset="0.28" stopColor="#984a2d" />
          <stop offset="0.6" stopColor="#c46b42" />
          <stop offset="0.8" stopColor="#df9363" />
          <stop offset="0.93" stopColor="#c87448" />
          <stop offset="1" stopColor="#8e4429" />
        </linearGradient>
        <linearGradient id={id('vaseDepth')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3d1d12" stopOpacity="0.45" />
          <stop offset="0.16" stopColor="#3d1d12" stopOpacity="0" />
          <stop offset="0.82" stopColor="#3d1d12" stopOpacity="0" />
          <stop offset="1" stopColor="#3d1d12" stopOpacity="0.4" />
        </linearGradient>
        <radialGradient id={id('opening')} cx="0.5" cy="0.35" r="0.6">
          <stop offset="0" stopColor="#2a140c" />
          <stop offset="1" stopColor="#5a2a19" />
        </radialGradient>
        <clipPath id={id('vaseClip')}>
          <path d={vase} />
        </clipPath>

        <linearGradient id={id('petal-rust')} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={C.petalDeep} />
          <stop offset="0.5" stopColor={C.petalMid} />
          <stop offset="1" stopColor={C.petalLight} />
        </linearGradient>
        <linearGradient id={id('petal-gold')} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={C.goldDeep} />
          <stop offset="0.5" stopColor={C.gold} />
          <stop offset="1" stopColor={C.goldLight} />
        </linearGradient>
        <radialGradient id={id('center')}>
          <stop offset="0" stopColor="#8a5530" />
          <stop offset="1" stopColor={C.center} />
        </radialGradient>
        <linearGradient id={id('leaf')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={C.leaf} />
          <stop offset="1" stopColor={C.leafLight} />
        </linearGradient>

        <linearGradient id={id('wax')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={C.waxShade} />
          <stop offset="0.55" stopColor={C.wax} />
          <stop offset="0.85" stopColor="#fff5e2" />
          <stop offset="1" stopColor={C.waxShade} />
        </linearGradient>
        <linearGradient id={id('brass')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7d5a2a" />
          <stop offset="0.65" stopColor={C.brassLight} />
          <stop offset="1" stopColor={C.brass} />
        </linearGradient>
        <radialGradient id={id('flame')} cx="0.5" cy="0.72" r="0.62">
          <stop offset="0" stopColor="#fffbe8" />
          <stop offset="0.35" stopColor="#ffe08a" />
          <stop offset="0.75" stopColor="#f6a64a" />
          <stop offset="1" stopColor="#e2763a" stopOpacity="0.8" />
        </radialGradient>
        <radialGradient id={id('glow')}>
          <stop offset="0" stopColor="#ffd88a" stopOpacity="0.75" />
          <stop offset="0.45" stopColor="#ffcf7a" stopOpacity="0.25" />
          <stop offset="1" stopColor="#ffcf7a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('ledge')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.ledgeTop} />
          <stop offset="1" stopColor={C.ledgeFace} />
        </linearGradient>
      </defs>

      <rect width="600" height="600" fill={url('sky')} />
      <g filter={url('depth')}>
        <path
          d="M-20 360 C40 270 140 280 190 330 C230 260 340 250 390 320 C430 270 540 270 620 330 L620 600 L-20 600Z"
          fill={C.hedge}
        />
        <path
          d="M-20 420 C80 380 180 400 260 420 C360 390 480 400 620 420 L620 600 L-20 600Z"
          fill={C.hedgeDeep}
          opacity="0.7"
        />
        {[
          [90, 150, 46],
          [180, 92, 30],
          [500, 120, 54],
          [540, 260, 34],
          [70, 300, 28],
          [420, 60, 24],
        ].map(([cx, cy, r], index) => (
          <circle key={index} cx={cx} cy={cy} r={r} fill={url('bokeh')} />
        ))}
      </g>

      <rect x="60" y="514" width="480" height="58" rx="18" fill={url('ledge')} />
      <rect x="60" y="540" width="480" height="32" rx="14" fill={C.ledgeShade} opacity="0.55" />
      <path
        d="M78 518 C120 508 168 514 196 520 C170 526 120 528 78 524Z"
        fill={C.moss}
        opacity="0.8"
      />
      <path
        d="M470 520 C496 512 520 514 532 520 C516 526 490 527 470 524Z"
        fill={C.mossLight}
        opacity="0.7"
      />

      <ellipse
        cx="300"
        cy="522"
        rx="78"
        ry="10"
        fill={C.ink}
        opacity="0.35"
        filter={url('contact')}
      />
      <ellipse
        cx="452"
        cy="522"
        rx="44"
        ry="7"
        fill={C.ink}
        opacity="0.3"
        filter={url('contact')}
      />
      <ellipse cx="452" cy="420" rx="120" ry="110" fill={url('glow')} className={`glow-${uid}`} />

      {BLOOMS.map((bloom) => (
        <Flower key={bloom.seed} bloom={bloom} uid={uid} url={url} />
      ))}

      <path d={vase} fill={url('vase')} />
      <g clipPath={url('vaseClip')}>
        <rect
          x="200"
          y="300"
          width="200"
          height="230"
          filter={url('clay')}
          style={{ mixBlendMode: 'multiply' }}
        />
        <rect x="200" y="300" width="200" height="230" fill={url('vaseDepth')} />
        <path
          d="M218 430 C250 444 350 444 382 430"
          stroke="#f0b07c"
          strokeOpacity="0.35"
          strokeWidth="3"
          fill="none"
        />
        <path
          d="M222 442 C254 456 346 456 378 442"
          stroke="#5a2a19"
          strokeOpacity="0.25"
          strokeWidth="2"
          fill="none"
        />
        <ellipse
          cx="352"
          cy="430"
          rx="10"
          ry="70"
          fill="#ffe2c0"
          opacity="0.32"
          filter={url('contact')}
        />
        <ellipse
          cx="300"
          cy="530"
          rx="120"
          ry="40"
          fill="#ffb27a"
          opacity="0.18"
          filter={url('soften')}
        />
      </g>
      <ellipse cx="300" cy="320" rx="56" ry="11" fill="#e9a274" />
      <ellipse cx="300" cy="321" rx="47" ry="8" fill={url('opening')} />

      <g>
        <ellipse cx="452" cy="516" rx="40" ry="8" fill="#6e4f25" />
        <ellipse cx="452" cy="512" rx="40" ry="9" fill={url('brass')} />
        <rect x="428" y="430" width="48" height="84" rx="6" fill={url('wax')} />
        <ellipse cx="452" cy="431" rx="24" ry="6" fill="#fbf1de" />
        <path d="M466 431 C468 444 470 452 466 458 C462 452 462 444 462 434Z" fill="#fbf1de" />
        <ellipse cx="452" cy="431" rx="16" ry="3.5" fill={C.waxShade} opacity="0.6" />
        <path d="M452 431 L452 420" stroke={C.ink} strokeWidth="2" strokeLinecap="round" />
        <g className={`flame-${uid}`}>
          <path
            d="M452 386 C460 398 464 408 460 415 C457 420 447 420 444 415 C440 408 444 398 452 386Z"
            fill={url('flame')}
          />
          <ellipse cx="452" cy="412" rx="3.2" ry="5" fill="#fffef6" opacity="0.9" />
        </g>
      </g>

      <g className={`drift-${uid}`}>
        <path
          d={petalPath(20, 11)}
          transform="translate(420 80) rotate(30)"
          fill={url('petal-rust')}
        />
      </g>

      <rect width="600" height="600" fill={url('vignette')} />
      <rect width="600" height="600" filter={url('grain')} style={{ mixBlendMode: 'multiply' }} />
    </svg>
  );
}

function Flower({ bloom, uid, url }: { bloom: Bloom; uid: string; url: (name: string) => string }) {
  const random = seededRandom(bloom.seed);
  const [bx, by] = bloom.base;
  const [hx, hy] = bloom.head;
  const cx = bx + (hx - bx) * 0.25 + (random() - 0.5) * 30;
  const cy = by - (by - hy) * 0.55;
  const stem = `M${bx} ${by} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${hx} ${hy}`;
  const along = (t: number): Point => [
    (1 - t) ** 2 * bx + 2 * (1 - t) * t * cx + t ** 2 * hx,
    (1 - t) ** 2 * by + 2 * (1 - t) * t * cy + t ** 2 * hy,
  ];
  const leaves = [0.32, 0.55].map((t, index) => {
    const [lx, ly] = along(t);
    const side = index % 2 ? 1 : -1;
    return {
      lx,
      ly,
      angle: side > 0 ? -28 - random() * 18 : -152 + random() * 18,
      length: 34 + random() * 14,
    };
  });
  const petals = Array.from({ length: bloom.petals }, (_, index) => ({
    angle: (index * 360) / bloom.petals + (random() - 0.5) * 14,
    length: bloom.size * (0.88 + random() * 0.22),
    width: bloom.size * (0.44 + random() * 0.14),
  }));
  const dots = Array.from({ length: 14 }, (_, index) => {
    const a = (index / 14) * Math.PI * 2 + random() * 0.3;
    const r = bloom.size * (0.18 + random() * 0.05);
    return [Math.cos(a) * r, Math.sin(a) * r * 0.82] as const;
  });
  const petalFill = url(bloom.color === 'rust' ? 'petal-rust' : 'petal-gold');

  return (
    <g
      className={`sway-${uid}`}
      style={{
        transformOrigin: `${bx}px ${by}px`,
        animationDuration: `${bloom.sway}s`,
        animationDelay: `${-bloom.seed % 5}s`,
      }}
    >
      <path d={stem} stroke={C.stem} strokeWidth="4.5" fill="none" strokeLinecap="round" />
      <path
        d={stem}
        stroke={C.leafLight}
        strokeOpacity="0.45"
        strokeWidth="1.5"
        fill="none"
        transform="translate(1.5 0)"
      />
      {leaves.map((leaf, index) => (
        <g
          key={index}
          transform={`translate(${leaf.lx.toFixed(1)} ${leaf.ly.toFixed(1)}) rotate(${leaf.angle.toFixed(1)})`}
        >
          <path d={leafPath(leaf.length, leaf.length * 0.42)} fill={url('leaf')} />
          <path
            d={`M2 0 Q${(leaf.length * 0.5).toFixed(1)} -2 ${(leaf.length * 0.92).toFixed(1)} 0`}
            stroke={C.stem}
            strokeOpacity="0.55"
            strokeWidth="1.2"
            fill="none"
          />
        </g>
      ))}
      <g transform={`translate(${hx} ${hy}) rotate(${bloom.tilt}) scale(1 0.86)`}>
        {petals.map((petal, index) => (
          <g key={index} transform={`rotate(${petal.angle.toFixed(1)})`}>
            <path
              d={petalPath(petal.length, petal.width)}
              fill={petalFill}
              transform="translate(1.5 2)"
              opacity="0.28"
            />
            <path d={petalPath(petal.length, petal.width)} fill={petalFill} />
            <path
              d={`M0 -6 L0 ${(-petal.length * 0.72).toFixed(1)}`}
              stroke={C.ink}
              strokeOpacity="0.14"
              strokeWidth="1"
            />
          </g>
        ))}
        <circle r={bloom.size * 0.2} fill={url('center')} />
        {dots.map(([x, y], index) => (
          <circle key={index} cx={x.toFixed(1)} cy={y.toFixed(1)} r="2.1" fill={C.gold} />
        ))}
        <circle
          cx={-bloom.size * 0.05}
          cy={-bloom.size * 0.06}
          r={bloom.size * 0.06}
          fill="#c9925a"
          opacity="0.6"
        />
      </g>
    </g>
  );
}
