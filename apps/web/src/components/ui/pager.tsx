import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

type PagerProps = {
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
  className?: string;
};

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true">
      <polyline
        points={direction === 'left' ? '15 3 6 12 15 21' : '9 3 18 12 9 21'}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const arrowClass =
  'size-touch text-foreground focus-visible:outline-ring can-hover:hover:bg-accent grid place-items-center rounded-full transition-colors focus-visible:outline-3 focus-visible:outline-offset-3 disabled:opacity-30';

export function Pager({ page, pageCount, onPage, className }: PagerProps) {
  const { t } = useTranslation();
  if (pageCount < 2) return null;

  return (
    <nav
      aria-label={t('pager.label')}
      className={cn('flex items-center justify-between', className)}
    >
      <button
        type="button"
        className={arrowClass}
        aria-label={t('pager.previous')}
        disabled={page <= 0}
        onClick={() => onPage(page - 1)}
      >
        <Chevron direction="left" />
      </button>
      <p className="text-muted-foreground text-sm" aria-live="polite">
        {t('pager.position', { page: page + 1, total: pageCount })}
      </p>
      <button
        type="button"
        className={arrowClass}
        aria-label={t('pager.next')}
        disabled={page >= pageCount - 1}
        onClick={() => onPage(page + 1)}
      >
        <Chevron direction="right" />
      </button>
    </nav>
  );
}
