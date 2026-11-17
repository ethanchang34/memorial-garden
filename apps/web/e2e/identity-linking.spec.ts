import type { Locator, Page } from '@playwright/test';
import { expect, memorialRow, SUPABASE_URL, test } from './fixtures';

const SLUG = 'rosa-martinez-2024';

async function hold(page: Page, target: Locator, ms: number) {
  const box = (await target.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(ms);
  await page.mouse.up();
}

test.beforeEach(({ supabase }) => {
  supabase.memorials.push(
    memorialRow({ slug: SLUG, full_name: 'Rosa Martínez', died_date: '2024-07-19' }),
  );
});

test('a visitor who lit a candle links Google to the same account', async ({ page }) => {
  await page.goto(`/m/${SLUG}`);
  await hold(page, page.getByRole('button', { name: 'Light a candle' }), 1500);
  await expect(page.getByText('Your candle is lit')).toBeVisible();

  const link = page.waitForRequest((request) =>
    request.url().startsWith(`${SUPABASE_URL}/auth/v1/user/identities/authorize`),
  );
  const authorize = page.waitForRequest((request) =>
    request.url().startsWith(`${SUPABASE_URL}/auth/v1/authorize`),
  );
  await page.getByRole('banner').getByRole('button', { name: 'Sign in' }).click();

  const linkUrl = new URL((await link).url());
  expect(linkUrl.searchParams.get('provider')).toBe('google');
  expect(linkUrl.searchParams.get('redirect_to')).toMatch(/\/m\/rosa-martinez-2024$/);
  expect(new URL((await authorize).url()).searchParams.get('link')).toBe('1');
});

test('signing in from a fresh window does not try to link', async ({ page, supabase }) => {
  await page.goto(`/m/${SLUG}`);
  const authorize = page.waitForRequest((request) =>
    request.url().startsWith(`${SUPABASE_URL}/auth/v1/authorize`),
  );
  await page.getByRole('banner').getByRole('button', { name: 'Sign in' }).click();
  expect(new URL((await authorize).url()).searchParams.get('link')).toBeNull();
  expect(supabase.calls.some((call) => call.path === '/auth/v1/user/identities/authorize')).toBe(
    false,
  );
});

test('when that Google account already exists, it signs in to it instead', async ({ page }) => {
  const authorize = page.waitForRequest((request) =>
    request.url().startsWith(`${SUPABASE_URL}/auth/v1/authorize`),
  );
  await page.goto(
    `/m/${SLUG}?error=server_error&error_code=identity_already_exists&error_description=Identity+is+already+linked+to+another+user`,
  );
  const url = new URL((await authorize).url());
  expect(url.searchParams.get('provider')).toBe('google');
  expect(url.searchParams.get('link')).toBeNull();
  expect(url.searchParams.get('redirect_to')).toMatch(
    /^http:\/\/localhost:\d+\/m\/rosa-martinez-2024$/,
  );
});
