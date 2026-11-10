import { expect, SUPABASE_URL, test } from './fixtures';
import { expectResponsiveLayout } from './responsive';
import { TEST_VIEWPORTS } from './viewports';

test.use({ timezoneId: 'America/Chicago' });

test.describe('signed out', () => {
  test('sign in sends you to Google and back to the same page', async ({ page }) => {
    await page.goto('/settings/profile');
    await expect(page.getByText('Sign in to choose the name others see')).toBeVisible();

    const authorize = page.waitForRequest((request) =>
      request.url().startsWith(`${SUPABASE_URL}/auth/v1/authorize`),
    );
    await page.getByRole('banner').getByRole('button', { name: 'Sign in' }).click();
    const url = new URL((await authorize).url());

    expect(url.searchParams.get('provider')).toBe('google');
    expect(url.searchParams.get('code_challenge')).toBeTruthy();
    expect(url.searchParams.get('redirect_to')).toMatch(
      /^http:\/\/localhost:\d+\/settings\/profile$/,
    );
  });

  test('the header has no account menu', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Alex C.' })).toHaveCount(0);
  });
});

test.describe('signed in', () => {
  test.beforeEach(async ({ supabase }) => {
    await supabase.signIn();
  });

  test('header shows the display name, never a photo', async ({ page }) => {
    await page.goto('/');
    const menuButton = page.getByRole('banner').getByRole('button', { name: 'Alex C.' });
    await expect(menuButton).toBeVisible();
    await expect(page.getByRole('banner').getByRole('img')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Sign in' })).toHaveCount(0);
  });

  test('sends the browser time zone once after sign-in', async ({ page, supabase }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Alex C.' })).toBeVisible();
    await expect
      .poll(() => supabase.calls.filter((call) => call.path === '/rest/v1/rpc/set_time_zone'))
      .toHaveLength(1);

    const call = supabase.calls.find((c) => c.path === '/rest/v1/rpc/set_time_zone');
    expect(call?.body).toEqual({ requested_time_zone: 'America/Chicago' });
  });

  test('account menu opens with the keyboard and links to settings', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard navigation is a desktop concern');
    await page.goto('/');
    const menuButton = page.getByRole('button', { name: 'Alex C.' });
    await menuButton.focus();
    await page.keyboard.press('Enter');

    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    await expect(menu.getByText('Signed in as Alex C.')).toBeVisible();
    await expect(menu.getByRole('menuitem', { name: 'Sign out' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(menuButton).toBeFocused();

    await menuButton.click();
    await page.getByRole('menuitem', { name: 'Profile settings' }).click();
    await expect(page).toHaveURL('/settings/profile');
    await expect(page.getByRole('heading', { level: 1, name: 'Your profile' })).toBeVisible();
  });

  test('sign out from any page returns to the home page', async ({ page, supabase }) => {
    await page.goto('/settings/profile');
    await expect(page.getByLabel('Display name')).toHaveValue('Alex C.');
    await page.evaluate(() => {
      const observer = new MutationObserver(() => {
        if (document.body.innerText.includes('Sign in to choose the name')) {
          (window as unknown as { sawSignInPrompt: boolean }).sawSignInPrompt = true;
        }
      });
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    });
    await page.getByRole('button', { name: 'Alex C.' }).click();
    await page.getByRole('menuitem', { name: 'Sign out' }).click();

    await expect(page).toHaveURL('/');
    await expect(
      page.getByRole('heading', { level: 1, name: /A garden for the people/ }),
    ).toBeVisible();
    await expect(page.getByText('You’re signed out')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
    expect(
      await page.evaluate(
        () => (window as unknown as { sawSignInPrompt?: boolean }).sawSignInPrompt,
      ),
      'the settings page must not flash its signed-out prompt',
    ).toBeUndefined();
    expect(supabase.calls.some((c) => c.method === 'POST' && c.path === '/auth/v1/logout')).toBe(
      true,
    );
    expect(
      await page.evaluate(() => localStorage.getItem('sb-test-project-auth-token')),
    ).toBeNull();
  });

  test('edits the display name', async ({ page, supabase }, testInfo) => {
    await page.goto('/settings/profile');
    const input = page.getByLabel('Display name');
    await expect(input).toHaveValue('Alex C.');

    await input.fill('   ');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('alert')).toHaveText('Enter a name between 1 and 40 characters.');

    for (const [name, message] of [
      [
        'Free $$$',
        "Use letters, numbers, spaces, and . , ' - only. Emoji and symbols aren’t allowed.",
      ],
      [
        'Alex 🌸',
        "Use letters, numbers, spaces, and . , ' - only. Emoji and symbols aren’t allowed.",
      ],
      ['12345', 'Include at least one letter.'],
      ['Admin', 'That name is reserved. Please choose another.'],
      ['www.example', 'Display names can’t include web addresses.'],
    ] as const) {
      await input.fill(name);
      await page.getByRole('button', { name: 'Save' }).click();
      await expect(page.getByRole('alert')).toHaveText(message);
    }
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(supabase.calls.some((c) => c.method === 'PATCH')).toBe(false);

    await input.fill('  Grandpa   Joe\u2019s grandson  ');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Profile saved')).toBeVisible();
    const patch = supabase.calls.find((c) => c.method === 'PATCH');
    expect(patch?.body).toEqual({ display_name: 'Grandpa Joe\u2019s grandson' });
    await expect(input).toHaveValue('Grandpa Joe\u2019s grandson');
    await expect(
      page.getByRole('banner').getByRole('button', { name: 'Grandpa Joe\u2019s grandson' }),
    ).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(
      page.getByText('Shown on your notes, voice memos, and decorations.'),
    ).toBeVisible();
    await expect(page.getByText('Letters, numbers')).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath('profile-settings.png'), fullPage: true });
  });

  test('display name input stops at 40 characters', async ({ page }) => {
    await page.goto('/settings/profile');
    const input = page.getByLabel('Display name');
    await input.fill('a'.repeat(60));
    await expect(input).toHaveValue('a'.repeat(40));
  });

  test('a long display name fits the header on a small phone', async ({
    page,
    supabase,
  }, testInfo) => {
    supabase.profile.display_name = 'Bartholomew Montgomery-Fitzwilliam'.slice(0, 40);
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/');
    await expect(page.getByRole('banner').getByRole('button')).toBeVisible();
    await expectResponsiveLayout(page);
    await page.getByRole('banner').getByRole('button').click();
    const menu = page.getByRole('menu');
    await expect(menu).toBeVisible();
    const box = await menu.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(320);
    }
    await page.screenshot({ path: testInfo.outputPath('small-phone-menu.png') });
  });
});

test.describe('profile settings layout', () => {
  test.skip(({ isMobile }) => isMobile, 'viewports are set explicitly, so run once');

  for (const viewport of TEST_VIEWPORTS) {
    test(`${viewport.name} ${viewport.width}x${viewport.height}`, async ({ page, supabase }) => {
      await supabase.signIn();
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/settings/profile');
      await expect(page.getByLabel('Display name')).toHaveValue('Alex C.');
      await expectResponsiveLayout(page);
    });
  }
});
