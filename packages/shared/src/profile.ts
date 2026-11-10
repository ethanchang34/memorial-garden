import { z } from 'zod';

export const DISPLAY_NAME_MIN_LENGTH = 1;
export const DISPLAY_NAME_MAX_LENGTH = 40;

export type DisplayNameProblem =
  'empty' | 'too_long' | 'characters' | 'no_letter' | 'reserved' | 'link';

const DENIED_CHARACTERS =
  // eslint-disable-next-line no-control-regex, no-misleading-character-class
  /[\u0001-\u001F\u007F-\u009F!"#$%&()*+/:;<=>?@[\\\]^_`{|}~\u00A0-\u00BF\u00D7\u00F7\u061C\u180E\u2000-\u2018\u201A-\u2BFF\u3000-\u303F\uE000-\uF8FF\uFE00-\uFE0F\uFE30-\uFE4F\uFEFF\uFFF0-\uFFFF\u{1F000}-\u{1FAFF}\u{E0000}-\u{E007F}]/u;
const HAS_LETTER = /[^0-9 .,'’-]/u;
const RESERVED =
  /\b(admin|administrator|moderator|mod|staff|support|official)\b|memorial\s*garden/i;
const LINK = /(^|[ .])www\.|\.(com|net|org|info|io|co|app|xyz|biz|me|ru)( |$)/i;

export function normalizeDisplayName(value: string): string {
  return value.normalize('NFC').replace(/\s+/gu, ' ').trim();
}

export function displayNameProblem(value: string): DisplayNameProblem | null {
  const name = normalizeDisplayName(value);
  if (name.length < DISPLAY_NAME_MIN_LENGTH) return 'empty';
  if (name.length > DISPLAY_NAME_MAX_LENGTH) return 'too_long';
  if (DENIED_CHARACTERS.test(name)) return 'characters';
  if (!HAS_LETTER.test(name)) return 'no_letter';
  if (RESERVED.test(name)) return 'reserved';
  if (LINK.test(name)) return 'link';
  return null;
}

export const displayNameSchema = z
  .string()
  .transform(normalizeDisplayName)
  .superRefine((name, context) => {
    const problem = displayNameProblem(name);
    if (problem) context.addIssue({ code: 'custom', message: problem });
  });

export const localeSchema = z.string().regex(/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/);

export const timeZoneSchema = z.string().trim().min(1).max(64);

export const profileUpdateSchema = z.strictObject({
  displayName: displayNameSchema,
  locale: localeSchema,
});

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
