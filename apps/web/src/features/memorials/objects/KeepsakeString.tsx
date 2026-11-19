import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pager } from '@/components/ui/pager';
import { cn } from '@/lib/utils';

const MIN_CELL_PX = 248;
const MAX_PER_VIEW = 5;

export type StringItem = { key: string; node: ReactNode };

type KeepsakeStringProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: 'photos' | 'notes' | 'memos';
  side: 'left' | 'right';
  title: string;
  items: readonly StringItem[];
  resetKey?: unknown;
  onCloseAutoFocus: (event: Event) => void;
  action?: ReactNode;
  showPager?: boolean;
  children?: ReactNode;
};

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function Twine() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 28"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 top-0 h-7 w-full overflow-visible"
    >
      <path
        d="M0 3 Q50 25 100 3"
        className="stroke-gold-deep fill-none"
        strokeWidth="3"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M0 3 Q50 25 100 3"
        className="stroke-gold fill-none"
        strokeWidth="1.4"
        strokeDasharray="3 2"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function Clothespin() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 10 24"
      className="pointer-events-none absolute top-1.5 left-1/2 z-10 h-6 w-2.5 -translate-x-1/2"
    >
      <rect x="0.5" y="0.5" width="9" height="23" rx="2" className="fill-wood stroke-gold-deep" />
      <line x1="5" y1="2" x2="5" y2="22" className="stroke-gold-deep" strokeWidth="0.8" />
      <rect x="0" y="9" width="10" height="3" rx="1" className="fill-stone-dark" />
    </svg>
  );
}

export function KeepsakeString({
  open,
  onOpenChange,
  kind,
  side,
  title,
  items,
  resetKey,
  onCloseAutoFocus,
  action,
  showPager,
  children,
}: KeepsakeStringProps) {
  const { t } = useTranslation();
  const [track, setTrack] = useState<HTMLUListElement | null>(null);
  const [perView, setPerView] = useState(1);
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(items.length / perView));
  const fillers = (perView - (items.length % perView)) % perView;
  const shownPage = Math.min(page, pageCount - 1);
  const first = shownPage * perView + 1;
  const last = Math.min(items.length, first + perView - 1);
  const positionLabel =
    first === last
      ? t('pager.item', { index: first, total: items.length })
      : t('pager.range', { from: first, to: last, total: items.length });
  const firstReset = useRef(true);

  useEffect(() => {
    if (!track) return undefined;
    const measure = () =>
      setPerView(Math.min(MAX_PER_VIEW, Math.max(1, Math.floor(track.clientWidth / MIN_CELL_PX))));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [track]);

  useEffect(() => {
    if (firstReset.current) {
      firstReset.current = false;
      return;
    }
    track?.scrollTo({ left: 0 });
  }, [resetKey, track]);

  function sync() {
    if (!track || track.clientWidth === 0) return;
    setPage(Math.round(track.scrollLeft / track.clientWidth));
  }

  function goTo(next: number) {
    if (!track) return;
    track.scrollTo({
      left: next * track.clientWidth,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
    setPage(next);
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="bg-ink/40 data-[state=open]:animate-fade-in fixed inset-0 z-50" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onCloseAutoFocus={onCloseAutoFocus}
          className="group pointer-events-none fixed inset-0 z-50 flex flex-col justify-center overflow-y-auto outline-none"
          data-string={kind}
        >
          <div
            className={cn(
              'pointer-events-auto relative flex w-[92%] flex-col gap-3 py-4 md:w-3/4',
              side === 'left'
                ? 'group-data-[state=open]:animate-string-left mr-auto'
                : 'group-data-[state=open]:animate-string-right ml-auto',
            )}
          >
            <div className="px-safe flex items-center justify-between gap-3">
              <DialogPrimitive.Title className="garden-label font-display min-w-0 truncate px-1 text-2xl font-medium tracking-tight">
                {title}
              </DialogPrimitive.Title>
              {action ? <div className="ml-auto shrink-0">{action}</div> : null}
              <DialogPrimitive.Close
                className="size-touch bg-card/90 text-foreground focus-visible:outline-ring can-hover:hover:bg-card grid shrink-0 place-items-center rounded-full shadow-sm transition-colors focus-visible:outline-3 focus-visible:outline-offset-3"
                aria-label={t('common.close')}
              >
                <X className="size-5" aria-hidden="true" />
              </DialogPrimitive.Close>
            </div>

            <div className="relative">
              <span
                aria-hidden="true"
                className={cn(
                  'bg-wood border-gold-deep absolute top-0 z-10 size-3 -translate-y-1/3 rounded-full border',
                  side === 'left' ? '-right-1' : '-left-1',
                )}
              />
              <ul
                ref={setTrack}
                onScroll={sync}
                style={{ '--per-view': perView } as CSSProperties}
                className="flex snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto overscroll-x-contain [&::-webkit-scrollbar]:hidden"
                data-string-track=""
              >
                {items.map((item, index) => (
                  <li
                    key={item.key}
                    className="keepsake-follow relative w-[calc(100%/var(--per-view))] shrink-0 snap-start px-3 pt-5 pb-6"
                    style={
                      {
                        animationDelay: `${Math.min(index, 6) * 70}ms`,
                        '--follow-from': side === 'left' ? '-56px' : '56px',
                      } as CSSProperties
                    }
                  >
                    <Twine />
                    <Clothespin />
                    <div
                      className="keepsake-sway relative mx-auto w-full max-w-[min(17rem,82vw)]"
                      style={{ animationDelay: `${-((index * 1.7) % 5.5)}s` }}
                    >
                      {item.node}
                    </div>
                  </li>
                ))}
                {Array.from({ length: fillers }, (_, index) => (
                  <li
                    key={`filler-${index}`}
                    aria-hidden="true"
                    className="relative w-[calc(100%/var(--per-view))] shrink-0"
                  >
                    <Twine />
                  </li>
                ))}
              </ul>
            </div>

            {(showPager ?? pageCount > 1) ? (
              <div className="px-safe flex justify-center">
                <Pager
                  className="bg-card/90 w-full max-w-xs rounded-full px-1 shadow-sm"
                  page={Math.min(page, pageCount - 1)}
                  pageCount={pageCount}
                  onPage={goTo}
                  label={positionLabel}
                />
              </div>
            ) : null}
          </div>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function PaperSlip({
  className,
  children,
  ...props
}: { className?: string; children: ReactNode } & Record<`data-${string}`, unknown>) {
  return (
    <div
      className={cn(
        'bg-card text-card-foreground shadow-lift relative flex min-h-44 flex-col gap-2 rounded-sm px-4 pt-5 pb-4',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
