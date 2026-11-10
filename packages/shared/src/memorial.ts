import { z } from 'zod';
import { memorialDateSchema } from './dates';

export const MEMORIAL_NAME_MAX_LENGTH = 120;
export const EPITAPH_MAX_LENGTH = 160;
export const MAX_DRAFTS = 2;

const collapse = (value: string) => value.normalize('NFC').replace(/\s+/gu, ' ').trim();

function tomorrowUtc(): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export const memorialInputSchema = z
  .strictObject({
    fullName: z
      .string()
      .transform(collapse)
      .pipe(z.string().min(1, 'name_required').max(MEMORIAL_NAME_MAX_LENGTH, 'name_too_long')),
    born: memorialDateSchema.nullable(),
    died: memorialDateSchema,
    epitaph: z
      .string()
      .transform(collapse)
      .pipe(z.string().max(EPITAPH_MAX_LENGTH, 'epitaph_too_long'))
      .transform((value) => (value === '' ? null : value))
      .nullable(),
  })
  .refine(({ died }) => died.date <= tomorrowUtc(), { message: 'died_in_future', path: ['died'] })
  .refine(({ born, died }) => !born || born.date <= died.date, {
    message: 'born_after_died',
    path: ['born'],
  });

export type MemorialInput = z.infer<typeof memorialInputSchema>;
