import { expect, test as base, type Page, type Request, type Route } from '@playwright/test';

export const SUPABASE_URL = 'https://test-project.supabase.co';
const STORAGE_KEY = 'sb-test-project-auth-token';
export const TEST_USER_ID = '00000000-0000-4000-8000-000000000001';
export const TEST_VISITOR_ID = '00000000-0000-4000-8000-000000000002';

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

export type NoteRow = {
  id: string;
  memorial_id: string;
  author_id: string;
  body: string;
  status: 'visible' | 'hidden_by_owner' | 'removed';
  created_at: string;
  edited_at: string | null;
};

let noteCounter = 0;
export function noteRow(
  overrides: Partial<NoteRow> & Pick<NoteRow, 'memorial_id' | 'author_id' | 'body'>,
): NoteRow {
  noteCounter += 1;
  return {
    id: `00000000-0000-4000-a000-${String(noteCounter).padStart(12, '0')}`,
    status: 'visible',
    created_at: new Date(Date.UTC(2026, 10, 1, 12) + noteCounter * 60_000).toISOString(),
    edited_at: null,
    ...overrides,
  };
}

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
  visitor: boolean;
  candles: { lit: number; litToday: boolean; failNext?: 'daily_limit' };
  flowers: { types: string[]; placedToday: boolean; failNext?: 'daily_limit' };
  stone: { dirtySince: string | null; cleanedToday: boolean; failNext?: 'daily_limit' };
  notes: NoteRow[];
  noteFailNext?: 'note_rate_limit' | 'note_new_account_limit';
  displayNames: Record<string, string>;
  calls: { method: string; path: string; body: unknown }[];
  unexpected: string[];
};

function base64Url(value: object | string): string {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return Buffer.from(text).toString('base64url');
}

