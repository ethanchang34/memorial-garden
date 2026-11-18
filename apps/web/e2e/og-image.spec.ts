import { fileURLToPath } from 'node:url';
import { expect, test } from './fixtures';

test.skip(!process.env['OG_IMAGE'], 'run with OG_IMAGE=1 to redraw the link preview image');

test('draws the link preview image', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'one image is enough');
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/dev/og');
  const scene = page.locator('[data-og] > div');
  await expect(scene.locator('[data-flower]')).toHaveCount(8);
  await page.waitForTimeout(500);
  await scene.screenshot({
    path: fileURLToPath(new URL('../public/og-garden.jpg', import.meta.url)),
    type: 'jpeg',
    quality: 82,
  });
});
