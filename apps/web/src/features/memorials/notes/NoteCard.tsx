import { NOTE_MAX_LENGTH, noteBodyProblem, normalizeNoteBody } from '@memorial-garden/shared';
import { useId, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useDateFormat } from '@/app/useDateFormat';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { NoteError, type Note } from '@/core/notes';
import { cn } from '@/lib/utils';
import { useNoteActions } from './useNotes';

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

export function NoteForm({
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
        rows={5}
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

type NoteCardProps = {
  note: Note;
  memorialId: string;
  mine: boolean;
  canHide: boolean;
  author: string;
  onDeleted: () => void;
};

export function NoteCard({ note, memorialId, mine, canHide, author, onDeleted }: NoteCardProps) {
  const { t } = useTranslation();
  const format = useDateFormat();
  const actions = useNoteActions(memorialId);
  const [mode, setMode] = useState<'read' | 'edit' | 'confirm-delete'>('read');
  const hidden = note.status === 'hidden_by_owner';

  const fail = () => toast.error(t('memorial.notes.saveFailed'));

  return (
    <article className="flex flex-col gap-3" data-note-detail={note.id}>
      <header className="text-muted-foreground flex flex-wrap items-baseline gap-x-2 text-sm">
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
        <p className="text-lg leading-relaxed [overflow-wrap:anywhere] whitespace-pre-wrap">
          {note.body}
        </p>
      )}

      {mode === 'confirm-delete' ? (
        <div role="group" className="flex flex-wrap items-center gap-2" aria-live="polite">
          <p className="text-sm">{t('memorial.notes.confirmDelete')}</p>
          <Button
            variant="destructive"
            size="small"
            disabled={actions.remove.isPending}
            onClick={() =>
              actions.remove.mutateAsync(note.id).then(() => {
                toast(t('memorial.notes.deleted'));
                onDeleted();
              }, fail)
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
        <div className="-ml-2 flex flex-wrap gap-1">
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
