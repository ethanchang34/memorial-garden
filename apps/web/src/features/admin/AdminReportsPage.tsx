import { useId, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { useDateFormat } from '@/app/useDateFormat';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  ADMIN_DECISIONS,
  ADMIN_REASON_MAX_LENGTH,
  AdminError,
  type AdminDecision,
  type ReportedNote,
} from '@/core/admin';
import { useSession } from '@/features/auth/session';
import { NotFoundPage } from '@/features/not-found/NotFoundPage';
import { cn } from '@/lib/utils';
import { useReportQueue, useResolveReports } from './useAdmin';

export function AdminReportsPage() {
  const { t } = useTranslation();
  const session = useSession();
  const queue = useReportQueue();

  if (session.status === 'loading' || (session.status === 'signed-in' && queue.isPending))
    return (
      <p className="text-muted-foreground mx-auto w-[min(100%-2rem,48rem)] py-10">
        {t('common.loading')}
      </p>
    );
  if (session.status !== 'signed-in') return <NotFoundPage />;
  if (queue.isError)
    return queue.error instanceof AdminError && queue.error.code === 'forbidden' ? (
      <NotFoundPage />
    ) : (
      <p role="alert" className="mx-auto w-[min(100%-2rem,48rem)] py-10">
        {t('admin.reports.loadFailed')}
      </p>
    );

  const items = queue.data ?? [];
  return (
    <section className="mx-auto flex w-[min(100%-2rem,48rem)] flex-col gap-6 py-10">
      <header className="flex flex-col gap-2">
        <h1>{t('admin.reports.heading')}</h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          {items.length === 0
            ? t('admin.reports.empty')
            : t('admin.reports.count', { count: items.length })}
        </p>
      </header>
      <ul className="flex flex-col gap-4">
        {items.map((item) => (
          <li key={item.noteId}>
            <ReportCard item={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ReportCard({ item }: { item: ReportedNote }) {
  const { t } = useTranslation();
  const format = useDateFormat();
  const resolve = useResolveReports();
  const id = useId();
  const [decision, setDecision] = useState<AdminDecision | null>(null);
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const missing = reason.trim() === '';

  function submit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (!decision || missing) return;
    resolve.mutate(
      { noteId: item.noteId, decision, reason: reason.trim() },
      {
        onSuccess: () => toast(t(`admin.reports.done.${decision}`)),
        onError: () => toast.error(t('admin.reports.failed')),
      },
    );
  }

  return (
    <article
      className="border-border bg-card shadow-soft flex flex-col gap-4 rounded-xl border p-5"
      data-report={item.noteId}
    >
      <div className="text-muted-foreground flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
        <span className="bg-muted text-foreground rounded-full px-2.5 py-0.5 font-medium">
          {t('admin.reports.reportCount', { count: item.reportCount })}
        </span>
        <span>{t('admin.reports.on', { name: item.memorialName })}</span>
        <span>
          {t('admin.reports.by', { name: item.authorName ?? t('memorial.notes.someone') })}
          {item.authorStatus && item.authorStatus !== 'active'
            ? ` · ${t(`admin.reports.authorStatus.${item.authorStatus}`, { defaultValue: item.authorStatus })}`
            : ''}
        </span>
        <time dateTime={item.noteCreatedAt}>{format.timestamp(item.noteCreatedAt)}</time>
      </div>
      <blockquote
        className={cn(
          'border-stone border-l-4 pl-4 text-lg leading-relaxed [overflow-wrap:anywhere] whitespace-pre-wrap',
          item.noteStatus !== 'visible' && 'opacity-70',
        )}
      >
        {item.body}
      </blockquote>
      {item.noteStatus !== 'visible' ? (
        <p className="text-sm">
          {t(`admin.reports.noteStatus.${item.noteStatus}`, { defaultValue: item.noteStatus })}
        </p>
      ) : null}
      <Button asChild variant="secondary" size="small" className="self-start">
        <Link to={`/m/${item.memorialSlug}`}>
          {t('admin.reports.openGarden', { name: item.memorialName })}
        </Link>
      </Button>
      <div className="flex flex-col gap-1 text-sm">
        <p>
          <span className="font-medium">{t('admin.reports.reasons')}</span>{' '}
          {item.reasons
            .map((value) => t(`memorial.report.reasons.${value}`, { defaultValue: value }))
            .join(' · ')}
        </p>
        {item.details.map((detail, index) => (
          <p key={index} className="text-muted-foreground [overflow-wrap:anywhere]">
            “{detail}”
          </p>
        ))}
      </div>
      <form
        onSubmit={submit}
        noValidate
        className="border-border flex flex-col gap-3 border-t pt-4"
      >
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 text-sm font-medium">{t('admin.reports.decisionLabel')}</legend>
          {ADMIN_DECISIONS.map((value) => (
            <label key={value} className="min-h-touch flex cursor-pointer items-center gap-3">
              <input
                type="radio"
                name={`${id}-decision`}
                value={value}
                checked={decision === value}
                onChange={() => setDecision(value)}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className="border-input peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:outline-ring peer-checked:after:bg-primary-foreground grid size-5 shrink-0 place-items-center rounded-full border-2 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 after:size-2 after:rounded-full after:bg-transparent"
              />
              <span>{t(`admin.reports.decisions.${value}`)}</span>
            </label>
          ))}
          {touched && !decision ? (
            <p className="text-destructive text-sm" role="alert">
              {t('admin.reports.chooseDecision')}
            </p>
          ) : null}
        </fieldset>
        <label htmlFor={`${id}-reason`} className="text-sm font-medium">
          {t('admin.reports.reasonLabel')}
        </label>
        <Textarea
          id={`${id}-reason`}
          rows={2}
          value={reason}
          maxLength={ADMIN_REASON_MAX_LENGTH}
          aria-invalid={(touched && missing) || undefined}
          aria-describedby={`${id}-reason-help`}
          onChange={(event) => setReason(event.target.value)}
        />
        <p
          id={`${id}-reason-help`}
          className={cn(
            'text-sm',
            touched && missing ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {touched && missing ? t('admin.reports.reasonRequired') : t('admin.reports.reasonHelp')}
        </p>
        <div className="flex justify-end">
          <Button
            type="submit"
            variant={decision === 'dismiss' || decision === null ? 'default' : 'destructive'}
            disabled={resolve.isPending}
          >
            {t('admin.reports.submit')}
          </Button>
        </div>
      </form>
    </article>
  );
}
