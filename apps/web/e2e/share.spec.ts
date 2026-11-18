import { expect, memorialRow, TEST_USER_ID, test } from './fixtures';
import { TEST_VIEWPORTS } from './viewports';
import { expectResponsiveLayout } from './responsive';

const SLUG = 'rosa-martinez-2024';

test.beforeEach(({ supabase }) => {
  supabase.memorials.push(
    memorialRow({ slug: SLUG, full_name: 'Rosa Martínez', died_date: '2024-07-19' }),
  );
});

test('without a share sheet, Share opens the link with a copy button', async ({
  page,
  context,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'clipboard permissions are Chromium-only');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
  });
  await page.goto(`/m/${SLUG}`);
  await page.getByRole('button', { name: 'Share', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Share this garden' });
  const link = dialog.getByLabel('Link to this garden');
  await expect(link).toHaveValue(/^http:\/\/localhost:\d+\/m\/rosa-martinez-2024$/);
  await expect(dialog.getByRole('button', { name: 'Share…' })).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Copy link' }).click();
  await expect(page.getByText('Link copied.')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Copied' })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(
    /\/m\/rosa-martinez-2024$/,
  );
});

test('with a share sheet, Share opens it straight away', async ({ page }) => {
  await page.addInitScript(() => {
    const shared: ShareData[] = [];
    Object.assign(window, { sharedData: shared });
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: (data: ShareData) => {
        shared.push(data);
        return Promise.resolve();
      },
    });
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
  });
  await page.goto(`/m/${SLUG}`);
  await page.getByRole('button', { name: 'Share', exact: true }).click();
  const shared = await page.evaluate(
    () => (window as unknown as { sharedData: ShareData[] }).sharedData,
  );
  expect(shared).toHaveLength(1);
  expect(shared[0]).toMatchObject({
    title: 'Rosa Martínez',
    text: 'A garden to remember Rosa Martínez.',
  });
  expect(shared[0]?.url).toMatch(/\/m\/rosa-martinez-2024$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('closing the share sheet without sharing does nothing else', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: () => Promise.reject(new DOMException('cancelled', 'AbortError')),
    });
  });
  await page.goto(`/m/${SLUG}`);
  await page.getByRole('button', { name: 'Share', exact: true }).click();
  await page.waitForTimeout(300);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('drafts have no Share button', async ({ page, supabase }) => {
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
  await expect(page.getByRole('heading', { level: 1, name: 'Draft Person' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Share', exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Edit memorial' })).toBeVisible();
});

test('the share dialog fits every screen', async ({ page }) => {
  test.slow();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
  });
  for (const viewport of TEST_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await page.goto(`/m/${SLUG}`);
    await page.getByRole('button', { name: 'Share', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Share this garden' });
    await expect(dialog).toBeVisible();
    const overflow = await dialog.evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await page.keyboard.press('Escape');
    await expectResponsiveLayout(page);
  }
});
