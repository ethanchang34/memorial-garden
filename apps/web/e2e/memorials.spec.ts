import { expect, memorialRow, TEST_USER_ID, test } from './fixtures';
import { expectResponsiveLayout } from './responsive';
import { TEST_VIEWPORTS } from './viewports';

test.describe('signed out', () => {
  test('home links to creating a memorial, which states the price and asks to sign in', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Create a memorial' }).click();
    await expect(page).toHaveURL('/memorials/new');
    await expect(
      page.getByText('Building a garden is free. Sharing it is a one-time $20'),
    ).toBeVisible();
    await expect(page.getByText('Sign in to start a garden')).toBeVisible();
  });

  test('visitors see a shared memorial without owner controls', async ({ page, supabase }) => {
    supabase.memorials.push(
      memorialRow({
        slug: 'rosa-martinez-2024',
        full_name: 'Rosa Martínez',
        died_date: '2024-07-19',
        epitaph: 'Always in our garden',
      }),
    );
    await page.goto('/m/rosa-martinez-2024');
    await expect(page.getByRole('heading', { level: 1, name: 'Rosa Martínez' })).toBeVisible();
    await expect(page.getByText('Always in our garden')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Share this garden' })).toHaveCount(0);
  });

  test('unknown memorials show the not-found page', async ({ page }) => {
    await page.goto('/m/nobody-1900');
    await expect(
      page.getByRole('heading', { level: 1, name: 'This path leads nowhere' }),
    ).toBeVisible();
  });
});

test.describe('signed in', () => {
  test.beforeEach(async ({ supabase }) => {
    await supabase.signIn();
  });

  test('creates a draft memorial and lands on its page', async ({ page, supabase }, testInfo) => {
    await page.goto('/memorials/new');
    await page.getByLabel('Their full name').fill('  Rosa   Martínez ');

    const born = page.getByRole('group', { name: 'Born' });
    await born.getByText('Year', { exact: true }).click();
    await born.getByRole('spinbutton').fill('1932');

    const died = page.getByRole('group', { name: 'Passed away' });
    await died.locator('input[type="date"]').fill('2024-07-19');
    await page.getByLabel('A short epitaph (optional)').fill('Always in our garden');
    await page.screenshot({ path: testInfo.outputPath('create-form.png'), fullPage: true });
    await page.getByRole('button', { name: 'Save draft' }).click();

    await expect(page).toHaveURL('/m/rosa-martinez-2024');
    await expect(page.getByText('Draft saved')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Rosa Martínez' })).toBeVisible();
    await expect(
      page.getByRole('banner').or(page.locator('main header')).getByText('1932 – 2024'),
    ).toBeVisible();
    await expect(page.getByText('This is a draft. Only you can see it.')).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('memorial-page.png'), fullPage: true });

    const insert = supabase.calls.find(
      (call) => call.method === 'POST' && call.path === '/rest/v1/memorials',
    );
    expect(insert?.body).toEqual({
      owner_id: TEST_USER_ID,
      full_name: 'Rosa Martínez',
      born_date: '1932-01-01',
      born_precision: 'year',
      died_date: '2024-07-19',
      died_precision: 'day',
      epitaph: 'Always in our garden',
    });
  });

  test('explains what is missing', async ({ page, supabase }) => {
    await page.goto('/memorials/new');
    await page.getByRole('button', { name: 'Save draft' }).click();
    await expect(page.getByText('Enter a complete date.')).toBeVisible();

    await page
      .getByRole('group', { name: 'Passed away' })
      .locator('input[type="date"]')
      .fill('2024-07-19');
    await page.getByRole('button', { name: 'Save draft' }).click();
    await expect(page.getByText('Enter their name.')).toBeVisible();
    await expect(page.getByLabel('Their full name')).toHaveAttribute('aria-invalid', 'true');
    expect(
      supabase.calls.some((call) => call.method === 'POST' && call.path === '/rest/v1/memorials'),
    ).toBe(false);
  });

  test('stops at two drafts', async ({ page, supabase }) => {
    supabase.memorials.push(
      memorialRow({
        owner_id: TEST_USER_ID,
        status: 'draft',
        full_name: 'One',
        died_date: '2020-01-01',
      }),
      memorialRow({
        owner_id: TEST_USER_ID,
        status: 'draft',
        full_name: 'Two',
        died_date: '2021-01-01',
      }),
    );
    await page.goto('/memorials/new');
    await page.getByLabel('Their full name').fill('Three');
    await page
      .getByRole('group', { name: 'Passed away' })
      .locator('input[type="date"]')
      .fill('2022-05-05');
    await page.getByRole('button', { name: 'Save draft' }).click();
    await expect(page.getByText('You already have 2 drafts.')).toBeVisible();
    await expect(page).toHaveURL('/memorials/new');
  });

  test('sharing waits for checkout, except for the admin test group', async ({
    page,
    supabase,
  }) => {
    supabase.memorials.push(
      memorialRow({
        slug: 'rosa-2024',
        owner_id: TEST_USER_ID,
        status: 'draft',
        full_name: 'Rosa',
        died_date: '2024-01-01',
      }),
    );
    await page.goto('/m/rosa-2024');
    await page.getByRole('button', { name: 'Share this garden' }).click();
    await expect(page.getByText('Sharing opens soon. Your draft is saved.')).toBeVisible();

    supabase.isAdmin = true;
    await page.getByRole('button', { name: 'Share this garden' }).click();
    await expect(page.getByText('Your garden is shared')).toBeVisible();
    await expect(page.getByText('This is a draft. Only you can see it.')).toHaveCount(0);
  });

  test('your gardens lists your memorials and is in the account menu', async ({
    page,
    supabase,
  }) => {
    supabase.memorials.push(
      memorialRow({
        slug: 'grandpa-joe-2019',
        owner_id: TEST_USER_ID,
        status: 'draft',
        full_name: 'Grandpa Joe',
        died_date: '2019-06-01',
        died_precision: 'month',
      }),
    );
    await page.goto('/');
    await page.getByRole('button', { name: 'Alex C.' }).click();
    await page.getByRole('menuitem', { name: 'Your gardens' }).click();
    await expect(page).toHaveURL('/memorials');
    await page.getByRole('link', { name: /Grandpa Joe/ }).click();
    await expect(page).toHaveURL('/m/grandpa-joe-2019');
  });
});

