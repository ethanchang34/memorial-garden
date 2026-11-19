import type { Locator, Page } from '@playwright/test';
import { expect, memorialRow, noteRow, TEST_USER_ID, test, type SupabaseMock } from './fixtures';
import { TEST_VIEWPORTS } from './viewports';

const SLUG = 'rosa-martinez-2024';
const OTHER = '00000000-0000-4000-8000-0000000000b1';

function seed(supabase: SupabaseMock, ownerId: string | null = null) {
  const memorial = memorialRow({
    slug: SLUG,
    full_name: 'Rosa Martínez',
    died_date: '2024-07-19',
    owner_id: ownerId,
  });
  supabase.memorials.push(memorial);
  supabase.displayNames[OTHER] = 'Maria L.';
  return memorial;
}

function notesLabel(page: Page) {
  return page
    .locator('[data-object="notes"] span, [data-toolbar="notes"] span')
    .filter({ visible: true });
}

async function openNotes(page: Page) {
  await page
    .getByRole('button', { name: /^Notes( \(\d+\))?$/ })
    .filter({ visible: true })
    .click();
  const string = page.getByRole('dialog', { name: 'Notes' });
  await string.evaluate((el) =>
    Promise.all(
      el
        .getAnimations({ subtree: true })
        .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
        .map((animation) => animation.finished),
    ),
  );
  return string;
}

async function openNote(page: Page, string: Locator, text: string, from: string) {
  await string.locator('[data-note]').filter({ hasText: text }).click();
  return page.getByRole('dialog', { name: `A note from ${from}` });
}

