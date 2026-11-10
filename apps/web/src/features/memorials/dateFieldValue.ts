import type { DatePrecision, MemorialDate } from '@memorial-garden/shared';

export type DateFieldValue = { precision: DatePrecision | 'unknown'; value: string };

export const EMPTY_DATE: DateFieldValue = { precision: 'day', value: '' };

export function toMemorialDate(field: DateFieldValue): MemorialDate | null | undefined {
  if (field.precision === 'unknown') return null;
  const value = field.value.trim();
  if (field.precision === 'day')
    return /^\d{4}-\d{2}-\d{2}$/.test(value) ? { date: value, precision: 'day' } : undefined;
  if (field.precision === 'month')
    return /^\d{4}-\d{2}$/.test(value) ? { date: `${value}-01`, precision: 'month' } : undefined;
  return /^\d{4}$/.test(value) ? { date: `${value}-01-01`, precision: field.precision } : undefined;
}
