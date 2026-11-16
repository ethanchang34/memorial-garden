import type { Page } from '@playwright/test';
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
  return page.getByRole('dialog', { name: 'Notes' });
}

test.describe('notes', () => {
  test('visitors read notes with display names and are asked to sign in to write', async ({
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
    const drawer = await openNotes(page);
    await expect(drawer.getByText('She taught me to bake.')).toBeVisible();
    await expect(drawer.getByText('Maria L.')).toBeVisible();
    await expect(drawer.getByText('Hidden one')).toHaveCount(0);
    await expect(drawer.getByText('Sign in to leave a note.', { exact: false })).toBeVisible();
    await expect(drawer.getByRole('button', { name: 'Edit' })).toHaveCount(0);
    await expect(drawer.getByRole('button', { name: 'Hide' })).toHaveCount(0);
  });

  test('a member writes, edits and deletes a note', async ({ page, supabase }, testInfo) => {
    seed(supabase);
    await supabase.signIn();
    await page.goto(`/m/${SLUG}`);
    const drawer = await openNotes(page);
    await expect(drawer.getByText('No notes yet.')).toBeVisible();

    await drawer.getByRole('button', { name: 'Write a note' }).click();
    await drawer.getByRole('button', { name: 'Post note' }).click();
    await expect(drawer.getByText('Write something before posting.')).toBeVisible();
    expect(
      supabase.calls.some((call) => call.method === 'POST' && call.path === '/rest/v1/notes'),
    ).toBe(false);

    await drawer
      .getByLabel('Your note')
      .fill('  We miss you, Abuela.\r\n\r\n\r\n\r\nEvery Sunday.  ');
    await drawer.getByRole('button', { name: 'Post note' }).click();
    await expect(page.getByText('Your note is in the garden.')).toBeVisible();
    const card = drawer.locator('[data-mine]');
    await expect(card).toContainText('You');
    await expect(card).toContainText('We miss you, Abuela.');
    const insert = supabase.calls.find(
      (call) => call.method === 'POST' && call.path === '/rest/v1/notes',
    );
    expect(insert?.body).toMatchObject({
      author_id: TEST_USER_ID,
      body: 'We miss you, Abuela.\n\nEvery Sunday.',
    });
    await expect(notesLabel(page)).toHaveText('Notes (1)');
    if (process.env['GARDEN_SHOTS']) {
      await page.screenshot({ path: testInfo.outputPath('notes-drawer.png') });
    }

    await card.getByRole('button', { name: 'Edit' }).click();
    await card.getByLabel('Your note').fill('We miss you every day.');
    await card.getByRole('button', { name: 'Save' }).click();
    await expect(card).toContainText('We miss you every day.');
    await expect(card).toContainText('edited ·');

    await card.getByRole('button', { name: 'Delete' }).click();
    await expect(card.getByText('Delete this note for good?')).toBeVisible();
    await card.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('Note deleted.')).toBeVisible();
    await expect(drawer.getByText('No notes yet.')).toBeVisible();
  });

  test('the owner hides and shows a visitor’s note', async ({ page, supabase }) => {
    const memorial = seed(supabase, TEST_USER_ID);
    supabase.notes.push(
      noteRow({ memorial_id: memorial.id, author_id: OTHER, body: 'Something unkind' }),
    );
    await supabase.signIn();
    await page.goto(`/m/${SLUG}`);
    const drawer = await openNotes(page);
    const card = drawer.locator('[data-note]');
    await expect(card.getByRole('button', { name: 'Edit' })).toHaveCount(0);
    await card.getByRole('button', { name: 'Hide' }).click();
    await expect(card).toContainText('Hidden by the family');
    expect(supabase.notes[0]?.status).toBe('hidden_by_owner');
    await expect(notesLabel(page)).toHaveText('Notes');
    await card.getByRole('button', { name: 'Show again' }).click();
    await expect(card).not.toContainText('Hidden by the family');
  });

  test('limits from the database are explained', async ({ page, supabase }) => {
    seed(supabase);
    supabase.noteFailNext = 'note_rate_limit';
    await supabase.signIn();
    await page.goto(`/m/${SLUG}`);
    const drawer = await openNotes(page);
    await drawer.getByRole('button', { name: 'Write a note' }).click();
    await drawer.getByLabel('Your note').fill('Hello again');
    await drawer.getByRole('button', { name: 'Post note' }).click();
    await expect(
      page.getByText('You’ve written a lot of notes this hour.', { exact: false }),
    ).toBeVisible();
    await expect(drawer.getByLabel('Your note')).toHaveValue('Hello again');
  });

  test('long notes fold and many notes page', async ({ page, supabase }) => {
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
    const drawer = await openNotes(page);
    await expect(drawer.locator('[data-note]')).toHaveCount(6);
    const more = drawer.getByRole('button', { name: 'Read more' });
    await expect(more).toHaveAttribute('aria-expanded', 'false');
    await more.click();
    await expect(drawer.getByRole('button', { name: 'Show less' })).toBeVisible();
    await drawer.getByRole('button', { name: 'Next page' }).click();
    await expect(drawer.locator('[data-note]')).toHaveCount(2);
    await expect(drawer.getByText('Short note 1', { exact: true })).toBeVisible();
  });

  test('the notes drawer fits every screen', async ({ page, supabase }) => {
    const memorial = seed(supabase);
    supabase.notes.push(
      noteRow({ memorial_id: memorial.id, author_id: OTHER, body: 'Thinking of you.' }),
    );
    await supabase.signIn();
    for (const viewport of TEST_VIEWPORTS) {
      await page.setViewportSize(viewport);
      await page.goto(`/m/${SLUG}`);
      const drawer = await openNotes(page);
      await drawer.getByRole('button', { name: 'Write a note' }).click();
      const overflow = await drawer.evaluate((el) => el.scrollWidth - el.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      for (const button of await drawer.getByRole('button').all()) {
        if (!(await button.isVisible())) continue;
        const box = (await button.boundingBox())!;
        expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
      }
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');
    }
  });
});
