import { expect, test } from './fixtures';
import { expectResponsiveLayout } from './responsive';

test('code-drawn art renders and fits the screen', async ({ page }, testInfo) => {
  await page.goto('/dev/art');
  const art = page.getByRole('img', { name: /Orchard still life/ });
  await expect(art).toBeVisible();
  await expectResponsiveLayout(page);
  await art.screenshot({ path: testInfo.outputPath('still-life.png') });
});

test('reduced motion stops the animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/dev/art');
  const duration = await page
    .getByRole('img', { name: /Orchard still life/ })
    .evaluate((svg) => getComputedStyle(svg.querySelector('[class^="flame-"]')!).animationDuration);
  expect(parseFloat(duration)).toBeLessThan(0.1);
});
