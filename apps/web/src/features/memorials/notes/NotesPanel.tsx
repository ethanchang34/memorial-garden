import { NOTE_MAX_LENGTH, noteBodyProblem, normalizeNoteBody } from '@memorial-garden/shared';
import { useId, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useDateFormat } from '@/app/useDateFormat';
import { Button } from '@/components/ui/button';
import { DrawerDescription } from '@/components/ui/drawer';
import { Pager } from '@/components/ui/pager';
import { Textarea } from '@/components/ui/textarea';
import type { Memorial } from '@/core/memorial';
import { NoteError, type Note } from '@/core/notes';
import { useSession } from '@/features/auth/session';
import { useAuthActions } from '@/features/auth/useAuthActions';
import { pageOf } from '@/lib/pages';
import { cn } from '@/lib/utils';
import { useNoteActions } from './useNotes';

const PER_PAGE = 6;
const LONG_NOTE = 320;

type NotesPanelProps = { memorial: Memorial; notes: Note[]; loading: boolean };

export function NotesPanel({ memorial, notes, loading }: NotesPanelProps) {
  const { t } = useTranslation();
  const session = useSession();
  const [page, setPage] = useState(0);
  const userId = session.status === 'signed-in' ? session.user.id : null;
  const isOwner = userId !== null && userId === memorial.ownerId;
  const slice = pageOf(notes, PER_PAGE, page);

  return (
    <div className="flex flex-1 flex-col gap-5">
      {session.status === 'signed-in' ? (
        <Composer memorialId={memorial.id} onSaved={() => setPage(0)} />
      ) : session.status !== 'unavailable' ? (
        <SignInPrompt />
      ) : null}
      <DrawerDescription className="text-muted-foreground leading-relaxed">
        {loading
          ? t('common.loading')
          : notes.length === 0
            ? t('memorial.objects.notes.empty')
            : t('memorial.notes.intro')}
      </DrawerDescription>
      {slice.items.length > 0 ? (
        <ul className="flex flex-col gap-3" data-notes="">
          {slice.items.map((note) => (
            <li key={note.id}>
              <NoteCard
                note={note}
                memorialId={memorial.id}
                mine={note.authorId === userId}
                canHide={isOwner}
              />
            </li>
          ))}
        </ul>
      ) : null}
      <Pager className="mt-auto" page={slice.page} pageCount={slice.pageCount} onPage={setPage} />
    </div>
  );
}

function SignInPrompt() {
  const { t } = useTranslation();
  const { signIn, pending } = useAuthActions();
  return (
    <div className="bg-muted flex flex-col items-start gap-3 rounded-lg p-4">
      <p>{t('memorial.notes.signInPrompt')}</p>
      <Button size="small" onClick={() => void signIn()} disabled={pending}>
        {t('auth.signIn')}
      </Button>
    </div>
  );
}

function noteErrorMessage(error: unknown, t: (key: string) => string): string {
  if (error instanceof NoteError && error.code === 'rate_limit')
    return t('memorial.notes.rateLimit');
  if (error instanceof NoteError && error.code === 'new_account_limit')
    return t('memorial.notes.newAccountLimit');
  return t('memorial.notes.saveFailed');
}

type NoteFormProps = {
  initial?: string;
  submitLabel: string;
  pending: boolean;
  onSubmit: (body: string) => Promise<unknown>;
  onCancel?: () => void;
  autoFocus?: boolean;
};

