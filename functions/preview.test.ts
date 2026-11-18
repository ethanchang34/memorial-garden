import { describe, expect, it, vi } from 'vitest';
import { findPublishedMemorial, isSlug, toPreviewMemorial } from './preview';

const env = {
  VITE_SUPABASE_URL: 'https://project.supabase.co',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
};

const row = {
  full_name: 'Rosa Martínez',
  born_date: '1932-03-04',
  born_precision: 'day',
  died_date: '2024-07-19',
  died_precision: 'day',
  epitaph: 'Always in our garden',
};

describe('isSlug', () => {
  it('accepts memorial addresses and nothing that could change the query', () => {
    expect(isSlug('rosa-martinez-2024')).toBe(true);
    expect(isSlug('rosa-martinez-2024-a1b2')).toBe(true);
    expect(isSlug('Rosa')).toBe(false);
    expect(isSlug('a&status=eq.draft')).toBe(false);
    expect(isSlug('a,b')).toBe(false);
    expect(isSlug('a'.repeat(81))).toBe(false);
    expect(isSlug(undefined)).toBe(false);
    expect(isSlug(['a'])).toBe(false);
  });
});

describe('findPublishedMemorial', () => {
  it('asks only for shared memorials with the public key', async () => {
    const fetcher = vi.fn(() => Promise.resolve(Response.json([row])));
    const memorial = await findPublishedMemorial(env, 'rosa-martinez-2024', fetcher);
    expect(memorial).toEqual({
      fullName: 'Rosa Martínez',
      born: { date: '1932-03-04', precision: 'day' },
      died: { date: '2024-07-19', precision: 'day' },
      epitaph: 'Always in our garden',
    });
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    const query = new URL(url).searchParams;
    expect(new URL(url).pathname).toBe('/rest/v1/memorials');
    expect(query.get('slug')).toBe('eq.rosa-martinez-2024');
    expect(query.get('status')).toBe('eq.published');
    expect(query.get('select')).not.toContain('owner_id');
    expect(init.headers).toMatchObject({ apikey: 'sb_publishable_test' });
  });

  it('falls back quietly when the lookup fails or finds nothing', async () => {
    expect(
      await findPublishedMemorial(env, 'x-2024', () => Promise.resolve(Response.json([]))),
    ).toBeNull();
    expect(
      await findPublishedMemorial(env, 'x-2024', () =>
        Promise.resolve(new Response('', { status: 500 })),
      ),
    ).toBeNull();
    expect(
      await findPublishedMemorial(env, 'x-2024', () => Promise.reject(new Error('down'))),
    ).toBeNull();
    expect(await findPublishedMemorial({}, 'x-2024', vi.fn())).toBeNull();
  });

  it('never looks up an address that is not a slug', async () => {
    const fetcher = vi.fn();
    expect(await findPublishedMemorial(env, 'x&status=eq.draft', fetcher)).toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
  });
});

describe('toPreviewMemorial', () => {
  it('rejects rows with missing or odd fields', () => {
    expect(toPreviewMemorial({ ...row, full_name: '' })).toBeNull();
    expect(toPreviewMemorial({ ...row, died_precision: 'week' })).toBeNull();
    expect(toPreviewMemorial({ ...row, born_date: null, epitaph: null })).toMatchObject({
      born: null,
      epitaph: null,
    });
  });
});
