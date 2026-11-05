import { describe, expect, it } from 'vitest';
import { displayNameSchema, localeSchema, profileUpdateSchema } from './profile';

describe('displayNameSchema', () => {
  it('trims and accepts 1 to 40 characters', () => {
    expect(displayNameSchema.parse('  Alex C.  ')).toBe('Alex C.');
    expect(displayNameSchema.parse('J')).toBe('J');
    expect(displayNameSchema.parse('a'.repeat(40))).toHaveLength(40);
  });

  it('rejects empty and overlong names', () => {
    expect(displayNameSchema.safeParse('   ').success).toBe(false);
    expect(displayNameSchema.safeParse('a'.repeat(41)).success).toBe(false);
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
