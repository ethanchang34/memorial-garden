import { expect, test } from '@playwright/test';
import { MIN_TOUCH_TARGET_PX } from './viewports';

test.describe('UI components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dev/ui');
    await expect(page.getByRole('heading', { level: 1, name: 'Interface pieces' })).toBeVisible();
  });

  test('buttons meet the touch target size', async ({ page }) => {
    for (const button of await page.locator('main button').all()) {
      const box = await button.boundingBox();
      expect(box).not.toBeNull();
      if (!box) continue;
      expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX);
    }
  });

  test('dialog traps focus, closes with Escape, and returns focus', async ({ page }) => {
    const trigger = page.getByRole('button', { name: 'Place flowers' });
    await trigger.click();

    const dialog = page.getByRole('dialog', { name: 'Place flowers for Rosa' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('200 coins');

    for (let i = 0; i < 5; i += 1) {
      await page.keyboard.press('Tab');
      await expect(dialog.locator(':focus')).toHaveCount(1);
    }

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('dialog is a bottom sheet on phones and centered on larger screens', async ({
    page,
    isMobile,
  }, testInfo) => {
    await page.getByRole('button', { name: 'Place flowers' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(500);

    const box = await dialog.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();
    if (!box || !viewport) return;

    if (isMobile) {
      expect(Math.round(box.y + box.height)).toBe(viewport.height);
      expect(Math.round(box.width)).toBe(viewport.width);
    } else {
      expect(Math.abs(box.x + box.width / 2 - viewport.width / 2)).toBeLessThanOrEqual(1);
      expect(Math.abs(box.y + box.height / 2 - viewport.height / 2)).toBeLessThanOrEqual(1);
    }

    await page.screenshot({ path: testInfo.outputPath('dialog.png') });
  });

  test('confirming shows a toast', async ({ page }) => {
    await page.getByRole('button', { name: 'Place flowers' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Place flowers' }).click();
    await expect(page.getByText('Flowers placed 🌸')).toBeVisible();
  });

  test('tooltip appears on hover and keyboard focus', async ({ page, isMobile }) => {
    test.skip(isMobile, 'tooltips are a mouse and keyboard affordance');
    const trigger = page.getByRole('button', { name: 'Who left these?' });

    await trigger.hover();
    await expect(page.getByRole('tooltip')).toContainText('Flowers from Alex C.');

    await page.keyboard.press('Escape');
    await expect(page.getByRole('tooltip')).toBeHidden();

    const box = await trigger.boundingBox();
    if (!box) throw new Error('trigger not rendered');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height + 200, { steps: 8 });
    await expect(page.getByRole('tooltip')).toBeHidden();

    await trigger.focus();
    await expect(page.getByRole('tooltip')).toContainText('Flowers from Alex C.');
  });

  test('full page screenshot', async ({ page }, testInfo) => {
    await page.screenshot({ path: testInfo.outputPath('preview.png'), fullPage: true });
  });
});

test('unknown pages show the not-found page', async ({ page }) => {
  await page.goto('/no-such-page');
  await expect(
    page.getByRole('heading', { level: 1, name: 'This path leads nowhere' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Return to the garden' }).click();
  await expect(page).toHaveURL('/');
});
