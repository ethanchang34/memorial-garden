import { describe, expect, it, vi } from 'vitest';
import { formatLifespan, formatMemorialDate, formatTimestamp, memorialDateSchema } from './dates';

describe('formatMemorialDate', () => {
  it('formats each precision', () => {
    expect(formatMemorialDate({ date: '1932-03-04', precision: 'day' }, 'en')).toBe(
      'March 4, 1932',
    );
    expect(formatMemorialDate({ date: '1932-03-01', precision: 'month' }, 'en')).toBe('March 1932');
    expect(formatMemorialDate({ date: '1932-01-01', precision: 'year' }, 'en')).toBe('1932');
    expect(formatMemorialDate({ date: '1890-01-01', precision: 'circa' }, 'en')).toBe('c. 1890');
  });

  it('follows the locale', () => {
    expect(formatMemorialDate({ date: '1932-03-04', precision: 'day' }, 'de')).toBe('4. März 1932');
    expect(formatMemorialDate({ date: '1932-03-01', precision: 'month' }, 'es')).toBe(
      'marzo de 1932',
    );
  });

  it('uses translated labels for circa', () => {
    const labels = { circa: (year: string) => `ca. ${year}` };
    expect(formatMemorialDate({ date: '1890-01-01', precision: 'circa' }, 'de', labels)).toBe(
      'ca. 1890',
    );
  });

  it('never shifts to the previous day, whatever the runtime time zone', () => {
    vi.stubEnv('TZ', 'America/Los_Angeles');
    try {
      expect(formatMemorialDate({ date: '1932-01-01', precision: 'day' }, 'en')).toBe(
        'January 1, 1932',
      );
      expect(formatMemorialDate({ date: '1932-01-01', precision: 'year' }, 'en')).toBe('1932');
    } finally {
      vi.unstubAllEnvs();
    }
  });
});

describe('formatLifespan', () => {
  it('shows years, keeping circa', () => {
    expect(
      formatLifespan(
        { date: '1932-03-04', precision: 'day' },
        { date: '2024-07-19', precision: 'day' },
        'en',
      ),
    ).toBe('1932 – 2024');
    expect(
      formatLifespan(
        { date: '1890-01-01', precision: 'circa' },
        { date: '1952-01-01', precision: 'year' },
        'en',
      ),
    ).toBe('c. 1890 – 1952');
  });

  it('shows only the death year when the birth date is unknown', () => {
    expect(formatLifespan(null, { date: '2024-01-01', precision: 'year' }, 'en')).toBe('2024');
  });
});

describe('formatTimestamp', () => {
  it('formats in the viewer time zone', () => {
    const lateEvening = '2026-11-04T05:30:00Z';
    expect(formatTimestamp(lateEvening, 'en', 'America/Chicago')).toBe('Nov 3, 2026');
    expect(formatTimestamp(lateEvening, 'en', 'UTC')).toBe('Nov 4, 2026');
  });
});

describe('memorialDateSchema', () => {
  it('accepts dates stored as the first day of their range', () => {
    expect(memorialDateSchema.safeParse({ date: '1932-03-04', precision: 'day' }).success).toBe(
      true,
    );
    expect(memorialDateSchema.safeParse({ date: '1932-03-01', precision: 'month' }).success).toBe(
      true,
    );
    expect(memorialDateSchema.safeParse({ date: '1890-01-01', precision: 'circa' }).success).toBe(
      true,
    );
  });

  it('rejects dates not at the start of their range', () => {
    expect(memorialDateSchema.safeParse({ date: '1932-03-04', precision: 'month' }).success).toBe(
      false,
    );
    expect(memorialDateSchema.safeParse({ date: '1932-03-01', precision: 'year' }).success).toBe(
      false,
    );
  });

  it('rejects invalid dates and precisions', () => {
    expect(memorialDateSchema.safeParse({ date: '1932-02-30', precision: 'day' }).success).toBe(
      false,
    );
    expect(memorialDateSchema.safeParse({ date: '1932-01-01', precision: 'decade' }).success).toBe(
      false,
    );
  });
});
