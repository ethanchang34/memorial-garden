import { useRef, useState, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from '@/app/useDateFormat';
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '@/components/ui/drawer';
import { Pager } from '@/components/ui/pager';
import type { Memorial } from '@/core/memorial';
import { pageOf } from '@/lib/pages';
import { cn } from '@/lib/utils';
import { ObjectArt, type ObjectKey } from './ObjectArt';

export type ObjectCounts = Record<Exclude<ObjectKey, 'story'>, number>;

type Placement = { key: ObjectKey; side: 'left' | 'right' };

const PLACEMENTS: readonly Placement[] = [
  { key: 'photos', side: 'left' },
  { key: 'story', side: 'left' },
  { key: 'notes', side: 'right' },
  { key: 'memos', side: 'right' },
];

const TOOLBAR_ORDER: readonly ObjectKey[] = ['photos', 'notes', 'story', 'memos'];

const PER_PAGE = 6;

type MemorialObjectsProps = { memorial: Memorial; counts: ObjectCounts };

export function MemorialObjects({ memorial, counts }: MemorialObjectsProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState<ObjectKey | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);

  const label = (key: ObjectKey) => {
    const name = t(`memorial.objects.${key}.label`);
    const count = key === 'story' ? 0 : counts[key];
    return count > 0 ? t('memorial.objects.withCount', { name, count }) : name;
  };

  const show = (key: ObjectKey) => (event: MouseEvent<HTMLButtonElement>) => {
    opener.current = event.currentTarget;
    setOpen(key);
  };

  const trigger = (key: ObjectKey) => ({
    type: 'button' as const,
    'aria-haspopup': 'dialog' as const,
    'aria-expanded': open === key,
    onClick: show(key),
  });

  const focusRing =
    'focus-visible:outline-ring rounded-lg focus-visible:outline-3 focus-visible:outline-offset-2';

  return (
    <>
      {(['left', 'right'] as const).map((side) => (
        <div
          key={side}
          className={cn(
            'absolute top-1/2 hidden -translate-y-1/2 flex-col gap-[min(1.5rem,3dvh)] md:flex',
            side === 'left' ? 'left-0 items-start' : 'right-0 items-end',
          )}
        >
          {PLACEMENTS.filter((placement) => placement.side === side).map(({ key }) => (
            <button
              key={key}
              {...trigger(key)}
              data-object={key}
              className={cn(
                'group flex flex-col items-center gap-1 px-3 py-1 transition-transform duration-300 ease-out',
                side === 'left'
                  ? 'can-hover:hover:translate-x-1 -translate-x-2'
                  : 'can-hover:hover:-translate-x-1 translate-x-2',
                'focus-visible:translate-x-0',
                focusRing,
              )}
            >
              <ObjectArt kind={key} className="h-[min(5.5rem,14dvh)] w-auto drop-shadow-sm" />
              <span className="bg-card/85 text-foreground rounded-full px-3 py-0.5 text-sm shadow-sm">
                {label(key)}
              </span>
            </button>
          ))}
        </div>
      ))}

      <nav
        aria-label={t('memorial.objects.toolbar')}
        className="bg-card/75 border-border/60 absolute inset-x-0 bottom-0 grid grid-cols-4 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden"
      >
        {TOOLBAR_ORDER.map((key) => (
          <button
            key={key}
            {...trigger(key)}
            data-toolbar={key}
            className={cn(
              'group min-h-touch flex flex-col items-center justify-center gap-0.5 py-1.5',
              focusRing,
            )}
          >
            <ObjectArt kind={key} className="h-8 w-auto" />
            <span className="text-foreground text-xs leading-tight">{label(key)}</span>
          </button>
        ))}
      </nav>

      {PLACEMENTS.map(({ key, side }) => (
        <Drawer key={key} open={open === key} onOpenChange={(next) => setOpen(next ? key : null)}>
          <DrawerContent
            side={side}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              opener.current?.focus();
            }}
          >
            <DrawerTitle className="font-display pr-10 text-2xl font-medium tracking-tight">
              {t(`memorial.objects.${key}.title`)}
            </DrawerTitle>
            {key === 'story' ? <StoryBody memorial={memorial} /> : <ListBody kind={key} />}
          </DrawerContent>
        </Drawer>
      ))}
    </>
  );
}

function StoryBody({ memorial }: { memorial: Memorial }) {
  const { t } = useTranslation();
  const format = useDateFormat();
  return (
    <div className="flex flex-col gap-3">
      <p className="font-display text-xl">{memorial.fullName}</p>
      <p className="text-muted-foreground">{format.lifespan(memorial.born, memorial.died)}</p>
      {memorial.epitaph ? <p className="text-lg leading-relaxed">{memorial.epitaph}</p> : null}
      <DrawerDescription className="text-muted-foreground leading-relaxed">
        {t('memorial.objects.story.empty')}
      </DrawerDescription>
    </div>
  );
}

function ListBody({ kind }: { kind: Exclude<ObjectKey, 'story'> }) {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const slice = pageOf<never>([], PER_PAGE, page);
  return (
    <div className="flex flex-1 flex-col gap-4">
      {slice.items.length === 0 ? (
        <DrawerDescription className="text-muted-foreground leading-relaxed">
          {t(`memorial.objects.${kind}.empty`)}
        </DrawerDescription>
      ) : null}
      <Pager className="mt-auto" page={slice.page} pageCount={slice.pageCount} onPage={setPage} />
    </div>
  );
}
