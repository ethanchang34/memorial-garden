import { expect, type Page } from '@playwright/test';
import { MIN_TOUCH_TARGET_PX } from './viewports';

export async function expectResponsiveLayout(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, 'page must not scroll horizontally').toBeLessThanOrEqual(0);

  const targets = page.locator(
    'header a, header button, main a, main button, main input, main label:has(input[type="radio"])',
  );
  for (const target of await targets.all()) {
    if (!(await target.isVisible())) continue;
    const box = await target.boundingBox();
    expect(box, 'interactive element must be rendered').not.toBeNull();
    if (!box) continue;
    if (box.width <= 1 && box.height <= 1) continue;
    const label = (await target.getAttribute('aria-label')) ?? (await target.innerText()) ?? '';
    expect(
      Math.min(box.width, box.height),
      `"${label.trim()}" must be at least ${MIN_TOUCH_TARGET_PX}px`,
    ).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX);
  }
}
