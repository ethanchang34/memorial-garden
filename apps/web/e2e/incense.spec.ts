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

type Box = { x: number; y: number; width: number; height: number };
const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

test.describe('lighting incense', () => {
  test.beforeEach(({ supabase }) => {
    supabase.memorials.push(
      memorialRow({ slug: SLUG, full_name: 'Rosa Martínez', died_date: '2024-07-19' }),
    );
  });

  test('a visitor holds to light a stick without an account', async ({ page, supabase }) => {
    await page.goto(`/m/${SLUG}`);
    const burner = page.locator('[data-slot="incense"]');
    await expect(burner).toHaveAttribute('data-incense', '0');
    await expect(page.getByText('Hold to light incense')).toBeAttached();

    await hold(page, page.getByRole('button', { name: 'Light incense' }), 300);
    await page.waitForTimeout(800);
    expect(supabase.calls.some((call) => call.path === '/rest/v1/rpc/light_incense')).toBe(false);

    await hold(page, page.getByRole('button', { name: 'Light incense' }), 1500);
    await expect(burner).toHaveAttribute('data-incense', '1');
    await expect(page.locator('[data-stick]')).toHaveCount(1);
    await expect(page.getByText('Your incense is lit')).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: 'incense' })).toHaveText(
      '1 stick of incense is burning for Rosa Martínez.',
    );
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
    const calls = supabase.calls.map((call) => `${call.method} ${call.path}`);
    expect(calls.indexOf('POST /auth/v1/signup')).toBeLessThan(
      calls.indexOf('POST /rest/v1/rpc/light_incense'),
    );

    await hold(page, page.getByRole('button', { name: 'Light incense' }), 1500);
    expect(
      supabase.calls.filter((call) => call.path === '/rest/v1/rpc/light_incense'),
    ).toHaveLength(1);
  });

  test('the burner holds at most three sticks', async ({ page, supabase }) => {
    supabase.incense = { lit: 3, litToday: false };
    await page.goto(`/m/${SLUG}`);
    await expect(page.locator('[data-stick]')).toHaveCount(3);
    await hold(page, page.getByRole('button', { name: 'Light incense' }), 1500);
    await expect(page.getByText('Your incense is lit')).toBeVisible();
    await expect(page.locator('[data-stick]')).toHaveCount(3);
  });

  test('the daily limit from the server is explained and the stick goes out', async ({
    page,
    supabase,
  }) => {
    supabase.incense = { lit: 1, litToday: false, failNext: 'daily_limit' };
    await page.goto(`/m/${SLUG}`);
    await hold(page, page.getByRole('button', { name: 'Light incense' }), 1500);
    await expect(page.locator('[data-overlay="incense"] [data-garden-hint]')).toHaveText(
      'You’ve already lit incense here today. Come back tomorrow.',
    );
    await expect(page.locator('[data-stick]')).toHaveCount(1);
  });

  test('pointing anywhere on the bowl or sticks lifts the incense', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'hover needs a mouse');
    await page.goto(`/m/${SLUG}`);
    const slot = page.locator('[data-slot="incense"]');
    const bowl = (await slot.locator('path').first().boundingBox())!;
    await page.mouse.move(bowl.x + bowl.width / 2, bowl.y + bowl.height - 1);
    await expect(slot).not.toHaveCSS('transform', 'none');
    await expect(page.locator('[data-overlay="incense"] [data-garden-hint]')).toHaveCSS(
      'opacity',
      '1',
    );
  });

  test('the bowl sits beside the path, not on it', async ({ page }) => {
    await page.goto(`/m/${SLUG}`);
    const bowl = (await page.locator('[data-slot="incense"] path').first().boundingBox())!;
    const stone = (await page.locator('[data-slot="stone"] > path').first().boundingBox())!;
    expect(bowl.x).toBeGreaterThan(stone.x + stone.width / 2 + 8);
  });

  test('smoke drifts up and holds still with reduced motion', async ({ page, supabase }) => {
    supabase.incense = { lit: 2, litToday: false };
    await page.goto(`/m/${SLUG}`);
    const smoke = page.locator('.garden-smoke').first();
    await expect(smoke).toHaveCSS('animation-name', 'garden-smoke');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(smoke).toHaveCSS('animation-name', 'none');
  });

  test('every garden hint fits on screen without overlapping another', async ({
    page,
    supabase,
  }, testInfo) => {
    test.slow();
    supabase.incense = { lit: 2, litToday: false };
    supabase.flowers = { types: ['rose', 'daisy', 'tulip'], placedToday: false };
    supabase.candles = { lit: 4, litToday: false };
    for (const viewport of TEST_VIEWPORTS) {
      await page.setViewportSize(viewport);
      await page.goto(`/m/${SLUG}`);
      const button = (await page.getByRole('button', { name: 'Light incense' }).boundingBox())!;
      expect(Math.min(button.width, button.height)).toBeGreaterThanOrEqual(44);
      const hints: Box[] = [];
      for (const text of ['Hold to light incense', 'Place a flower', 'Hold to light a candle']) {
        const hint = page.getByText(text, { exact: true });
        if (!(await hint.isVisible())) continue;
        if ((await hint.evaluate((el) => getComputedStyle(el).opacity)) === '0') continue;
        const box = (await hint.boundingBox())!;
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
        for (const other of hints)
          expect(
            overlaps(box, other),
            `${text} overlaps at ${viewport.width}x${viewport.height}: ${JSON.stringify([box, other])}`,
          ).toBe(false);
        hints.push(box);
      }
      const toolbar = page.locator('nav:has([data-toolbar])');
      if (await toolbar.isVisible()) {
        const bar = (await toolbar.boundingBox())!;
        for (const hint of hints) expect(hint.y + hint.height).toBeLessThanOrEqual(bar.y);
      }
      await expectResponsiveLayout(page);
    }
    if (process.env['GARDEN_SHOTS']) {
      await page.setViewportSize(testInfo.project.use.viewport!);
      await page.goto(`/m/${SLUG}`);
      await page.waitForTimeout(1500);
      await page.screenshot({ path: testInfo.outputPath('incense.png') });
    }
  });
});

test('owners previewing a draft see the burner but cannot light it yet', async ({
  page,
  supabase,
}) => {
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
  await expect(page.locator('[data-slot="incense"]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Light incense' })).toHaveCount(0);
});

test('the incense label waits for focus', async ({ page, supabase }) => {
  supabase.memorials.push(
    memorialRow({ slug: SLUG, full_name: 'Rosa Martínez', died_date: '2024-07-19' }),
  );
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto(`/m/${SLUG}`);
  const hint = page.locator('[data-overlay="incense"] [data-garden-hint]');
  await expect(hint).toHaveCSS('opacity', '0');
  await page.getByRole('button', { name: 'Light incense' }).focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(hint).toHaveCSS('opacity', '1');
});
