import { expect, test } from './fixtures';
import { expectResponsiveLayout } from './responsive';

test.describe('visual direction sketches', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dev/directions');
    await expect(page.getByRole('heading', { level: 1, name: 'Visual directions' })).toBeVisible();
  });

  test('shows all three directions and fits the screen', async ({ page }, testInfo) => {
    for (const name of ['Direction A', 'Direction B', 'Direction C']) {
      await expect(page.getByRole('img', { name: new RegExp(name) })).toBeVisible();
    }
    await expectResponsiveLayout(page);
    await page.screenshot({ path: testInfo.outputPath('directions.png'), fullPage: true });
  });

  test('each direction up close', async ({ page }, testInfo) => {
    for (const [file, name] of [
      ['a-painted', 'Direction A'],
      ['b-layered', 'Direction B'],
      ['c-stationery', 'Direction C'],
    ] as const) {
      await page
        .getByRole('img', { name: new RegExp(name) })
        .screenshot({ path: testInfo.outputPath(`${file}.png`) });
    }
  });

  test('direction B at every time of day', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'one set of time-of-day images is enough');
    const scene = page.getByRole('img', { name: /Direction B/ });
    for (const [label, key] of [
      ['Morning', 'morning'],
      ['Day', 'day'],
      ['Golden hour', 'golden'],
      ['Evening', 'evening'],
    ] as const) {
      await page.getByRole('button', { name: label, exact: true }).click();
      await expect(scene).toHaveAccessibleName(`Direction B: layered paper garden, ${key}`);
      await scene.screenshot({ path: testInfo.outputPath(`b-${key}.png`) });
    }
  });

  test('the companion can be hidden', async ({ page }, testInfo) => {
    const toggle = page.getByRole('button', { name: 'Hide the companion' });
    await toggle.click();
    await expect(page.getByRole('button', { name: 'Show the companion' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await page
      .getByRole('img', { name: /Direction B/ })
      .screenshot({ path: testInfo.outputPath('b-no-companion.png') });
  });
});
