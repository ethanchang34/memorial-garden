import type { DatePrecision, PreviewMemorial } from '@memorial-garden/shared';

export type PreviewEnv = {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
};

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const PRECISIONS: readonly string[] = ['day', 'month', 'year', 'circa'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const LOOKUP_TIMEOUT_MS = 1500;
const CACHE_SECONDS = 300;

export function isSlug(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 80 && SLUG.test(value);
}

type Row = {
  full_name?: unknown;
  born_date?: unknown;
  born_precision?: unknown;
  died_date?: unknown;
  died_precision?: unknown;
  epitaph?: unknown;
};

function isPrecision(value: unknown): value is DatePrecision {
  return typeof value === 'string' && PRECISIONS.includes(value);
}

export function toPreviewMemorial(row: Row): PreviewMemorial | null {
  if (typeof row.full_name !== 'string' || row.full_name.length === 0) return null;
  if (typeof row.died_date !== 'string' || !DATE.test(row.died_date)) return null;
  if (!isPrecision(row.died_precision)) return null;
  const born =
    typeof row.born_date === 'string' && DATE.test(row.born_date) && isPrecision(row.born_precision)
      ? { date: row.born_date, precision: row.born_precision }
      : null;
  return {
    fullName: row.full_name,
    born,
    died: { date: row.died_date, precision: row.died_precision },
    epitaph: typeof row.epitaph === 'string' && row.epitaph.length > 0 ? row.epitaph : null,
  };
}

export async function findPublishedMemorial(
  env: PreviewEnv,
  slug: string,
  fetcher: typeof fetch = fetch,
): Promise<PreviewMemorial | null> {
  const base = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!base || !key || !isSlug(slug)) return null;
  const url = new URL('/rest/v1/memorials', base);
  url.searchParams.set(
    'select',
    'full_name,born_date,born_precision,died_date,died_precision,epitaph',
  );
  url.searchParams.set('slug', `eq.${slug}`);
  url.searchParams.set('status', 'eq.published');
  url.searchParams.set('limit', '1');
  try {
    const response = await fetcher(url.toString(), {
      headers: { apikey: key, accept: 'application/json' },
      signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
      cf: { cacheTtl: CACHE_SECONDS, cacheEverything: true },
    } as RequestInit);
    if (!response.ok) return null;
    const rows: unknown = await response.json();
    if (!Array.isArray(rows) || rows.length === 0) return null;
    return toPreviewMemorial(rows[0] as Row);
  } catch {
    return null;
  }
}
