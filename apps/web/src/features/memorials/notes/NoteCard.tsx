import {
  NOTE_MAX_LENGTH,
  noteBodyProblem,
  normalizeNoteBody,
  normalizeReportDetails,
  REPORT_DETAILS_MAX_LENGTH,
  REPORT_REASONS,
  reportDetailsProblem,
  type ReportReason,
} from '@memorial-garden/shared';
import { useId, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useDateFormat } from '@/app/useDateFormat';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { NoteError, type Note } from '@/core/notes';
import { ReportError } from '@/core/reports';
import { useSession } from '@/features/auth/session';
import { useAuthActions } from '@/features/auth/useAuthActions';
import { cn } from '@/lib/utils';
import { useNoteActions } from './useNotes';
import { useReportNote } from './useReportNote';

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
  const [mode, setMode] = useState<'read' | 'edit' | 'confirm-delete' | 'report'>('read');
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

      {mode === 'report' ? <ReportForm noteId={note.id} onDone={() => setMode('read')} /> : null}

      {mode === 'read' ? (
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
          {mine ? null : (
            <Button variant="ghost" size="small" onClick={() => setMode('report')}>
              {t('memorial.report.button')}
            </Button>
          )}
        </div>
      ) : null}
    </article>
  );
}

function ReportForm({ noteId, onDone }: { noteId: string; onDone: () => void }) {
  const { t } = useTranslation();
  const session = useSession();
  const { signIn, pending: signingIn } = useAuthActions();
  const report = useReportNote();
  const groupId = useId();
  const detailsId = useId();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [touched, setTouched] = useState(false);
  const problem = reportDetailsProblem(details);

  if (session.status !== 'signed-in')
    return (
      <div className="bg-muted flex flex-col items-start gap-2 rounded-lg p-4" role="group">
        <p className="text-sm">{t('memorial.report.signIn')}</p>
        <div className="flex gap-2">
          <Button size="small" onClick={() => void signIn()} disabled={signingIn}>
            {t('auth.signIn')}
          </Button>
          <Button variant="ghost" size="small" onClick={onDone}>
            {t('common.cancel')}
          </Button>
        </div>
      </div>
    );

  function submit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (!reason || problem) return;
    const text = normalizeReportDetails(details);
    report.mutate(
      { noteId, reason, details: text === '' ? null : text },
      {
        onSuccess: () => {
          toast(t('memorial.report.sent'));
          onDone();
        },
        onError: (error) => {
          if (error instanceof ReportError && error.code === 'already_reported') {
            toast(t('memorial.report.already'));
            onDone();
          } else if (error instanceof ReportError && error.code === 'rate_limit')
            toast.error(t('memorial.report.rateLimit'));
          else toast.error(t('memorial.report.failed'));
        },
      },
    );
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="border-border flex flex-col gap-3 rounded-lg border p-4"
      aria-labelledby={`${groupId}-title`}
    >
      <p id={`${groupId}-title`} className="font-medium">
        {t('memorial.report.title')}
      </p>
      <fieldset className="flex flex-col gap-1">
        <legend className="sr-only">{t('memorial.report.reasonLabel')}</legend>
        {REPORT_REASONS.map((value) => (
          <label key={value} className="min-h-touch flex cursor-pointer items-center gap-3">
            <input
              type="radio"
              name={groupId}
              value={value}
              checked={reason === value}
              onChange={() => setReason(value)}
              className="peer sr-only"
            />
            <span
              aria-hidden="true"
              className="border-input peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:outline-ring peer-checked:after:bg-primary-foreground grid size-5 shrink-0 place-items-center rounded-full border-2 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 after:size-2 after:rounded-full after:bg-transparent"
            />
            <span>{t(`memorial.report.reasons.${value}`)}</span>
          </label>
        ))}
        {touched && !reason ? (
          <p className="text-destructive text-sm" role="alert">
            {t('memorial.report.chooseReason')}
          </p>
        ) : null}
      </fieldset>
      <label htmlFor={detailsId} className="text-sm font-medium">
        {t('memorial.report.detailsLabel')}
      </label>
      <Textarea
        id={detailsId}
        rows={3}
        value={details}
        maxLength={REPORT_DETAILS_MAX_LENGTH + 100}
        aria-invalid={(touched && problem !== null) || undefined}
        aria-describedby={`${detailsId}-help`}
        onChange={(event) => setDetails(event.target.value)}
      />
      <p
        id={`${detailsId}-help`}
        className={cn('text-sm', touched && problem ? 'text-destructive' : 'text-muted-foreground')}
        aria-live="polite"
      >
        {touched && problem
          ? t(`memorial.report.problem.${problem}`, { max: REPORT_DETAILS_MAX_LENGTH })
          : t('memorial.report.privacy')}
      </p>
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="ghost" size="small" onClick={onDone}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" size="small" disabled={report.isPending}>
          {t('memorial.report.submit')}
        </Button>
      </div>
    </form>
  );
}
