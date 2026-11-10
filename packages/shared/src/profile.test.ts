import { describe, expect, it } from 'vitest';
import {
  displayNameProblem,
  displayNameSchema,
  localeSchema,
  normalizeDisplayName,
  profileUpdateSchema,
} from './profile';

describe('displayNameProblem', () => {
  it.each([
    'Alex C.',
    'Zoë S.',
    'Mary-Kate O’Brien',
    "Jean-Luc d'Arcy",
    '李明',
    'प्रिया श.',
    'محمد ع.',
    'J.R.R. T.',
    'Sam 2',
    'Admiral Ann',
    'J',
    'a'.repeat(40),
  ])('accepts %s', (name) => {
    expect(displayNameProblem(name)).toBeNull();
  });

  it.each([
    ['', 'empty'],
    ['   ', 'empty'],
    ['a'.repeat(41), 'too_long'],
    ['$$$', 'characters'],
    ['Alex?', 'characters'],
    ['a/b', 'characters'],
    ['me@example', 'characters'],
    ['<b>Alex</b>', 'characters'],
    ['Alex 🌸', 'characters'],
    ['Al\u200Bex', 'characters'],
    ['Alex\u202Egpj', 'characters'],
    ['Alex™', 'characters'],
    ['12345', 'no_letter'],
    ['...', 'no_letter'],
    ['Admin', 'reserved'],
    ['The Moderator', 'reserved'],
    ['Memorial Garden Help', 'reserved'],
    ['www.spam', 'link'],
    ['Buy cheap.com', 'link'],
  ])('rejects %j as %s', (name, problem) => {
    expect(displayNameProblem(name)).toBe(problem);
  });
});

describe('normalizeDisplayName', () => {
  it('trims, collapses spaces, and composes accents', () => {
    expect(normalizeDisplayName('  Alex \t  C.  ')).toBe('Alex C.');
    expect(normalizeDisplayName('E\u0300ve')).toBe('Ève');
    expect(normalizeDisplayName('Alex\u00A0C.')).toBe('Alex C.');
  });
});

describe('displayNameSchema', () => {
  it('returns the normalized name', () => {
    expect(displayNameSchema.parse('  Alex   C.  ')).toBe('Alex C.');
  });

  it('reports the problem as the issue message', () => {
    const result = displayNameSchema.safeParse('Free $$$');
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('characters');
  });
});

describe('localeSchema', () => {
  it('accepts language tags the database accepts', () => {
    expect(localeSchema.safeParse('en').success).toBe(true);
    expect(localeSchema.safeParse('en-US').success).toBe(true);
    expect(localeSchema.safeParse('zh-Hant-TW').success).toBe(true);
  });

  it('rejects malformed locales', () => {
    expect(localeSchema.safeParse('EN').success).toBe(false);
    expect(localeSchema.safeParse('en_US').success).toBe(false);
    expect(localeSchema.safeParse('').success).toBe(false);
  });
});

describe('profileUpdateSchema', () => {
  it('does not accept a time zone, which changes only through set_time_zone', () => {
    const result = profileUpdateSchema.safeParse({
      displayName: 'Alex C.',
      locale: 'en',
      timeZone: 'Asia/Tokyo',
    });

    expect(result.success).toBe(false);
  });
});
