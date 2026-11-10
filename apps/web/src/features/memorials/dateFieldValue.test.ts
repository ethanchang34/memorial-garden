import { describe, expect, it } from 'vitest';
import { toMemorialDate } from './dateFieldValue';

describe('toMemorialDate', () => {
  it('maps each precision to the first day of its range', () => {
    expect(toMemorialDate({ precision: 'day', value: '1932-03-04' })).toEqual({
      date: '1932-03-04',
      precision: 'day',
    });
    expect(toMemorialDate({ precision: 'month', value: '1932-03' })).toEqual({
      date: '1932-03-01',
      precision: 'month',
    });
    expect(toMemorialDate({ precision: 'year', value: '1932' })).toEqual({
      date: '1932-01-01',
      precision: 'year',
    });
    expect(toMemorialDate({ precision: 'circa', value: '1890' })).toEqual({
      date: '1890-01-01',
      precision: 'circa',
    });
  });

  it('returns null for unknown and undefined for incomplete input', () => {
    expect(toMemorialDate({ precision: 'unknown', value: '' })).toBeNull();
    expect(toMemorialDate({ precision: 'day', value: '' })).toBeUndefined();
    expect(toMemorialDate({ precision: 'year', value: '19' })).toBeUndefined();
  });
});
