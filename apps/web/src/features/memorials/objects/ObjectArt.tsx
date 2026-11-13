import type { JSX } from 'react';
import { cn } from '@/lib/utils';

export type ObjectKey = 'photos' | 'notes' | 'story' | 'memos';

const lift =
  'transition-transform duration-300 ease-out [transform-box:fill-box] origin-bottom can-hover:group-hover:-translate-y-1.5 group-focus-visible:-translate-y-1.5';

function PhotoCard({
  className,
  x,
  y,
  rotate,
}: {
  className?: string;
  x: number;
  y: number;
  rotate: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate} 26 22)`}>
      <g className={className}>
        <rect
          width="52"
          height="44"
          rx="2"
          className="fill-card stroke-stone-dark"
          strokeWidth="0.8"
        />
        <rect x="4" y="4" width="44" height="30" className="fill-sky" />
        <circle cx="38" cy="12" r="4" className="fill-gold" />
        <path d="M4 34 L4 26 Q14 18 24 25 Q34 31 48 22 L48 34Z" className="fill-sage" />
        <path d="M4 34 L4 30 Q20 24 32 31 Q40 34 48 30 L48 34Z" className="fill-moss" />
      </g>
    </g>
  );
}

function Photos() {
  return (
    <>
      <PhotoCard x={14} y={22} rotate={-9} />
      <PhotoCard x={26} y={18} rotate={7} />
      <PhotoCard
        x={20}
        y={16}
        rotate={-2}
        className={cn(lift, 'can-hover:group-hover:-rotate-6 group-focus-visible:-rotate-6')}
      />
    </>
  );
}

function Sheet({
  x,
  y,
  rotate,
  className,
}: {
  x: number;
  y: number;
  rotate: number;
  className?: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate} 24 26)`}>
      <g className={className}>
        <path
          d="M0 2 Q0 0 2 0 L38 0 L48 10 L48 50 Q48 52 46 52 L2 52 Q0 52 0 50Z"
          className="fill-card stroke-stone-dark"
          strokeWidth="0.8"
        />
        <path
          d="M38 0 L38 10 L48 10Z"
          className="fill-muted stroke-stone-dark"
          strokeWidth="0.8"
          strokeLinejoin="round"
        />
        {[18, 25, 32, 39].map((lineY, index) => (
          <path
            key={lineY}
            d={`M7 ${lineY} L${index === 3 ? 28 : 41} ${lineY}`}
            className="stroke-stone"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        ))}
      </g>
    </g>
  );
}

function Notes() {
  return (
    <>
      <Sheet x={20} y={18} rotate={8} />
      <Sheet x={26} y={16} rotate={-5} />
      <Sheet
        x={23}
        y={13}
        rotate={2}
        className={cn(lift, 'can-hover:group-hover:rotate-3 group-focus-visible:rotate-3')}
      />
    </>
  );
}

function Story() {
  return (
    <g
      className={cn(lift, 'can-hover:group-hover:rotate-2 origin-top group-focus-visible:rotate-2')}
    >
      <path d="M48 4 L34 16 M48 4 L62 16" className="stroke-wood" strokeWidth="1.2" fill="none" />
      <circle cx="48" cy="4" r="1.6" className="fill-gold-deep" />
      <rect x="22" y="14" width="52" height="60" rx="3" className="fill-wood" />
      <rect x="27" y="19" width="42" height="50" rx="1.5" className="fill-card" />
      <path
        d="M33 29 L56 29"
        className="stroke-stone-dark"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {[37, 43, 49, 55].map((lineY, index) => (
        <path
          key={lineY}
          d={`M33 ${lineY} L${index === 3 ? 50 : 63} ${lineY}`}
          className="stroke-stone"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      ))}
      <path
        d="M58 62 q3 -4 6 0"
        className="stroke-rose"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
}

const BARS = [10, 20, 32, 22, 38, 26, 16, 28, 12];

function Memos() {
  return (
    <g className={lift}>
      <rect
        x="14"
        y="16"
        width="68"
        height="52"
        rx="12"
        className="fill-card stroke-stone-dark"
        strokeWidth="0.8"
      />
      {BARS.map((height, index) => (
        <rect
          key={index}
          x={22 + index * 6.2}
          y={42 - height / 2}
          width="3.4"
          height={height}
          rx="1.7"
          className={cn(
            'fill-sage-deep origin-center transition-transform duration-300 [transform-box:fill-box]',
            index % 2 ? 'can-hover:group-hover:scale-y-75' : 'can-hover:group-hover:scale-y-125',
          )}
        />
      ))}
    </g>
  );
}

const ART: Record<ObjectKey, () => JSX.Element> = {
  photos: Photos,
  notes: Notes,
  story: Story,
  memos: Memos,
};

export function ObjectArt({ kind, className }: { kind: ObjectKey; className?: string }) {
  const Art = ART[kind];
  return (
    <svg viewBox="0 0 96 80" aria-hidden="true" className={cn('overflow-visible', className)}>
      <Art />
    </svg>
  );
}
