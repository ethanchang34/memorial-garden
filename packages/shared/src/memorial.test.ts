import { describe, expect, it } from 'vitest';
import { memorialInputSchema } from './memorial';

const valid = {
  fullName: '  Rosa   Martínez ',
  born: { date: '1932-03-04', precision: 'day' as const },
  died: { date: '2024-07-19', precision: 'day' as const },
  epitaph: ' Always in our garden ',
};

function issues(input: unknown) {
  const result = memorialInputSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('memorialInputSchema', () => {
  it('normalizes a valid memorial', () => {
    expect(memorialInputSchema.parse(valid)).toEqual({
      ...valid,
      fullName: 'Rosa Martínez',
      epitaph: 'Always in our garden',
    });
  });

  it('allows an unknown birth date and an empty epitaph', () => {
    expect(memorialInputSchema.parse({ ...valid, born: null, epitaph: '  ' })).toMatchObject({
      born: null,
      epitaph: null,
    });
  });

  it('rejects missing or long names and long epitaphs', () => {
    expect(issues({ ...valid, fullName: '   ' })).toContain('name_required');
    expect(issues({ ...valid, fullName: 'a'.repeat(121) })).toContain('name_too_long');
    expect(issues({ ...valid, epitaph: 'a'.repeat(161) })).toContain('epitaph_too_long');
  });

  it('rejects impossible dates', () => {
    expect(issues({ ...valid, born: { date: '2030-01-01', precision: 'year' } })).toContain(
      'born_after_died',
    );
    expect(
      issues({ ...valid, died: { date: '2999-01-01', precision: 'year' }, born: null }),
    ).toContain('died_in_future');
    expect(
      issues({ ...valid, died: { date: '2024-07-19', precision: 'month' } }).length,
    ).toBeGreaterThan(0);
  });
});
