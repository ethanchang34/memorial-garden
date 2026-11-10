import type { DatePrecision } from '@memorial-garden/shared';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { DateFieldValue } from './dateFieldValue';

type DateFieldProps = {
  legend: string;
  value: DateFieldValue;
  onChange: (value: DateFieldValue) => void;
  allowUnknown?: boolean;
  error?: string | null;
};

const PRECISIONS: DatePrecision[] = ['day', 'month', 'year', 'circa'];

export function DateField({
  legend,
  value,
  onChange,
  allowUnknown = false,
  error,
}: DateFieldProps) {
  const { t } = useTranslation();
  const inputId = useId();
  const errorId = useId();
  const options = allowUnknown ? [...PRECISIONS, 'unknown' as const] : PRECISIONS;
  const maxYear = new Date().getFullYear();

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-1 text-base font-bold">{legend}</legend>
      <div
        role="radiogroup"
        aria-label={t('memorial.form.precisionLabel', { field: legend })}
        className="flex flex-wrap gap-2"
      >
        {options.map((precision) => (
          <label
            key={precision}
            className={cn(
              'min-h-touch has-[:focus-visible]:outline-ring flex cursor-pointer items-center rounded-full border px-4 text-sm font-bold transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2',
              value.precision === precision
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-secondary text-secondary-foreground can-hover:hover:bg-secondary-hover',
            )}
          >
            <input
              type="radio"
              className="sr-only"
              name={inputId}
              checked={value.precision === precision}
              onChange={() => onChange({ precision, value: '' })}
            />
            {t(`memorial.form.precision.${precision}`)}
          </label>
        ))}
      </div>
      {value.precision !== 'unknown' ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor={inputId} className="sr-only">
            {legend}
          </Label>
          <Input
            id={inputId}
            type={
              value.precision === 'day' ? 'date' : value.precision === 'month' ? 'month' : 'number'
            }
            inputMode={
              value.precision === 'year' || value.precision === 'circa' ? 'numeric' : undefined
            }
            min={value.precision === 'year' || value.precision === 'circa' ? 1 : undefined}
            max={value.precision === 'year' || value.precision === 'circa' ? maxYear : undefined}
            placeholder={
              value.precision === 'month'
                ? 'YYYY-MM'
                : value.precision === 'day'
                  ? undefined
                  : 'YYYY'
            }
            value={value.value}
            onChange={(event) => onChange({ ...value, value: event.target.value })}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className="max-w-xs"
          />
        </div>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-destructive text-sm font-bold">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
