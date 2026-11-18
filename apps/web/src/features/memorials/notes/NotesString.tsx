import { PenLine } from 'lucide-react';
import { useRef, useState, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useDateFormat } from '@/app/useDateFormat';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Memorial } from '@/core/memorial';
import type { Note } from '@/core/notes';
import { useSession } from '@/features/auth/session';
import { useAuthActions } from '@/features/auth/useAuthActions';
import { cn } from '@/lib/utils';
import { KeepsakeString, PaperSlip, type StringItem } from '../objects/KeepsakeString';
import { NoteCard, NoteForm } from './NoteCard';
import { useNoteActions } from './useNotes';

const slipFocus =
  'focus-visible:outline-ring block w-full rounded-sm text-left focus-visible:outline-3 focus-visible:outline-offset-4';

type NotesStringProps = {
  memorial: Memorial;
  notes: Note[];
  loading: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side: 'left' | 'right';
  title: string;
  onCloseAutoFocus: (event: Event) => void;
};

export function NotesString({
  memorial,
  notes,
  loading,
  open,
  onOpenChange,
  side,
  title,
  onCloseAutoFocus,
}: NotesStringProps) {
  const { t } = useTranslation();
  const format = useDateFormat();
  const session = useSession();
  const { create } = useNoteActions(memorial.id);
  const [writing, setWriting] = useState(false);
  const [readingId, setReadingId] = useState<string | null>(null);
  const [posted, setPosted] = useState(0);
  const opener = useRef<HTMLElement | null>(null);
  const remember = (event: MouseEvent<HTMLElement>) => {
    opener.current = event.currentTarget;
  };
  const returnFocus = (event: Event) => {
    event.preventDefault();
    const target = opener.current?.isConnected ? opener.current : null;
    (target ?? document.querySelector<HTMLElement>('[data-string="notes"] button'))?.focus();
  };
  const userId = session.status === 'signed-in' ? session.user.id : null;
  const isOwner = userId !== null && userId === memorial.ownerId;
  const reading = notes.find((note) => note.id === readingId) ?? null;
  const authorOf = (note: Note) =>
    note.authorId === userId
      ? t('memorial.notes.you')
      : (note.authorName ?? t('memorial.notes.someone'));

  const items: StringItem[] = [];
  if (loading || notes.length === 0)
    items.push({
      key: 'empty',
      node: (
        <PaperSlip className="items-center justify-center text-center">
          <p className="text-muted-foreground">
            {loading ? t('common.loading') : t('memorial.notes.emptyInvite')}
          </p>
        </PaperSlip>
      ),
    });

  for (const note of notes) {
    const mine = note.authorId === userId;
    const hidden = note.status === 'hidden_by_owner';
    items.push({
      key: note.id,
      node: (
        <button
          type="button"
          className={slipFocus}
          onClick={(event) => {
            remember(event);
            setReadingId(note.id);
          }}
          data-note={note.id}
          data-mine={mine || undefined}
        >
          <PaperSlip className={cn(hidden && 'opacity-75')}>
            {mine ? (
              <span
                aria-hidden="true"
                className="bg-gold/70 absolute -top-1 left-4 h-3 w-10 -rotate-3 rounded-[1px]"
              />
            ) : null}
            <span className="text-muted-foreground flex flex-wrap items-baseline gap-x-2 text-sm">
              <span className="text-foreground font-medium">{authorOf(note)}</span>
              <time dateTime={note.createdAt}>{format.timestamp(note.createdAt)}</time>
            </span>
            <span className="line-clamp-6 leading-relaxed [overflow-wrap:anywhere] whitespace-pre-wrap">
              {note.body}
            </span>
            {hidden ? (
              <span className="bg-muted text-foreground mt-auto self-start rounded-full px-2 py-0.5 text-xs">
                {t('memorial.notes.hiddenLabel')}
              </span>
            ) : null}
          </PaperSlip>
        </button>
      ),
    });
  }

  return (
    <KeepsakeString
      open={open}
      onOpenChange={onOpenChange}
      kind="notes"
      side={side}
      title={title}
      items={items}
      resetKey={posted}
      onCloseAutoFocus={onCloseAutoFocus}
      showPager={notes.length > 0}
      action={
        session.status === 'unavailable' ? null : (
          <Button
            size="small"
            onClick={(event) => {
              remember(event);
              setWriting(true);
            }}
          >
            <PenLine className="size-4" aria-hidden="true" />
            {t('memorial.notes.write')}
          </Button>
        )
      }
    >
      <Dialog open={writing} onOpenChange={setWriting}>
        <DialogContent aria-describedby={undefined} onCloseAutoFocus={returnFocus}>
          <DialogHeader>
            <DialogTitle>{t('memorial.notes.write')}</DialogTitle>
          </DialogHeader>
          {session.status !== 'signed-in' ? (
            <SignInSlip />
          ) : (
            <NoteForm
              autoFocus
              submitLabel={t('memorial.notes.post')}
              pending={create.isPending}
              onCancel={() => setWriting(false)}
              onSubmit={(body) =>
                create.mutateAsync(body).then(() => {
                  setWriting(false);
                  setPosted((count) => count + 1);
                  toast(t('memorial.notes.posted'));
                })
              }
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={reading !== null} onOpenChange={(next) => !next && setReadingId(null)}>
        <DialogContent aria-describedby={undefined} onCloseAutoFocus={returnFocus}>
          {reading ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {reading.authorId === userId
                    ? t('memorial.notes.fromYou')
                    : t('memorial.notes.from', { name: authorOf(reading) })}
                </DialogTitle>
              </DialogHeader>
              <NoteCard
                key={reading.id}
                note={reading}
                memorialId={memorial.id}
                mine={reading.authorId === userId}
                canHide={isOwner}
                author={authorOf(reading)}
                onDeleted={() => setReadingId(null)}
              />
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </KeepsakeString>
  );
}

function SignInSlip() {
  const { t } = useTranslation();
  const { signIn, pending } = useAuthActions();
  return (
    <div className="flex flex-col items-start gap-3">
      <p className="leading-relaxed">{t('memorial.notes.signInPrompt')}</p>
      <Button onClick={() => void signIn()} disabled={pending}>
        {t('auth.signIn')}
      </Button>
    </div>
  );
}
