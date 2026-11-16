import { z } from 'zod';

export const NOTE_MAX_LENGTH = 2000;

export function normalizeNoteBody(value: string): string {
  return value
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(/\t/g, '  ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export type NoteBodyProblem = 'empty' | 'too_long' | 'characters';

export function noteBodyProblem(value: string): NoteBodyProblem | null {
  const body = normalizeNoteBody(value);
  if (body.length === 0) return 'empty';
  if ([...body].length > NOTE_MAX_LENGTH) return 'too_long';
  // eslint-disable-next-line no-control-regex
  if (/[\u0001-\u0009\u000B-\u001F\u007F]/.test(body)) return 'characters';
  return null;
}

export const noteBodySchema = z
  .string()
  .transform(normalizeNoteBody)
  .superRefine((body, context) => {
    const problem = noteBodyProblem(body);
    if (problem) context.addIssue({ code: 'custom', message: problem });
  });