function fakeSession(anonymous = false) {
  const userId = anonymous ? TEST_VISITOR_ID : TEST_USER_ID;
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + 3600;
  const accessToken = [
    base64Url({ alg: 'HS256', typ: 'JWT' }),
    base64Url({
      sub: userId,
      aud: 'authenticated',
      role: 'authenticated',
      is_anonymous: anonymous,
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
      id: userId,
      aud: 'authenticated',
      role: 'authenticated',
      is_anonymous: anonymous,
      app_metadata: anonymous ? {} : { provider: 'google', providers: ['google'] },
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
    visitor: false,
    candles: { lit: 0, litToday: false },
    flowers: { types: [], placedToday: false },
    stone: { dirtySince: null, cleanedToday: false },
    notes: [],
    displayNames: {},
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
    const viewerId = mock.signedIn ? TEST_USER_ID : mock.visitor ? TEST_VISITOR_ID : null;
    const eqParam = (key: string) => url.searchParams.get(key)?.replace(/^eq\./, '');
    if (url.pathname === '/rest/v1/notes' && method === 'GET') {
      const memorialId = eqParam('memorial_id');
      const rows = mock.notes
        .filter((note) => note.memorial_id === memorialId && note.status !== 'removed')
        .filter((note) => {
          const memorial = mock.memorials.find((row) => row.id === note.memorial_id);
          const owner = Boolean(viewerId && memorial?.owner_id === viewerId);
          return (
            owner ||
            note.author_id === viewerId ||
            (note.status === 'visible' && memorial?.status === 'published')
          );
        })
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
      return json(rows);
    }
    if (url.pathname === '/rest/v1/notes' && method === 'POST') {
      if (!mock.signedIn) {
        return json({ code: '42501', message: 'Not allowed', hint: null, details: null }, 403);
      }
      if (mock.noteFailNext) {
        const hint = mock.noteFailNext;
        delete mock.noteFailNext;
        return json({ code: 'P0001', message: 'Limit', hint, details: null }, 400);
      }
      const input = body as Pick<NoteRow, 'memorial_id' | 'author_id' | 'body'>;
      const row = noteRow({ ...input, created_at: new Date().toISOString() });
      mock.notes.push(row);
      return json(row, 201);
    }
    if (url.pathname === '/rest/v1/notes' && (method === 'PATCH' || method === 'DELETE')) {
      const note = mock.notes.find((row) => row.id === eqParam('id'));
      if (!note || note.author_id !== viewerId || !mock.signedIn) {
        return json({ code: 'PGRST116', message: 'No rows', hint: null, details: null }, 406);
      }
      if (method === 'DELETE') {
        mock.notes = mock.notes.filter((row) => row !== note);
        return route.fulfill({ status: 204, headers });
      }
      note.body = (body as { body: string }).body;
      note.edited_at = new Date().toISOString();
      return json(note);
    }
    if (url.pathname === '/rest/v1/rpc/set_note_hidden' && method === 'POST') {
      const input = body as { note_id: string; hidden: boolean };
      const note = mock.notes.find((row) => row.id === input.note_id);
      const memorial = mock.memorials.find((row) => row.id === note?.memorial_id);
      if (!note || !mock.signedIn || memorial?.owner_id !== TEST_USER_ID) {
        return json({ code: 'P0002', message: 'Note not found', hint: null, details: null }, 404);
      }
      note.status = input.hidden ? 'hidden_by_owner' : 'visible';
      return json(note.status);
    }
    if (url.pathname === '/rest/v1/rpc/public_display_names' && method === 'POST') {
      const ids = (body as { user_ids: string[] }).user_ids;
      const names: Record<string, string> = {
        ...mock.displayNames,
        [TEST_USER_ID]: mock.profile.display_name,
      };
      return json(ids.filter((id) => names[id]).map((id) => ({ id, display_name: names[id] })));
    }
    const stoneRows = () => [
      { dirty_since: mock.stone.dirtySince, cleaned_today: mock.stone.cleanedToday },
    ];
    if (url.pathname === '/rest/v1/rpc/stone_state' && method === 'POST') return json(stoneRows());
    if (url.pathname === '/rest/v1/rpc/clean_stone' && method === 'POST') {
      if (!mock.signedIn && !mock.visitor) {
        return json({ code: '42501', message: 'Not signed in', hint: null, details: null }, 401);
      }
      if (mock.stone.cleanedToday || mock.stone.failNext === 'daily_limit') {
        delete mock.stone.failNext;
        return json(
          {
            code: 'P0001',
            message: 'Already cleaned this stone today',
            hint: 'stone_daily_limit',
            details: null,
          },
          400,
        );
      }
      mock.stone = { dirtySince: new Date().toISOString(), cleanedToday: true };
      return json(stoneRows());
    }
    const flowerRows = () => [
      {
        flower_types: mock.flowers.types,
        bloom_until:
          mock.flowers.types.length > 0
            ? new Date(Date.now() + 14 * 86_400_000).toISOString()
            : null,
        placed_today: mock.flowers.placedToday,
      },
    ];
    if (url.pathname === '/rest/v1/rpc/flower_state' && method === 'POST')
      return json(flowerRows());
    if (url.pathname === '/rest/v1/rpc/place_flower' && method === 'POST') {
      if (!mock.signedIn && !mock.visitor) {
        return json({ code: '42501', message: 'Not signed in', hint: null, details: null }, 401);
      }
      if (mock.flowers.placedToday || mock.flowers.failNext === 'daily_limit') {
        delete mock.flowers.failNext;
        return json(
          {
            code: 'P0001',
            message: 'Already placed a flower here today',
            hint: 'flower_daily_limit',
            details: null,
          },
          400,
        );
      }
      const chosen = String((request.postDataJSON() as { chosen_type?: string }).chosen_type);
      if (mock.flowers.types.length < 15) mock.flowers.types = [...mock.flowers.types, chosen];
      mock.flowers.placedToday = true;
      return json(flowerRows());
    }
    const candleRows = () => [
      {
        lit_count: mock.candles.lit,
        lit_until:
          mock.candles.lit > 0 ? new Date(Date.now() + 3 * 86_400_000).toISOString() : null,
        lit_today: mock.candles.litToday,
      },
    ];
    if (url.pathname === '/rest/v1/rpc/candle_state' && method === 'POST')
      return json(candleRows());
    if (url.pathname === '/rest/v1/rpc/light_candle' && method === 'POST') {
      if (!mock.signedIn && !mock.visitor) {
        return json({ code: '42501', message: 'Not signed in', hint: null, details: null }, 401);
      }
      if (mock.candles.litToday || mock.candles.failNext === 'daily_limit') {
        delete mock.candles.failNext;
        return json(
          {
            code: 'P0001',
            message: 'Already lit a candle here today',
            hint: 'candle_daily_limit',
            details: null,
          },
          400,
        );
      }
      mock.candles.lit = Math.min(15, mock.candles.lit + 1);
      mock.candles.litToday = true;
      return json(candleRows());
    }
    if (url.pathname === '/auth/v1/signup' && method === 'POST' && !mock.signedIn) {
      mock.visitor = true;
      return json(fakeSession(true));
    }
    if (url.pathname === '/auth/v1/logout' && method === 'POST') {
      return route.fulfill({ status: 204, headers });
    }
    if (url.pathname === '/auth/v1/user/identities/authorize' && method === 'GET') {
      const authorize = new URL(`${SUPABASE_URL}/auth/v1/authorize`);
      authorize.searchParams.set('provider', url.searchParams.get('provider') ?? '');
      authorize.searchParams.set('redirect_to', url.searchParams.get('redirect_to') ?? '');
      authorize.searchParams.set('link', '1');
      return json({ url: authorize.toString() });
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
