import type { Locator, Page } from '@playwright/test';
import { expect, memorialRow, TEST_USER_ID, test } from './fixtures';
import { expectResponsiveLayout } from './responsive';
import { TEST_VIEWPORTS } from './viewports';

const SLUG = 'rosa-martinez-2024';

async function hold(page: Page, target: Locator, ms: number) {
  const box = (await target.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(ms);
  await page.mouse.up();
}

test.describe('lighting a candle', () => {
  test.beforeEach(({ supabase }) => {
    supabase.memorials.push(
      memorialRow({ slug: SLUG, full_name: 'Rosa Martínez', died_date: '2024-07-19' }),
    );
  });

  test('the candle appears as soon as the hold finishes, before the server answers', async ({
    page,
  }) => {
    let answer: () => void = () => undefined;
    const answered = new Promise<void>((resolve) => {
      answer = resolve;
    });
    await page.route('**/rest/v1/rpc/light_candle', async (route) => {
      await answered;
      await route.fallback();
    });
    await page.goto(`/m/${SLUG}`);
    await hold(page, page.getByRole('button', { name: 'Light a candle' }), 1500);

    await expect(page.locator('[data-slot="candle"]')).toHaveAttribute('data-candles', '1');
    await expect(page.getByText('Your candle is lit')).toBeVisible();
    answer();
    await expect(page.locator('[data-slot="candle"]')).toHaveAttribute('data-candles', '1');
  });

  test('a visitor holds to light a candle without an account', async ({
    page,
    supabase,
  }, testInfo) => {
    await page.goto(`/m/${SLUG}`);
    const button = page.getByRole('button', { name: 'Light a candle' });
    await expect(page.getByText('Hold to light a candle')).toBeVisible();
    await expect(page.locator('[data-flame]')).toHaveCount(0);

    await hold(page, button, 1500);

    await expect(page.getByText('Your candle is lit')).toBeVisible();
    await expect(page.locator('[data-slot="candle"]')).toHaveAttribute('data-candles', '1');
    await expect(page.locator('[data-flame]')).toHaveCount(1);
    await expect(page.getByRole('status').filter({ hasText: 'burning' })).toHaveText(
      '1 candle is burning for Rosa Martínez.',
    );
    await expect(button).toHaveAttribute('aria-disabled', 'true');
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();

    const paths = supabase.calls.map((call) => `${call.method} ${call.path}`);
    expect(paths).toContain('POST /auth/v1/signup');
    expect(paths.filter((path) => path === 'POST /rest/v1/rpc/light_candle')).toHaveLength(1);
    expect(paths.indexOf('POST /auth/v1/signup')).toBeLessThan(
      paths.indexOf('POST /rest/v1/rpc/light_candle'),
    );

    await hold(page, button, 1500);
    expect(supabase.calls.filter((call) => call.path === '/rest/v1/rpc/light_candle')).toHaveLength(
      1,
    );

    if (process.env['GARDEN_SHOTS']) {
      await page.waitForTimeout(1800);
      await page.screenshot({ path: testInfo.outputPath('candle-lit.png') });
    }
  });

  test('a short tap does not light the candle', async ({ page, supabase }) => {
    await page.goto(`/m/${SLUG}`);
    const hint = page.locator('[data-overlay="candle"] [data-garden-hint]');
    await expect(hint).toHaveCSS('opacity', '0');
    await hold(page, page.getByRole('button', { name: 'Light a candle' }), 300);
    await expect(hint).toHaveCSS('opacity', '1');
    await expect(hint).toHaveText('Hold to light a candle');
    await page.waitForTimeout(1200);
    expect(supabase.calls.some((call) => call.path === '/rest/v1/rpc/light_candle')).toBe(false);
  });

  test('holding Space lights it from the keyboard', async ({ page, supabase }) => {
    supabase.candles = { lit: 4, litToday: false };
    await page.goto(`/m/${SLUG}`);
    await expect(page.locator('[data-flame]')).toHaveCount(4);
    await page.getByRole('button', { name: 'Light a candle' }).focus();
    await page.keyboard.down(' ');
    await page.waitForTimeout(1500);
    await page.keyboard.up(' ');
    await expect(page.locator('[data-flame]')).toHaveCount(5);
  });

  test('a busy garden shows its cluster and remembers today', async ({
    page,
    supabase,
  }, testInfo) => {
    supabase.candles = { lit: 15, litToday: true };
    await page.goto(`/m/${SLUG}`);
    await expect(page.locator('[data-flame]')).toHaveCount(15);
    await expect(page.getByText('Your candle is lit')).toBeVisible();
    if (process.env['GARDEN_SHOTS']) {
      await page.screenshot({ path: testInfo.outputPath('candle-cluster.png') });
    }
  });

  test('the daily limit from the server is explained', async ({ page, supabase }) => {
    supabase.candles = { lit: 2, litToday: false, failNext: 'daily_limit' };
    await page.goto(`/m/${SLUG}`);
    await hold(page, page.getByRole('button', { name: 'Light a candle' }), 1500);
    const hint = page.locator('[data-overlay="candle"] [data-garden-hint]');
    await expect(hint).toHaveText("You've already lit a candle here today. Come back tomorrow.");
    await expect(hint).toHaveCSS('opacity', '1');
    await expect(page.locator('[data-sonner-toast]')).toHaveCount(0);
  });

  test('after lighting today, a press gently says so and the hint hides again', async ({
    page,
    supabase,
  }) => {
    supabase.candles = { lit: 3, litToday: true };
    await page.goto(`/m/${SLUG}`);
    const hint = page.locator('[data-overlay="candle"] [data-garden-hint]');
    await expect(hint).toHaveCSS('opacity', '0');
    await hold(page, page.getByRole('button', { name: 'Light a candle' }), 200);
    await expect(hint).toHaveText("You've already lit a candle here today. Come back tomorrow.");
    await page.mouse.move(5, 5);
    await expect(hint).toHaveCSS('opacity', '0', { timeout: 5000 });
    expect(supabase.calls.some((call) => call.path === '/rest/v1/rpc/light_candle')).toBe(false);
  });

  test('pointing at the candle lifts it and shows the hint', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'hover needs a mouse');
    await page.goto(`/m/${SLUG}`);
    const slot = page.locator('[data-slot="candle"]');
    await expect(slot).toHaveCSS('transform', 'none');
    await page.getByRole('button', { name: 'Light a candle' }).hover();
    await expect(page.locator('[data-overlay="candle"] [data-garden-hint]')).toHaveCSS(
      'opacity',
      '1',
    );
    await expect(slot).not.toHaveCSS('transform', 'none');
  });

  test('the candle control fits every screen and clears the toolbar', async ({ page }) => {
    test.slow();
    for (const viewport of TEST_VIEWPORTS) {
      await page.setViewportSize(viewport);
      await page.goto(`/m/${SLUG}`);
      const button = page.getByRole('button', { name: 'Light a candle' });
      const box = (await button.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
      const hint = (await page.getByText('Hold to light a candle').boundingBox())!;
      expect(hint.x).toBeGreaterThanOrEqual(0);
      expect(hint.x + hint.width).toBeLessThanOrEqual(viewport.width);
      const toolbar = page.locator('nav:has([data-toolbar])');
      if (await toolbar.isVisible()) {
        const bar = (await toolbar.boundingBox())!;
        expect(box.y + box.height).toBeLessThanOrEqual(bar.y);
        expect(hint.y + hint.height).toBeLessThanOrEqual(bar.y);
      }
      await expectResponsiveLayout(page);
    }
  });
});

test('owners previewing a draft see no candle control', async ({ page, supabase }) => {
  supabase.memorials.push(
    memorialRow({
      slug: 'draft-2024',
      full_name: 'Draft Person',
      died_date: '2024-01-01',
      owner_id: TEST_USER_ID,
      status: 'draft',
    }),
  );
  await supabase.signIn();
  await page.goto('/m/draft-2024');
  await expect(page.getByText('Draft Person').first()).toBeVisible();
  await expect(page.locator('[data-slot="candle"]')).toHaveAttribute('data-candles', '0');
  await expect(page.getByRole('button', { name: 'Light a candle' })).toHaveCount(0);
});
