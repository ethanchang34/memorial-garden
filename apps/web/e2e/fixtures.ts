import { expect, test as base, type Page, type Request, type Route } from '@playwright/test';

export const SUPABASE_URL = 'https://test-project.supabase.co';
const STORAGE_KEY = 'sb-test-project-auth-token';
export const TEST_USER_ID = '00000000-0000-4000-8000-000000000001';

type ProfileRow = { id: string; display_name: string; time_zone: string; locale: string };

export type MemorialRow = {
  id: string;
  slug: string;
  owner_id: string | null;
  full_name: string;
  born_date: string | null;
  born_precision: string | null;
  died_date: string;
  died_precision: string;
  epitaph: string | null;
  status: 'draft' | 'published' | 'hidden' | 'removed';
};

let memorialCounter = 0;
export function memorialRow(
  overrides: Partial<MemorialRow> & Pick<MemorialRow, 'full_name' | 'died_date'>,
): MemorialRow {
  memorialCounter += 1;
  return {
    id: `00000000-0000-4000-9000-${String(memorialCounter).padStart(12, '0')}`,
    slug: `memorial-${memorialCounter}`,
    owner_id: null,
    born_date: null,
    born_precision: null,
    died_precision: 'day',
    epitaph: null,
    status: 'published',
    ...overrides,
  };
}

function slugFor(name: string, died: string, taken: MemorialRow[]): string {
  const base =
    name
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'memorial';
  const slug = `${base}-${died.slice(0, 4)}`;
  return taken.some((row) => row.slug === slug) ? `${slug}-${taken.length}` : slug;
}

export type SupabaseMock = {
  signIn(profile?: Partial<Omit<ProfileRow, 'id'>>): Promise<void>;
  profile: ProfileRow;
  memorials: MemorialRow[];
  isAdmin: boolean;
  signedIn: boolean;
  calls: { method: string; path: string; body: unknown }[];
  unexpected: string[];
};

function base64Url(value: object | string): string {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return Buffer.from(text).toString('base64url');
}

function fakeSession() {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + 3600;
  const accessToken = [
    base64Url({ alg: 'HS256', typ: 'JWT' }),
    base64Url({
      sub: TEST_USER_ID,
      aud: 'authenticated',
      role: 'authenticated',
      exp: expiresAt,
      iat: now,
    }),
    base64Url('signature'),
  ].join('.');

  return {
    access_token: accessToken,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: expiresAt,
    refresh_token: 'test-refresh-token',
    user: {
      id: TEST_USER_ID,
      aud: 'authenticated',
      role: 'authenticated',
      app_metadata: { provider: 'google', providers: ['google'] },
      user_metadata: {},
      created_at: new Date(now * 1000).toISOString(),
    },
  };
}

function corsHeaders(request: Request): Record<string, string> {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'access-control-allow-headers': request.headers()['access-control-request-headers'] ?? '*',
    'access-control-expose-headers': 'content-range',
  };
}

async function installSupabaseMock(page: Page): Promise<SupabaseMock> {
  const mock: SupabaseMock = {
    profile: { id: TEST_USER_ID, display_name: 'Alex C.', time_zone: 'UTC', locale: 'en' },
    memorials: [],
    isAdmin: false,
    calls: [],
    unexpected: [],
    signedIn: false,
    async signIn(profile = {}) {
      mock.signedIn = true;
      Object.assign(mock.profile, profile);
      const session = fakeSession();
      await page.addInitScript(([key, value]) => window.localStorage.setItem(key, value), [
        STORAGE_KEY,
        JSON.stringify(session),
      ] as const);
    },
  };

  await page.route(`${SUPABASE_URL}/**`, async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const headers = corsHeaders(request);

    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers });

    const body = request.postData() ? (request.postDataJSON() as unknown) : undefined;
    mock.calls.push({ method, path: url.pathname, body });
    const json = (data: unknown, status = 200) =>
      route.fulfill({
        status,
        headers: { ...headers, 'content-type': 'application/json' },
        body: JSON.stringify(data),
      });

    if (url.pathname === '/rest/v1/profiles' && method === 'GET') return json(mock.profile);
    if (url.pathname === '/rest/v1/profiles' && method === 'PATCH') {
      Object.assign(mock.profile, body as Partial<ProfileRow>);
      return json(mock.profile);
    }
    if (url.pathname === '/rest/v1/rpc/set_time_zone' && method === 'POST') {
      mock.profile.time_zone = (body as { requested_time_zone: string }).requested_time_zone;
      return json(mock.profile.time_zone);
    }
    if (url.pathname === '/rest/v1/memorials' && method === 'GET') {
      const filters = [...url.searchParams.entries()].filter(
        ([key]) => key === 'slug' || key === 'owner_id',
      );
      const signedIn = mock.signedIn;
      const rows = mock.memorials.filter(
        (row) =>
          filters.every(
            ([key, value]) =>
              String(row[key as 'slug' | 'owner_id']) === value.replace(/^eq\./, ''),
          ) &&
          (row.status === 'published' || (signedIn && row.owner_id === TEST_USER_ID)),
      );
      return json(rows);
    }
    if (url.pathname === '/rest/v1/memorials' && method === 'POST') {
      const input = body as Omit<MemorialRow, 'id' | 'slug' | 'status'>;
      const drafts = mock.memorials.filter(
        (row) => row.owner_id === input.owner_id && row.status === 'draft',
      );
      if (drafts.length >= 2) {
        return json(
          { code: 'P0001', message: 'Draft limit reached', hint: 'draft_limit', details: null },
          400,
        );
      }
      const row = memorialRow({
        ...input,
        status: 'draft',
        slug: slugFor(input.full_name, input.died_date, mock.memorials),
      });
      mock.memorials.push(row);
      return json(row, 201);
    }
    if (url.pathname === '/rest/v1/rpc/publish_memorial' && method === 'POST') {
      if (!mock.isAdmin) {
        return json(
          {
            code: '42501',
            message: 'Sharing is not open yet',
            hint: 'sharing_closed',
            details: null,
          },
          403,
        );
      }
      const row = mock.memorials.find(
        (item) => item.id === (body as { memorial_id: string }).memorial_id,
      );
      if (!row)
        return json(
          { code: 'P0002', message: 'Memorial not found', hint: null, details: null },
          404,
        );
      row.status = 'published';
      return json(row.slug);
    }
    if (url.pathname === '/auth/v1/logout' && method === 'POST') {
      return route.fulfill({ status: 204, headers });
    }
    if (url.pathname === '/auth/v1/authorize' && method === 'GET') {
      return route.fulfill({
        status: 200,
        headers: { 'content-type': 'text/html' },
        body: '<!doctype html><title>Google sign-in</title><h1>Google sign-in</h1>',
      });
    }

    mock.unexpected.push(`${method} ${url.pathname}${url.search}`);
    return json({ message: 'Unexpected request in test' }, 500);
  });

  return mock;
}

export const test = base.extend<{ supabase: SupabaseMock }>({
  supabase: [
    async ({ page }, use) => {
      const mock = await installSupabaseMock(page);
      await use(mock);
      expect(mock.unexpected, 'requests to Supabase that no test expected').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
