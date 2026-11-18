import {
  EPITAPH_MAX_LENGTH,
  MEMORIAL_NAME_MAX_LENGTH,
  memorialInputSchema,
  type MemorialInput,
} from '@memorial-garden/shared';
import { useId, useState, type FormEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Memorial } from '@/core/memorial';
import { DateField } from './DateField';
import {
  EMPTY_DATE,
  fromMemorialDate,
  toMemorialDate,
  type DateFieldValue,
} from './dateFieldValue';

type Errors = Partial<Record<'fullName' | 'born' | 'died' | 'epitaph', string>>;

type MemorialFormProps = {
  initial?: Memorial;
  submitLabel: string;
  savingLabel: string;
  pending: boolean;
  onSubmit: (input: MemorialInput) => void;
  secondary?: ReactNode;
};

export function MemorialForm({
  initial,
  submitLabel,
  savingLabel,
  pending,
  onSubmit: save,
  secondary,
}: MemorialFormProps) {
  const { t } = useTranslation();
  const nameId = useId();
  const epitaphId = useId();
  const [fullName, setFullName] = useState(initial?.fullName ?? '');
  const [born, setBorn] = useState<DateFieldValue>(
    initial ? fromMemorialDate(initial.born) : { precision: 'unknown', value: '' },
  );
  const [died, setDied] = useState<DateFieldValue>(
    initial ? fromMemorialDate(initial.died) : EMPTY_DATE,
  );
  const [epitaph, setEpitaph] = useState(initial?.epitaph ?? '');
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
        save(parsed.data);
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
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? savingLabel : submitLabel}
        </Button>
        {secondary}
      </div>
    </form>
  );
}
