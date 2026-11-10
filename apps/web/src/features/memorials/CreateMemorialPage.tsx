import {
  EPITAPH_MAX_LENGTH,
  MEMORIAL_NAME_MAX_LENGTH,
  memorialInputSchema,
} from '@memorial-garden/shared';
import { useId, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MemorialError } from '@/core/memorial';
import { useSession } from '@/features/auth/session';
import { SignInPrompt } from '@/features/auth/SignInPrompt';
import { DateField } from './DateField';
import { EMPTY_DATE, toMemorialDate, type DateFieldValue } from './dateFieldValue';
import { useCreateMemorial } from './useMemorials';

type Errors = Partial<Record<'fullName' | 'born' | 'died' | 'epitaph', string>>;

export function CreateMemorialPage() {
  const { t } = useTranslation();
  const session = useSession();

  return (
    <section className="mx-auto flex w-[min(100%-2rem,40rem)] flex-col gap-6 py-10">
      <h1>{t('memorial.create.heading')}</h1>
      <p className="text-muted-foreground text-lg leading-relaxed">
        {t('memorial.create.priceNote')}
      </p>
      {session.status === 'signed-in' ? (
        <MemorialForm />
      ) : session.status === 'loading' ? null : (
        <SignInPrompt message={t('memorial.create.signInPrompt')} />
      )}
    </section>
  );
}

function MemorialForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const create = useCreateMemorial();
  const nameId = useId();
  const epitaphId = useId();
  const [fullName, setFullName] = useState('');
  const [born, setBorn] = useState<DateFieldValue>({ precision: 'unknown', value: '' });
  const [died, setDied] = useState<DateFieldValue>(EMPTY_DATE);
  const [epitaph, setEpitaph] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const bornDate = toMemorialDate(born);
    const diedDate = toMemorialDate(died);
    const next: Errors = {};
    if (bornDate === undefined) next.born = t('memorial.form.errors.date');
    if (!diedDate) next.died = t('memorial.form.errors.date');

    if (bornDate !== undefined && diedDate) {
      const parsed = memorialInputSchema.safeParse({
        fullName,
        born: bornDate,
        died: diedDate,
        epitaph,
      });
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          const field = issue.path[0] as keyof Errors;
          next[field] ??= t(`memorial.form.errors.${issue.message}`, {
            max: field === 'epitaph' ? EPITAPH_MAX_LENGTH : MEMORIAL_NAME_MAX_LENGTH,
            defaultValue: t('memorial.form.errors.date'),
          });
        }
      } else if (Object.keys(next).length === 0) {
        setErrors({});
        create.mutate(parsed.data, {
          onSuccess: (memorial) => {
            toast(t('memorial.create.saved'));
            void navigate(`/m/${memorial.slug}`);
          },
          onError: (error) =>
            toast.error(
              error instanceof MemorialError && error.code === 'draft_limit'
                ? t('memorial.create.draftLimit')
                : t('memorial.create.saveFailed'),
            ),
        });
        return;
      }
    }
    setErrors(next);
  }

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="border-border bg-card shadow-soft flex flex-col gap-6 rounded-xl border p-6"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor={nameId}>{t('memorial.form.fullName')}</Label>
        <Input
          id={nameId}
          autoComplete="off"
          maxLength={MEMORIAL_NAME_MAX_LENGTH}
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          aria-invalid={errors.fullName ? true : undefined}
          aria-describedby={errors.fullName ? `${nameId}-error` : undefined}
        />
        {errors.fullName ? (
          <p id={`${nameId}-error`} role="alert" className="text-destructive text-sm font-bold">
            {errors.fullName}
          </p>
        ) : null}
      </div>
      <DateField
        legend={t('memorial.form.born')}
        value={born}
        onChange={setBorn}
        allowUnknown
        error={errors.born}
      />
      <DateField
        legend={t('memorial.form.died')}
        value={died}
        onChange={setDied}
        error={errors.died}
      />
      <div className="flex flex-col gap-2">
        <Label htmlFor={epitaphId}>{t('memorial.form.epitaph')}</Label>
        <Input
          id={epitaphId}
          maxLength={EPITAPH_MAX_LENGTH}
          value={epitaph}
          onChange={(event) => setEpitaph(event.target.value)}
          aria-describedby={`${epitaphId}-help`}
        />
        <p id={`${epitaphId}-help`} className="text-muted-foreground text-sm">
          {t('memorial.form.epitaphHelp')}
        </p>
      </div>
      <div>
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? t('memorial.create.saving') : t('memorial.create.save')}
        </Button>
      </div>
    </form>
  );
}
