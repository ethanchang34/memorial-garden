import type { Locator, Page } from '@playwright/test';
import { expect, memorialRow, TEST_USER_ID, test } from './fixtures';
import { expectResponsiveLayout } from './responsive';
import { TEST_VIEWPORTS } from './viewports';

const SLUG = 'rosa-martinez-2024';
const MIXED = [
  'rose',
  'tulip',
  'daisy',
  'poppy',
  'rose',
  'daisy',
  'poppy',
  'tulip',
  'rose',
  'daisy',
  'tulip',
  'poppy',
];

function overlaps(a: { x: number; y: number; width: number; height: number }, b: typeof a) {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

async function box(locator: Locator) {
  return (await locator.boundingBox())!;
}

test.describe('placing flowers', () => {
  test.beforeEach(({ supabase }) => {
    supabase.memorials.push(
      memorialRow({ slug: SLUG, full_name: 'Rosa Martínez', died_date: '2024-07-19' }),
    );
  });

  test('a visitor chooses a flower and places it without an account', async ({
    page,
    supabase,
  }, testInfo) => {
    await page.goto(`/m/${SLUG}`);
    const vases = page.locator('[data-slot="vase"]');
    await expect(vases).toHaveAttribute('data-flowers', '0');
    await expect(page.getByText('Place a flower', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Place a flower' }).click();
    const sheet = page.getByRole('dialog', { name: 'Place a flower' });
    await expect(sheet).toContainText('Flowers stay in bloom for 14 days');
    await expect(sheet.getByRole('radio')).toHaveCount(4);
    await expect(sheet.getByRole('radio', { name: 'Rose' })).toBeChecked();
    await sheet.getByText('Tulip').click();
    await expect(sheet.getByRole('radio', { name: 'Tulip' })).toBeChecked();
    if (process.env['GARDEN_SHOTS']) {
      await page.waitForTimeout(500);
      await page.screenshot({ path: testInfo.outputPath('flower-sheet.png') });
    }
    await sheet.getByRole('button', { name: 'Place flower' }).click();

    await expect(page.getByText('Your flower is in the vase.')).toBeVisible();
    await expect(vases).toHaveAttribute('data-flowers', '1');
    await expect(page.locator('[data-flower="tulip"]')).toHaveCount(1);
    await expect(page.getByRole('status').filter({ hasText: 'in bloom' })).toHaveText(
      '1 flower is in bloom for Rosa Martínez.',
    );
    await expect(page.getByRole('button', { name: 'Place a flower' })).toHaveCount(0);
    await expect(page.getByRole('banner').getByRole('button', { name: 'Sign in' })).toBeVisible();

    const calls = supabase.calls.map((call) => `${call.method} ${call.path}`);
    expect(calls.indexOf('POST /auth/v1/signup')).toBeGreaterThanOrEqual(0);
    expect(calls.indexOf('POST /auth/v1/signup')).toBeLessThan(
      calls.indexOf('POST /rest/v1/rpc/place_flower'),
    );
    expect(
      supabase.calls.find((call) => call.path === '/rest/v1/rpc/place_flower')?.body,
    ).toMatchObject({ chosen_type: 'tulip' });

    await page.getByRole('button', { name: 'See the flowers' }).click();
    const today = page.getByRole('dialog', { name: 'Flowers' });
    await expect(today).toContainText('You placed a flower today.');
    await expect(today.getByRole('button', { name: 'Place flower' })).toHaveCount(0);
    await expect(today.locator('[data-credit="tulip"]')).toContainText('Tulip from you');
  });

  test('the flower appears as soon as it is placed, before the server answers', async ({
    page,
  }) => {
    let answer: () => void = () => undefined;
    const answered = new Promise<void>((resolve) => {
      answer = resolve;
    });
    await page.route('**/rest/v1/rpc/place_flower', async (route) => {
      await answered;
      await route.fallback();
    });
    await page.goto(`/m/${SLUG}`);
    await page.getByRole('button', { name: 'Place a flower' }).click();
    await page
      .getByRole('dialog', { name: 'Place a flower' })
      .getByRole('button', { name: 'Place flower' })
      .click();
    await expect(page.locator('[data-flower="rose"]')).toHaveCount(1);
    answer();
    await expect(page.getByText('Your flower is in the vase.')).toBeVisible();
    await expect(page.locator('[data-flower="rose"]')).toHaveCount(1);
  });

  test('the next vase appears once the one before it is full', async ({ page, supabase }) => {
    supabase.flowers = { types: ['rose', 'tulip', 'daisy', 'poppy'], placedToday: false };
    await page.goto(`/m/${SLUG}`);
    await expect(page.locator('[data-vase]')).toHaveCount(1);
    await page.getByRole('button', { name: 'Place a flower' }).click();
    await page
      .getByRole('dialog', { name: 'Place a flower' })
      .getByRole('button', { name: 'Place flower' })
      .click();
    await expect(page.locator('[data-vase="0"]')).toHaveAttribute('data-stems', '5');
    await expect(page.locator('[data-vase]')).toHaveCount(2);
    await expect(page.locator('[data-vase="1"]')).toHaveAttribute('data-stems', '0');

    const button = await box(page.locator('[data-overlay="flower"]'));
    const second = await box(page.locator('[data-vase="1"] path').first());
    expect(overlaps(button, second)).toBe(true);
  });

  test('a full set of vases only refreshes the bloom', async ({ page, supabase }) => {
    supabase.flowers = { types: Array.from({ length: 15 }, () => 'daisy'), placedToday: false };
    await page.goto(`/m/${SLUG}`);
    await expect(page.locator('[data-vase]')).toHaveCount(3);
    await expect(page.locator('[data-flower]')).toHaveCount(15);
    await page.getByRole('button', { name: 'Place a flower' }).click();
    await expect(page.getByRole('dialog', { name: 'Place a flower' })).toContainText(
      'The vases are full.',
    );
  });

  test('the daily limit from the server is explained and the flower comes back out', async ({
    page,
    supabase,
  }) => {
    supabase.flowers = { types: ['rose'], placedToday: false, failNext: 'daily_limit' };
    await page.goto(`/m/${SLUG}`);
    await page.getByRole('button', { name: 'Place a flower' }).click();
    await page
      .getByRole('dialog', { name: 'Place a flower' })
      .getByRole('button', { name: 'Place flower' })
      .click();
    await expect(
      page.getByText('You’ve already placed a flower here today. Come back tomorrow.'),
    ).toBeVisible();
    await expect(page.locator('[data-slot="vase"]')).toHaveAttribute('data-flowers', '1');
  });

  test('flowers sway gently and hold still with reduced motion', async ({ page, supabase }) => {
    supabase.flowers = { types: ['rose'], placedToday: false };
    await page.goto(`/m/${SLUG}`);
    const sway = page.locator('.garden-flower-sway').first();
    await expect(sway).toHaveCSS('animation-name', 'garden-flower-sway');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(sway).toHaveCSS('animation-name', 'none');
  });

  test('the flower control fits every screen beside the candle', async ({
    page,
    supabase,
  }, testInfo) => {
    test.slow();
    supabase.flowers = { types: MIXED, placedToday: false };
    for (const viewport of TEST_VIEWPORTS) {
      await page.setViewportSize(viewport);
      await page.goto(`/m/${SLUG}`);
      const button = await box(page.getByRole('button', { name: 'Place a flower' }));
      expect(Math.min(button.width, button.height)).toBeGreaterThanOrEqual(44);
      const hint = await box(page.getByText('Place a flower', { exact: true }));
      expect(hint.x).toBeGreaterThanOrEqual(0);
      expect(hint.x + hint.width).toBeLessThanOrEqual(viewport.width);
      const candleHint = page.getByText('Hold to light a candle');
      if (await candleHint.isVisible()) expect(overlaps(hint, await box(candleHint))).toBe(false);
      const toolbar = page.locator('nav:has([data-toolbar])');
      if (await toolbar.isVisible()) {
        const bar = await box(toolbar);
        expect(hint.y + hint.height).toBeLessThanOrEqual(bar.y);
      }
      await expectResponsiveLayout(page);
    }
    if (process.env['GARDEN_SHOTS']) {
      await page.setViewportSize(testInfo.project.use.viewport!);
      await page.goto(`/m/${SLUG}`);
      await page.waitForTimeout(800);
      await page.screenshot({ path: testInfo.outputPath('flowers-mixed.png') });
    }
  });
});

test('owners previewing a draft see the vase but cannot place flowers yet', async ({
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
  await expect(page.locator('[data-vase="0"]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Place a flower' })).toHaveCount(0);
});

test.describe('flower extras', () => {
  test.beforeEach(({ supabase }) => {
    supabase.memorials.push(
      memorialRow({
        slug: SLUG,
        full_name: 'Rosa Martínez',
        died_date: '2024-07-19',
        owner_id: '00000000-0000-4000-8000-0000000000aa',
      }),
    );
  });

  async function placeOne(page: Page) {
    await page.getByRole('button', { name: 'Place a flower' }).click();
    const sheet = page.getByRole('dialog', { name: 'Place a flower' });
    await sheet.getByRole('button', { name: 'Place flower' }).click();
  }

  test('Undo takes the flower back and lets you choose again', async ({ page, supabase }) => {
    await page.goto(`/m/${SLUG}`);
    await placeOne(page);
    await expect(page.locator('[data-slot="vase"]')).toHaveAttribute('data-flowers', '1');
    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(page.getByText('Your flower was taken back.')).toBeVisible();
    await expect(page.locator('[data-slot="vase"]')).toHaveAttribute('data-flowers', '0');
    await expect(page.getByRole('button', { name: 'Place a flower' })).toBeVisible();
    expect(supabase.calls.filter((call) => call.path === '/rest/v1/rpc/undo_flower')).toHaveLength(
      1,
    );
  });

  test('visitors without an account are invited to sign in for a message', async ({ page }) => {
    await page.goto(`/m/${SLUG}`);
    await page.getByRole('button', { name: 'Place a flower' }).click();
    const sheet = page.getByRole('dialog', { name: 'Place a flower' });
    await expect(sheet.getByText('Sign in to leave a message with your flower.')).toBeVisible();
    await expect(sheet.getByLabel('Add a message (optional)')).toHaveCount(0);
  });

  test('a member leaves a short message with their flower', async ({ page, supabase }) => {
    await supabase.signIn();
    await page.goto(`/m/${SLUG}`);
    await page.getByRole('button', { name: 'Place a flower' }).click();
    const sheet = page.getByRole('dialog', { name: 'Place a flower' });
    const field = sheet.getByLabel('Add a message (optional)');
    await field.fill('a'.repeat(141));
    await sheet.getByRole('button', { name: 'Place flower' }).click();
    await expect(sheet.getByText('Messages can be up to 140 characters.')).toBeVisible();
    expect(supabase.calls.some((call) => call.path === '/rest/v1/rpc/place_flower')).toBe(false);

    await field.fill('  Miss you,\n Rosa  ');
    await sheet.getByText('Daisy').click();
    await sheet.getByRole('button', { name: 'Place flower' }).click();
    await expect(page.getByText('Your flower is in the vase.')).toBeVisible();
    expect(
      supabase.calls.find((call) => call.path === '/rest/v1/rpc/place_flower')?.body,
    ).toMatchObject({ chosen_type: 'daisy', note: 'Miss you, Rosa' });

    await page.getByRole('button', { name: 'See the flowers' }).click();
    const vases = page.getByRole('dialog', { name: 'Flowers' });
    await expect(vases.locator('[data-credit="daisy"]')).toContainText('Daisy from you');
    await expect(vases.locator('[data-credit="daisy"]')).toContainText('“Miss you, Rosa”');
  });

  test('the vases show who left flowers and when they fade', async ({
    page,
    supabase,
  }, testInfo) => {
    supabase.flowers = {
      types: ['rose', 'tulip', 'poppy', 'daisy'],
      placedToday: false,
      credits: (
        [
          ['rose', 'Sam R.', 'Thinking of you'],
          ['tulip', 'Jo P.', null],
          ['poppy', null, null],
          ['daisy', 'Lee K.', null],
        ] as const
      ).map(([type, giver, message], index) => ({
        stem: index + 1,
        flower_id: `flower-${index + 1}`,
        flower_type: type,
        giver_name: giver,
        placed_at: new Date(Date.UTC(2026, 10, 3 + index, 12)).toISOString(),
        message,
        message_hidden: false,
        mine: false,
      })),
    };
    await page.goto(`/m/${SLUG}`);
    const button = page.getByRole('button', { name: 'Place a flower' });
    await expect(button).toHaveAttribute(
      'aria-description',
      'Flowers from Sam R., Jo P. and 2 more',
    );
    if (testInfo.project.name === 'desktop') {
      await button.hover();
      await expect(page.locator('[data-flower-summary]')).toHaveCSS('opacity', '1');
    }
    await button.click();
    const sheet = page.getByRole('dialog', { name: 'Place a flower' });
    const credits = sheet.locator('[data-flower-credits]');
    await expect(credits).toContainText('In bloom for 14 more days');
    await expect(credits.locator('li')).toHaveCount(4);
    await expect(credits.locator('[data-credit="rose"]')).toContainText('Rose from Sam R.');
    await expect(credits.locator('[data-credit="rose"]')).toContainText('“Thinking of you”');
    await expect(credits.locator('[data-credit="poppy"]')).toContainText('Poppy from a visitor');
    await expect(sheet.getByRole('button', { name: 'Hide message' })).toHaveCount(0);
    if (process.env['GARDEN_SHOTS']) {
      await page.waitForTimeout(500);
      await page.screenshot({ path: testInfo.outputPath('flower-credits.png') });
    }
  });

  test('the owner hides and shows a message', async ({ page, supabase }) => {
    supabase.memorials[0]!.owner_id = TEST_USER_ID;
    supabase.flowers = {
      types: ['rose'],
      placedToday: false,
      credits: [
        {
          stem: 1,
          flower_id: 'flower-1',
          flower_type: 'rose',
          giver_name: 'Sam R.',
          placed_at: new Date(Date.UTC(2026, 10, 3, 12)).toISOString(),
          message: 'Something unkind',
          message_hidden: false,
          mine: false,
        },
      ],
    };
    await supabase.signIn();
    await page.goto(`/m/${SLUG}`);
    await page.getByRole('button', { name: 'Place a flower' }).click();
    const sheet = page.getByRole('dialog', { name: 'Place a flower' });
    await sheet.getByRole('button', { name: 'Hide message' }).click();
    await expect(page.getByText('Message hidden from visitors.')).toBeVisible();
    await expect(sheet.locator('[data-credit="rose"]')).toContainText('Hidden by the family');
    expect(
      supabase.calls.find((call) => call.path === '/rest/v1/rpc/set_flower_message_hidden')?.body,
    ).toEqual({ target_flower: 'flower-1', hidden: true });
    await sheet.getByRole('button', { name: 'Show message' }).click();
    await expect(sheet.locator('[data-credit="rose"]')).not.toContainText('Hidden by the family');
  });
});