test.describe('notes', () => {
  test.use({ reducedMotion: 'reduce' });

  test('visitors read notes on the string and are asked to sign in to write', async ({
    page,
    supabase,
  }) => {
    const memorial = seed(supabase);
    supabase.notes.push(
      noteRow({ memorial_id: memorial.id, author_id: OTHER, body: 'She taught me to bake.' }),
      noteRow({
        memorial_id: memorial.id,
        author_id: OTHER,
        body: 'Hidden one',
        status: 'hidden_by_owner',
      }),
    );
    await page.goto(`/m/${SLUG}`);
    await expect(
      page.getByRole('button', { name: 'Notes (1)', exact: true }).filter({ visible: true }),
    ).toBeVisible();
    const string = await openNotes(page);
    await expect(string.getByText('She taught me to bake.')).toBeVisible();
    await expect(string.getByText('Maria L.')).toBeVisible();
    await expect(string.getByText('Hidden one')).toHaveCount(0);
    await string.getByRole('button', { name: 'Write a note' }).click();
    const prompt = page.getByRole('dialog', { name: 'Write a note' });
    await expect(prompt.getByText('Sign in to leave a note.', { exact: false })).toBeVisible();
    await expect(prompt.getByLabel('Your note')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(prompt).toBeHidden();

    const detail = await openNote(page, string, 'She taught me to bake.', 'Maria L.');
    await expect(detail).toBeVisible();
    await expect(detail.getByRole('button', { name: 'Edit' })).toHaveCount(0);
    await expect(detail.getByRole('button', { name: 'Hide' })).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(detail).toBeHidden();
    await expect(string).toBeVisible();
    await expect(string.locator('[data-note]')).toBeFocused();
  });

  test('a member writes, edits and deletes a note', async ({ page, supabase }, testInfo) => {
    seed(supabase);
    await supabase.signIn();
    await page.goto(`/m/${SLUG}`);
    const string = await openNotes(page);
    await expect(string.getByText('No notes yet.')).toBeVisible();

    await string.getByRole('button', { name: 'Write a note' }).click();
    const composer = page.getByRole('dialog', { name: 'Write a note' });
    await composer.getByRole('button', { name: 'Post note' }).click();
    await expect(composer.getByText('Write something before posting.')).toBeVisible();
    expect(
      supabase.calls.some((call) => call.method === 'POST' && call.path === '/rest/v1/notes'),
    ).toBe(false);

    await composer
      .getByLabel('Your note')
      .fill('  We miss you, Abuela.\r\n\r\n\r\n\r\nEvery Sunday.  ');
    await composer.getByRole('button', { name: 'Post note' }).click();
    await expect(page.getByText('Your note is in the garden.')).toBeVisible();
    await expect(composer).toBeHidden();
    const slip = string.locator('[data-mine]');
    await expect(slip).toContainText('You');
    await expect(slip).toContainText('We miss you, Abuela.');
    await expect(string.getByText('No notes yet.')).toHaveCount(0);
    const insert = supabase.calls.find(
      (call) => call.method === 'POST' && call.path === '/rest/v1/notes',
    );
    expect(insert?.body).toMatchObject({
      author_id: TEST_USER_ID,
      body: 'We miss you, Abuela.\n\nEvery Sunday.',
    });
    await expect(notesLabel(page)).toHaveText('Notes (1)');
    if (process.env['GARDEN_SHOTS']) {
      await string.evaluate((el) =>
        Promise.all(
          el
            .getAnimations({ subtree: true })
            .filter((a) => a.effect?.getTiming().iterations !== Infinity)
            .map((a) => a.finished),
        ),
      );
      await page.screenshot({ path: testInfo.outputPath('notes-string.png') });
    }

    await slip.click();
    const detail = page.getByRole('dialog', { name: 'A note from you' });
    await detail.getByRole('button', { name: 'Edit' }).click();
    await detail.getByLabel('Your note').fill('We miss you every day.');
    await detail.getByRole('button', { name: 'Save' }).click();
    await expect(detail).toContainText('We miss you every day.');
    await expect(detail).toContainText('edited ·');
    await expect(page.locator('[data-string="notes"] [data-mine]')).toContainText(
      'We miss you every day.',
    );
    if (process.env['GARDEN_SHOTS']) {
      await page.screenshot({ path: testInfo.outputPath('note-detail.png') });
    }

    await detail.getByRole('button', { name: 'Delete' }).click();
    await expect(detail.getByText('Delete this note for good?')).toBeVisible();
    await detail.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('Note deleted.')).toBeVisible();
    await expect(detail).toBeHidden();
    await expect(string.getByText('No notes yet.')).toBeVisible();
  });

  test('the owner hides and shows a visitor’s note', async ({ page, supabase }) => {
    const memorial = seed(supabase, TEST_USER_ID);
    supabase.notes.push(
      noteRow({ memorial_id: memorial.id, author_id: OTHER, body: 'Something unkind' }),
    );
    await supabase.signIn();
    await page.goto(`/m/${SLUG}`);
    const string = await openNotes(page);
    const detail = await openNote(page, string, 'Something unkind', 'Maria L.');
    await expect(detail.getByRole('button', { name: 'Edit' })).toHaveCount(0);
    await detail.getByRole('button', { name: 'Hide' }).click();
    await expect(detail).toContainText('Hidden by the family');
    await expect(page.locator('[data-string="notes"] [data-note]')).toContainText(
      'Hidden by the family',
    );
    expect(supabase.notes[0]?.status).toBe('hidden_by_owner');
    await expect(notesLabel(page)).toHaveText('Notes');
    await detail.getByRole('button', { name: 'Show again' }).click();
    await expect(detail).not.toContainText('Hidden by the family');
  });

  test('a member reports someone else’s note', async ({ page, supabase }) => {
    const memorial = seed(supabase);
    supabase.notes.push(
      noteRow({ memorial_id: memorial.id, author_id: OTHER, body: 'Something unkind' }),
    );
    await supabase.signIn();
    await page.goto(`/m/${SLUG}`);
    const string = await openNotes(page);
    const detail = await openNote(page, string, 'Something unkind', 'Maria L.');
    await detail.getByRole('button', { name: 'Report' }).click();
    const form = detail.getByRole('form', { name: 'Report this note' });
    await form.getByRole('button', { name: 'Send report' }).click();
    await expect(form.getByText('Choose a reason.')).toBeVisible();
    expect(supabase.calls.some((call) => call.path === '/rest/v1/rpc/report_content')).toBe(false);

    await form.getByText('Shares someone’s private information', { exact: true }).click();
    await form
      .getByLabel('Anything else we should know? (optional)')
      .fill('  It has a phone number.  ');
    await form.getByRole('button', { name: 'Send report' }).click();
    await expect(page.getByText('Thank you. We’ll take a look.')).toBeVisible();
    await expect(form).toBeHidden();
    expect(supabase.reports).toEqual([
      { target_id: supabase.notes[0]!.id, reason: 'private', details: 'It has a phone number.' },
    ]);
    await expect(detail.getByText('Something unkind')).toBeVisible();

    await detail.getByRole('button', { name: 'Report' }).click();
    await form.getByText('Spam or advertising', { exact: true }).click();
    await form.getByRole('button', { name: 'Send report' }).click();
    await expect(page.getByText('You’ve already reported this note.')).toBeVisible();
  });

  test('your own notes have no Report button, and visitors are asked to sign in', async ({
    page,
    supabase,
  }) => {
    const memorial = seed(supabase);
    supabase.notes.push(
      noteRow({ memorial_id: memorial.id, author_id: OTHER, body: 'Something unkind' }),
      noteRow({ memorial_id: memorial.id, author_id: TEST_USER_ID, body: 'Mine' }),
    );
    await page.goto(`/m/${SLUG}`);
    let string = await openNotes(page);
    const detail = await openNote(page, string, 'Something unkind', 'Maria L.');
    await detail.getByRole('button', { name: 'Report' }).click();
    await expect(detail.getByText('Sign in to report a note', { exact: false })).toBeVisible();
    expect(supabase.calls.some((call) => call.path === '/rest/v1/rpc/report_content')).toBe(false);

    await supabase.signIn();
    await page.goto(`/m/${SLUG}`);
    string = await openNotes(page);
    const mine = await openNote(page, string, 'Mine', 'you');
    await expect(mine.getByRole('button', { name: 'Edit' })).toBeVisible();
    await expect(mine.getByRole('button', { name: 'Report' })).toHaveCount(0);
  });

  test('limits from the database are explained', async ({ page, supabase }) => {
    seed(supabase);
    supabase.noteFailNext = 'note_rate_limit';
    await supabase.signIn();
    await page.goto(`/m/${SLUG}`);
    const string = await openNotes(page);
    await string.getByRole('button', { name: 'Write a note' }).click();
    const composer = page.getByRole('dialog', { name: 'Write a note' });
    await composer.getByLabel('Your note').fill('Hello again');
    await composer.getByRole('button', { name: 'Post note' }).click();
    await expect(
      page.getByText('You’ve written a lot of notes this hour.', { exact: false }),
    ).toBeVisible();
    await expect(composer.getByLabel('Your note')).toHaveValue('Hello again');
  });

  test('long notes are clipped on the string and read in full, and the arrows move along', async ({
    page,
    supabase,
  }, testInfo) => {
    const memorial = seed(supabase);
    supabase.notes.push(
      ...Array.from({ length: 7 }, (_, index) =>
        noteRow({ memorial_id: memorial.id, author_id: OTHER, body: `Short note ${index + 1}` }),
      ),
      noteRow({
        memorial_id: memorial.id,
        author_id: OTHER,
        body: `${'A long memory. '.repeat(40)}The end.`,
      }),
    );
    await page.goto(`/m/${SLUG}`);
    const string = await openNotes(page);
    await expect(string.locator('[data-note]')).toHaveCount(8);
    const track = string.locator('[data-string-track]');
    const viewport = page.viewportSize()!;

    if (testInfo.project.name === 'mobile') {
      const first = (await string.locator('li').first().boundingBox())!;
      const trackBox = (await track.boundingBox())!;
      expect(Math.round(first.width)).toBe(Math.round(trackBox.width));
      expect(trackBox.width).toBeGreaterThan(viewport.width * 0.88);
      expect(trackBox.width).toBeLessThan(viewport.width * 0.95);
      await expect(string.getByText('1 of 8', { exact: true })).toBeVisible();
      await expect(string.locator('[data-note]').first()).toBeInViewport({ ratio: 0.9 });
      await string.getByRole('button', { name: 'Next page' }).click();
      await expect(string.getByText('2 of 8', { exact: true })).toBeVisible();
      await expect(string.locator('[data-note]').nth(1)).toBeInViewport({ ratio: 0.9 });
      await string.getByRole('button', { name: 'Previous page' }).click();
    } else {
      await expect(string.getByText(/^1–\d of 8$/)).toBeVisible();
    }

    const long = string.locator('[data-note]').filter({ hasText: 'A long memory.' });
    const clipped = await long
      .getByText('The end.', { exact: false })
      .evaluate((el) => el.scrollHeight > el.clientHeight);
    expect(clipped).toBe(true);
    await long.click();
    const detail = page.getByRole('dialog', { name: 'A note from Maria L.' });
    await expect(detail.getByText('The end.', { exact: false })).toBeVisible();
    await page.keyboard.press('Escape');

    if (testInfo.project.name === 'mobile') return;
    await expect(string.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    await string.getByRole('button', { name: 'Next page' }).click();
    await expect.poll(() => track.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
    await expect(string.getByRole('button', { name: 'Previous page' })).toBeEnabled();
    if (process.env['GARDEN_SHOTS']) {
      await page.waitForTimeout(700);
      await page.screenshot({ path: testInfo.outputPath('notes-paged.png') });
    }
  });

  test('one note opens straight on that note, with writing in the header', async ({
    page,
    supabase,
  }) => {
    const memorial = seed(supabase);
    supabase.notes.push(
      noteRow({ memorial_id: memorial.id, author_id: OTHER, body: 'She taught me to bake.' }),
    );
    await supabase.signIn();
    await page.goto(`/m/${SLUG}`);
    const string = await openNotes(page);
    await expect(string.locator('[data-string-track] li:not([aria-hidden])')).toHaveCount(1);
    await expect(string.locator('[data-note]')).toBeInViewport({ ratio: 0.9 });
    await expect(string.getByText('1 of 1', { exact: true })).toBeVisible();
    await expect(string.getByText('No notes yet', { exact: false })).toHaveCount(0);
    const write = string.getByRole('button', { name: 'Write a note' });
    const title = (await string.getByRole('heading', { name: 'Notes' }).boundingBox())!;
    const box = (await write.boundingBox())!;
    expect(Math.abs(box.y + box.height / 2 - (title.y + title.height / 2))).toBeLessThan(12);
    await write.click();
    await expect(
      page.getByRole('dialog', { name: 'Write a note' }).getByLabel('Your note'),
    ).toBeFocused();
  });

  test('an empty string invites the first note', async ({ page, supabase }) => {
    seed(supabase);
    await page.goto(`/m/${SLUG}`);
    const string = await openNotes(page);
    await expect(string.getByText('No notes yet. Be the first.')).toBeVisible();
    await expect(string.getByText(/^\d+(–\d+)? of \d+$/)).toHaveCount(0);
    await expect(string.getByRole('button', { name: 'Write a note' })).toBeVisible();
  });

  test('swiping the string sideways moves the page count along', async ({ page, supabase }) => {
    const memorial = seed(supabase);
    supabase.notes.push(
      ...Array.from({ length: 12 }, (_, index) =>
        noteRow({ memorial_id: memorial.id, author_id: OTHER, body: `Note ${index + 1}` }),
      ),
    );
    await page.goto(`/m/${SLUG}`);
    const string = await openNotes(page);
    const track = string.locator('[data-string-track]');
    await track.evaluate((el) => el.scrollTo({ left: el.clientWidth }));
    await expect(
      string.getByText(/^(2|\d+–\d+) of 12$/).filter({ hasNotText: /^1–/ }),
    ).toBeVisible();
  });

  test('the notes string fits every screen', async ({ page, supabase }) => {
    test.slow();
    const memorial = seed(supabase);
    supabase.notes.push(
      noteRow({ memorial_id: memorial.id, author_id: OTHER, body: 'Thinking of you.' }),
    );
    await supabase.signIn();
    for (const viewport of TEST_VIEWPORTS) {
      await page.setViewportSize(viewport);
      await page.goto(`/m/${SLUG}`);
      const string = await openNotes(page);
      await expect(string.locator('[data-note]')).toBeVisible();
      const pageOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(pageOverflow).toBeLessThanOrEqual(0);
      const slip = (await string.locator('li').first().boundingBox())!;
      expect(slip.x).toBeGreaterThanOrEqual(0);
      expect(slip.x + slip.width).toBeLessThanOrEqual(viewport.width + 1);
      for (const button of await string.getByRole('button').all()) {
        if (!(await button.isVisible())) continue;
        const box = (await button.boundingBox())!;
        const label = (await button.getAttribute('aria-label')) ?? (await button.innerText());
        expect(Math.min(box.width, box.height), label).toBeGreaterThanOrEqual(44);
      }
      await string.getByRole('button', { name: 'Write a note' }).click();
      const composer = page.getByRole('dialog', { name: 'Write a note' });
      const overflow = await composer.evaluate((el) => el.scrollWidth - el.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');
      await expect(string).toBeHidden();
    }
  });
});

test('notes sway gently on the string, and hold still with reduced motion', async ({
  page,
  supabase,
}) => {
  const memorial = seed(supabase);
  supabase.notes.push(noteRow({ memorial_id: memorial.id, author_id: OTHER, body: 'Hello.' }));
  await page.goto(`/m/${SLUG}`);
  const string = await openNotes(page);
  const sway = string.locator('.keepsake-sway').last();
  await expect(sway).toHaveCSS('animation-name', 'keepsake-sway');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(sway).toHaveCSS('animation-name', 'none');
});
