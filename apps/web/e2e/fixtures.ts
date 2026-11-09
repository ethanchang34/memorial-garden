import { expect, test as base, type Page, type Request, type Route } from '@playwright/test';

export const SUPABASE_URL = 'https://test-project.supabase.co';
const STORAGE_KEY = 'sb-test-project-auth-token';
export const TEST_USER_ID = '00000000-0000-4000-8000-000000000001';

type ProfileRow = { id: string; display_name: string; time_zone: string; locale: string };

export type SupabaseMock = {
  signIn(profile?: Partial<Omit<ProfileRow, 'id'>>): Promise<void>;
  profile: ProfileRow;
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
    calls: [],
    unexpected: [],
    async signIn(profile = {}) {
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
