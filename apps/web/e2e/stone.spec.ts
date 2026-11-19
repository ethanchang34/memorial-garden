import { expectResponsiveLayout } from './responsive';
import { expect, memorialRow, TEST_USER_ID, test } from './fixtures';
import { TEST_VIEWPORTS } from './viewports';

const SLUG = 'rosa-martinez-2024';
const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

test.describe('cleaning the stone', () => {
  test.beforeEach(({ supabase }) => {
    supabase.memorials.push(
      memorialRow({ slug: SLUG, full_name: 'Rosa Martínez', died_date: '2024-07-19' }),
    );
  });

  test('moss grows with time since the last cleaning', async ({ page, supabase }, testInfo) => {
    supabase.stone = { dirtySince: daysAgo(45), cleanedToday: false };
    await page.goto(`/m/${SLUG}`);
    const moss = page.locator('[data-moss]');
    await expect(moss).toHaveAttribute('data-grime', '0.79');
    expect(await moss.locator('g[opacity]').count()).toBeGreaterThan(20);
    await expect(page.getByText('Clean the stone')).toBeVisible();
    if (process.env['GARDEN_SHOTS']) {
      await page.screenshot({ path: testInfo.outputPath('stone-mossy.png') });
    }
  });

  test('a visitor cleans the stone without an account', async ({ page, supabase }, testInfo) => {
    supabase.stone = { dirtySince: daysAgo(20), cleanedToday: false };
    await page.goto(`/m/${SLUG}`);
    const stoneButton = page.getByRole('button', { name: 'Clean the stone' });
    await stoneButton.click();
    const dialog = page.getByRole('dialog', { name: 'Clean the stone?' });
    await expect(dialog).toContainText('Rosa Martínez’s name stays clear');
    await dialog.getByRole('button', { name: 'Clean the stone' }).click();

    await expect(page.getByText('The stone is clean.')).toBeVisible();
    await expect(page.locator('[data-moss]')).toHaveAttribute('data-grime', '0.00');
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
    const paths = supabase.calls.map((call) => `${call.method} ${call.path}`);
    expect(paths.indexOf('POST /auth/v1/signup')).toBeGreaterThanOrEqual(0);
    expect(paths.indexOf('POST /auth/v1/signup')).toBeLessThan(
      paths.indexOf('POST /rest/v1/rpc/clean_stone'),
    );
    await expect(stoneButton).toHaveAttribute('aria-disabled', 'true');
    await stoneButton.click({ force: true });
    await expect(page.getByRole('dialog')).toHaveCount(0);
    if (process.env['GARDEN_SHOTS']) {
      await page.screenshot({ path: testInfo.outputPath('stone-clean.png') });
    }
  });

  test('“Not now” leaves the stone as it is', async ({ page, supabase }) => {
    supabase.stone = { dirtySince: daysAgo(20), cleanedToday: false };
    await page.goto(`/m/${SLUG}`);
    const stoneButton = page.getByRole('button', { name: 'Clean the stone' });
    await stoneButton.focus();
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Not now' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(stoneButton).toBeFocused();
    expect(supabase.calls.some((call) => call.path === '/rest/v1/rpc/clean_stone')).toBe(false);
  });

  test('the stone hint waits for hover or focus, even when mossy', async ({ page, supabase }) => {
    supabase.stone = { dirtySince: daysAgo(30), cleanedToday: false };
    await page.goto(`/m/${SLUG}`);
    const hint = page.locator('[data-overlay="stone"] [data-garden-hint]');
    await expect(hint).toHaveCSS('opacity', '0');
    await page.getByRole('button', { name: 'Clean the stone' }).focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(hint).toHaveCSS('opacity', '1');
  });

  test('the daily limit from the server is explained', async ({ page, supabase }) => {
    supabase.stone = { dirtySince: daysAgo(20), cleanedToday: false, failNext: 'daily_limit' };
    await page.goto(`/m/${SLUG}`);
    await page.getByRole('button', { name: 'Clean the stone' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Clean the stone' }).click();
    await expect(page.locator('[data-overlay="stone"] [data-garden-hint]')).toHaveText(
      'You’ve already cleaned this stone today. Come back tomorrow.',
    );
    await expect(page.locator('[data-moss]')).not.toHaveAttribute('data-grime', '0.00');
  });

  test('the stone control fits every screen', async ({ page, supabase }) => {
    test.slow();
    supabase.stone = { dirtySince: daysAgo(30), cleanedToday: false };
    for (const viewport of TEST_VIEWPORTS) {
      await page.setViewportSize(viewport);
      await page.goto(`/m/${SLUG}`);
      const button = page.getByRole('button', { name: 'Clean the stone' });
      const box = (await button.boundingBox())!;
      expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
      await button.focus();
      const hintLocator = page.locator('[data-overlay="stone"] [data-garden-hint]');
      await expect(hintLocator).toHaveCSS('opacity', '1');
      const hint = (await hintLocator.boundingBox())!;
      expect(hint.x).toBeGreaterThanOrEqual(0);
      expect(hint.x + hint.width).toBeLessThanOrEqual(viewport.width);
      await expectResponsiveLayout(page);
    }
  });
});

test('owners previewing a draft see moss but cannot clean yet', async ({ page, supabase }) => {
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
  await expect(page.locator('[data-moss]')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Clean the stone' })).toHaveCount(0);
});
