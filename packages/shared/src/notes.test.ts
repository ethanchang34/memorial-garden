import { describe, expect, it } from 'vitest';
import { NOTE_MAX_LENGTH, noteBodyProblem, noteBodySchema, normalizeNoteBody } from './notes';

describe('note bodies', () => {
  it('trims, unifies line breaks and collapses long gaps', () => {
    expect(normalizeNoteBody('  Hi\r\n\r\n\r\n\r\nthere\t!  ')).toBe('Hi\n\nthere  !');
  });

  it('rejects empty and overlong notes', () => {
    expect(noteBodyProblem('   \n ')).toBe('empty');
    expect(noteBodyProblem('a'.repeat(NOTE_MAX_LENGTH))).toBeNull();
    expect(noteBodyProblem('a'.repeat(NOTE_MAX_LENGTH + 1))).toBe('too_long');
  });

  it('rejects control characters', () => {
    expect(noteBodyProblem('bell\u0007')).toBe('characters');
  });

  it('parses to the normalized text', () => {
    expect(noteBodySchema.parse(' We miss you. ')).toBe('We miss you.');
    expect(noteBodySchema.safeParse('').success).toBe(false);
  });
});
