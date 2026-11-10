import { expect, test } from './fixtures';
import { expectResponsiveLayout } from './responsive';

const PALETTE_IDS = ['current', 'orchard', 'meadow', 'lavender', 'woodland', 'seaside'];

test.describe('color study', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dev/palettes');
    await expect(page.getByRole('heading', { level: 1, name: 'Color study' })).toBeVisible();
  });

  test('shows every palette at golden hour and evening and fits the screen', async ({ page }) => {
    await expect(page.getByRole('img', { name: /golden hour$/ })).toHaveCount(PALETTE_IDS.length);
    await expect(page.getByRole('img', { name: /evening$/ })).toHaveCount(PALETTE_IDS.length);
    await expectResponsiveLayout(page);
  });

  test('captures each palette for review', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'desktop captures show both times side by side');
    for (const [index, id] of PALETTE_IDS.entries()) {
      await page
        .locator(`[data-palette="${id}"]`)
        .screenshot({ path: testInfo.outputPath(`palette-${index + 1}-${id}.png`) });
    }
  });
});
