import { expect, test } from '@playwright/test';
import { MIN_TOUCH_TARGET_PX, TEST_VIEWPORTS } from './viewports';

test.describe('home page', () => {
  test('shows the welcome heading and actions', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('Memorial Garden');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create a memorial' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Find someone' })).toBeVisible();
  });

  test('skip link moves focus to the main content', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard navigation is a desktop concern');
    await page.goto('/');

    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: 'Skip to content' });
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeInViewport();

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main-content$/);
  });
});

test.describe('responsive layout', () => {
  test.skip(({ isMobile }) => isMobile, 'viewports are set explicitly, so run once');

  for (const viewport of TEST_VIEWPORTS) {
    test(`${viewport.name} ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, 'page must not scroll horizontally').toBeLessThanOrEqual(0);

      const targets = page.locator('main a, main button, header a');
      for (const target of await targets.all()) {
        const box = await target.boundingBox();
        expect(box, 'interactive element must be rendered').not.toBeNull();
        if (!box) continue;
        expect(
          Math.min(box.width, box.height),
          `${await target.innerText()} must be at least ${MIN_TOUCH_TARGET_PX}px`,
        ).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX);
      }
    });
  }
});
