import { z } from 'zod';

export const DATE_PRECISIONS = ['day', 'month', 'year', 'circa'] as const;
export type DatePrecision = (typeof DATE_PRECISIONS)[number];

export type MemorialDate = {
  date: string;
  precision: DatePrecision;
};

export type DateLabels = {
  circa: (year: string) => string;
};

const DEFAULT_LABELS: DateLabels = { circa: (year) => `c. ${year}` };

export const memorialDateSchema = z
  .object({
    date: z.iso.date(),
    precision: z.enum(DATE_PRECISIONS),
  })
  .refine(({ date, precision }) => precision === 'day' || date.endsWith('-01'), {
    message: 'Month, year, and circa dates must be stored as the first day of the range',
  })
  .refine(
    ({ date, precision }) => !['year', 'circa'].includes(precision) || date.endsWith('-01-01'),
    {
      message: 'Year and circa dates must be stored as January 1',
    },
  );

function toUtcDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

function formatYear(isoDate: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { year: 'numeric', timeZone: 'UTC' }).format(
    toUtcDate(isoDate),
  );
}

export function formatMemorialDate(
  value: MemorialDate,
  locale: string,
  labels: DateLabels = DEFAULT_LABELS,
): string {
  const date = toUtcDate(value.date);

  switch (value.precision) {
    case 'day':
      return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(date);
    case 'month':
      return new Intl.DateTimeFormat(locale, {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(date);
    case 'year':
      return formatYear(value.date, locale);
    case 'circa':
      return labels.circa(formatYear(value.date, locale));
  }
}

export function formatLifespan(
  born: MemorialDate | null,
  died: MemorialDate,
  locale: string,
  labels: DateLabels = DEFAULT_LABELS,
): string {
  const toYear = (value: MemorialDate) =>
    value.precision === 'circa'
      ? labels.circa(formatYear(value.date, locale))
      : formatYear(value.date, locale);

  return born ? `${toYear(born)} – ${toYear(died)}` : toYear(died);
}

export function formatTimestamp(timestamp: string, locale: string, timeZone?: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone }).format(
    new Date(timestamp),
  );
}
