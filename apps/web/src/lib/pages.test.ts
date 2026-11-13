import { describe, expect, it } from 'vitest';
import { pageOf } from './pages';

describe('pageOf', () => {
  const items = [1, 2, 3, 4, 5, 6, 7];

  it('slices one page at a time', () => {
    expect(pageOf(items, 3, 0)).toEqual({ items: [1, 2, 3], page: 0, pageCount: 3 });
    expect(pageOf(items, 3, 2)).toEqual({ items: [7], page: 2, pageCount: 3 });
  });

  it('clamps out-of-range pages', () => {
    expect(pageOf(items, 3, 9).page).toBe(2);
    expect(pageOf(items, 3, -1).page).toBe(0);
  });

  it('always has at least one page', () => {
    expect(pageOf([], 4, 0)).toEqual({ items: [], page: 0, pageCount: 1 });
  });
});