function NoteForm({
  initial = '',
  submitLabel,
  pending,
  onSubmit,
  onCancel,
  autoFocus,
}: NoteFormProps) {
  const { t } = useTranslation();
  const id = useId();
  const [body, setBody] = useState(initial);
  const [touched, setTouched] = useState(false);
  const problem = noteBodyProblem(body);
  const length = [...normalizeNoteBody(body)].length;
  const showProblem = touched && problem !== null;

  function submit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (problem) return;
    onSubmit(normalizeNoteBody(body))
      .then(() => {
        setBody('');
        setTouched(false);
      })
      .catch((error: unknown) => toast.error(noteErrorMessage(error, t)));
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2" noValidate>
      <label htmlFor={id} className="sr-only">
        {t('memorial.notes.fieldLabel')}
      </label>
      <Textarea
        id={id}
        value={body}
        rows={4}
        maxLength={NOTE_MAX_LENGTH + 200}
        autoFocus={autoFocus}
        placeholder={t('memorial.notes.placeholder')}
        aria-invalid={showProblem || undefined}
        aria-describedby={`${id}-help`}
        onChange={(event) => setBody(event.target.value)}
        className="max-h-[40dvh]"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p
          id={`${id}-help`}
          className={cn('text-sm', showProblem ? 'text-destructive' : 'text-muted-foreground')}
          aria-live="polite"
        >
          {showProblem
            ? t(`memorial.notes.problem.${problem}`, { max: NOTE_MAX_LENGTH })
            : t('memorial.notes.counter', { count: length, max: NOTE_MAX_LENGTH })}
        </p>
        <div className="flex gap-2">
          {onCancel ? (
            <Button type="button" variant="ghost" size="small" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
          ) : null}
          <Button type="submit" size="small" disabled={pending}>
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Composer({ memorialId, onSaved }: { memorialId: string; onSaved: () => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { create } = useNoteActions(memorialId);

  if (!open)
    return (
      <Button className="self-start" onClick={() => setOpen(true)}>
        {t('memorial.notes.write')}
      </Button>
    );

  return (
    <NoteForm
      autoFocus
      submitLabel={t('memorial.notes.post')}
      pending={create.isPending}
      onCancel={() => setOpen(false)}
      onSubmit={(body) =>
        create.mutateAsync(body).then(() => {
          setOpen(false);
          onSaved();
          toast(t('memorial.notes.posted'));
        })
      }
    />
  );
}

type NoteCardProps = { note: Note; memorialId: string; mine: boolean; canHide: boolean };

function NoteCard({ note, memorialId, mine, canHide }: NoteCardProps) {
  const { t } = useTranslation();
  const format = useDateFormat();
  const actions = useNoteActions(memorialId);
  const [mode, setMode] = useState<'read' | 'edit' | 'confirm-delete'>('read');
  const [expanded, setExpanded] = useState(false);
  const hidden = note.status === 'hidden_by_owner';
  const long = note.body.length > LONG_NOTE;
  const author = mine ? t('memorial.notes.you') : (note.authorName ?? t('memorial.notes.someone'));

  const fail = () => toast.error(t('memorial.notes.saveFailed'));

  return (
    <article
      className={cn(
        'border-border bg-card shadow-soft relative overflow-hidden rounded-lg border py-3 pr-4 pl-5',
        hidden && 'opacity-70',
      )}
      data-note={note.id}
      data-mine={mine || undefined}
    >
      <span
        aria-hidden="true"
        className={cn('absolute inset-y-0 left-0 w-1.5', mine ? 'bg-gold' : 'bg-stone')}
      />
      <header className="text-muted-foreground mb-1.5 flex flex-wrap items-baseline gap-x-2 text-sm">
        <span className="text-foreground font-medium">{author}</span>
        <time dateTime={note.createdAt}>{format.timestamp(note.createdAt)}</time>
        {note.editedAt ? (
          <span>{t('memorial.notes.edited', { date: format.timestamp(note.editedAt) })}</span>
        ) : null}
        {hidden ? (
          <span className="bg-muted text-foreground rounded-full px-2 py-0.5 text-xs">
            {t('memorial.notes.hiddenLabel')}
          </span>
        ) : null}
      </header>

      {mode === 'edit' ? (
        <NoteForm
          autoFocus
          initial={note.body}
          submitLabel={t('memorial.notes.save')}
          pending={actions.update.isPending}
          onCancel={() => setMode('read')}
          onSubmit={(body) =>
            actions.update.mutateAsync({ id: note.id, body }).then(() => setMode('read'))
          }
        />
      ) : (
        <>
          <p
            className={cn(
              'leading-relaxed [overflow-wrap:anywhere] whitespace-pre-wrap',
              long && !expanded && 'line-clamp-6',
            )}
          >
            {note.body}
          </p>
          {long ? (
            <Button
              variant="ghost"
              size="small"
              className="mt-1 -ml-2"
              aria-expanded={expanded}
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? t('memorial.notes.showLess') : t('memorial.notes.readMore')}
            </Button>
          ) : null}
        </>
      )}

      {mode === 'confirm-delete' ? (
        <div role="group" className="mt-3 flex flex-wrap items-center gap-2" aria-live="polite">
          <p className="text-sm">{t('memorial.notes.confirmDelete')}</p>
          <Button
            variant="destructive"
            size="small"
            disabled={actions.remove.isPending}
            onClick={() =>
              actions.remove
                .mutateAsync(note.id)
                .then(() => toast(t('memorial.notes.deleted')), fail)
            }
          >
            {t('memorial.notes.delete')}
          </Button>
          <Button variant="ghost" size="small" onClick={() => setMode('read')}>
            {t('common.cancel')}
          </Button>
        </div>
      ) : null}

      {mode === 'read' && (mine || canHide) ? (
        <div className="mt-2 -ml-2 flex flex-wrap gap-1">
          {mine ? (
            <>
              <Button variant="ghost" size="small" onClick={() => setMode('edit')}>
                {t('memorial.notes.edit')}
              </Button>
              <Button variant="ghost" size="small" onClick={() => setMode('confirm-delete')}>
                {t('memorial.notes.delete')}
              </Button>
            </>
          ) : null}
          {canHide ? (
            <Button
              variant="ghost"
              size="small"
              disabled={actions.setHidden.isPending}
              onClick={() =>
                actions.setHidden
                  .mutateAsync({ id: note.id, hidden: !hidden })
                  .then(
                    () => toast(hidden ? t('memorial.notes.shown') : t('memorial.notes.hidden')),
                    fail,
                  )
              }
            >
              {hidden ? t('memorial.notes.unhide') : t('memorial.notes.hide')}
            </Button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