test.describe('memorial layouts', () => {
  test.skip(({ isMobile }) => isMobile, 'viewports are set explicitly, so run once');

  for (const viewport of TEST_VIEWPORTS) {
    test(`${viewport.name} ${viewport.width}x${viewport.height}`, async ({ page, supabase }) => {
      await supabase.signIn();
      supabase.memorials.push(
        memorialRow({
          slug: 'long-2024',
          owner_id: TEST_USER_ID,
          status: 'draft',
          full_name: 'Bartholomew Montgomery-Fitzwilliam the Third of Somewhere',
          died_date: '2024-01-01',
        }),
      );
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/memorials/new');
      await expect(page.getByLabel('Their full name')).toBeVisible();
      await expectResponsiveLayout(page);
      await page.goto('/m/long-2024');
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expectResponsiveLayout(page);
    });
  }
});

test.describe('garden scene', () => {
  test.beforeEach(({ supabase }) => {
    supabase.memorials.push(
      memorialRow({
        slug: 'rosa-martinez-2024',
        full_name: 'Rosa Martínez',
        born_date: '1932-01-01',
        born_precision: 'year',
        died_date: '2024-07-19',
      }),
    );
  });

  for (const [time, phase, fireflies] of [
    ['08:00', 'morning', [0, 0]],
    ['14:00', 'day', [0, 0]],
    ['18:30', 'golden', [0, 0]],
    ['21:00', 'evening', [5, 8]],
    ['02:00', 'night', [12, 16]],
  ] as const) {
    test(`follows the visitor's local time: ${phase}`, async ({ page }, testInfo) => {
      await page.clock.setFixedTime(new Date(`2026-11-10T${time}:00`));
      await page.goto('/m/rosa-martinez-2024');
      const scene = page.getByRole('img', { name: /The garden for Rosa Martínez/ });
      await expect(scene).toHaveAttribute('data-phase', phase);
      await expect(scene.getByText('Rosa Martínez')).toBeAttached();
      await expect(scene.getByText('1932 – 2024')).toBeAttached();
      const count = await scene.locator('[data-firefly]').count();
      expect(count).toBeGreaterThanOrEqual(fireflies[0]);
      expect(count).toBeLessThanOrEqual(fireflies[1]);
      if (process.env['GARDEN_SHOTS']) {
        await page.screenshot({ path: testInfo.outputPath(`garden-${phase}.png`) });
      }
    });
  }

  test('fills the width and most of the screen height', async ({ page }) => {
    await page.goto('/m/rosa-martinez-2024');
    await expect(page.getByRole('heading', { level: 1, name: 'Rosa Martínez' })).toBeVisible();
    for (const viewport of TEST_VIEWPORTS) {
      await page.setViewportSize(viewport);
      const box = await page.locator('[data-garden]').boundingBox();
      expect(box, viewport.name).not.toBeNull();
      expect(box!.x, viewport.name).toBe(0);
      expect(box!.width, viewport.name).toBe(viewport.width);
      expect(box!.height, viewport.name).toBeGreaterThanOrEqual(
        Math.max(288, viewport.height * 0.8) - 1,
      );
      await expectResponsiveLayout(page);
    }
  });

  test('fireflies hold still with a dim glow for reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.clock.setFixedTime(new Date('2026-11-10T02:00:00'));
    await page.goto('/m/rosa-martinez-2024');
    const firefly = page.locator('.garden-firefly').first();
    await expect(firefly).toBeAttached();
    await expect(firefly).toHaveCSS('animation-name', 'none');
    await expect(firefly).toHaveCSS('opacity', '0.45');
    await expect(page.locator('.garden-leaf-fall').first()).toHaveCSS('display', 'none');
  });

  test('a few leaves fall from the canopy', async ({ page }) => {
    await page.goto('/m/rosa-martinez-2024');
    const leaves = page.locator('[data-falling-leaf]');
    await expect(leaves.first()).toBeAttached();
    expect(await leaves.count()).toBeGreaterThanOrEqual(3);
    await expect(page.locator('.garden-leaf-fall').first()).toHaveCSS(
      'animation-name',
      'garden-leaf-fall',
    );
  });
});
