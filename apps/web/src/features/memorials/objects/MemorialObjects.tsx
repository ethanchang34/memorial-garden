import { useRef, useState, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import type { Memorial } from '@/core/memorial';
import type { Note } from '@/core/notes';
import { cn } from '@/lib/utils';
import { NotesString } from '../notes/NotesString';
import { KeepsakeString, PaperSlip } from './KeepsakeString';
import { LifeStory } from './LifeStory';
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

type MemorialObjectsProps = {
  memorial: Memorial;
  counts: ObjectCounts;
  notes: Note[];
  notesLoading: boolean;
};

export function MemorialObjects({ memorial, counts, notes, notesLoading }: MemorialObjectsProps) {
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
              <span className="garden-label text-sm">{label(key)}</span>
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

      {PLACEMENTS.map(({ key, side }) => {
        const props = {
          open: open === key,
          onOpenChange: (next: boolean) => setOpen(next ? key : null),
          side,
          title: t(`memorial.objects.${key}.title`),
          onCloseAutoFocus: (event: Event) => {
            event.preventDefault();
            opener.current?.focus();
          },
        };
        if (key === 'notes')
          return (
            <NotesString
              key={key}
              {...props}
              memorial={memorial}
              notes={notes}
              loading={notesLoading}
            />
          );
        if (key === 'photos' || key === 'memos')
          return (
            <KeepsakeString
              key={key}
              {...props}
              kind={key}
              items={[{ key: 'empty', node: <EmptySlip kind={key} /> }]}
            />
          );
        return (
          <Drawer key={key} open={props.open} onOpenChange={props.onOpenChange}>
            <DrawerContent side={side} onCloseAutoFocus={props.onCloseAutoFocus}>
              <DrawerTitle className="font-display pr-10 text-2xl font-medium tracking-tight">
                {props.title}
              </DrawerTitle>
              <LifeStory memorial={memorial} />
            </DrawerContent>
          </Drawer>
        );
      })}
    </>
  );
}

function EmptySlip({ kind }: { kind: 'photos' | 'memos' }) {
  const { t } = useTranslation();
  return (
    <PaperSlip className={cn(kind === 'photos' ? 'pb-3' : 'items-center justify-center')}>
      {kind === 'photos' ? (
        <span aria-hidden="true" className="bg-muted block aspect-[4/3] w-full rounded-[2px]" />
      ) : null}
      <p className="text-muted-foreground text-center">{t(`memorial.objects.${kind}.empty`)}</p>
    </PaperSlip>
  );
}
