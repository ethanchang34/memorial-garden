import { expect, test, type AdminQueueRow } from './fixtures';
import { expectResponsiveLayout } from './responsive';
import { TEST_VIEWPORTS } from './viewports';

function queueRow(overrides: Partial<AdminQueueRow> = {}): AdminQueueRow {
  return {
    note_id: '00000000-0000-4000-a000-00000000aa01',
    note_body: 'Something unkind',
    note_status: 'visible',
    note_created_at: '2026-11-10T12:00:00Z',
    author_id: '00000000-0000-4000-8000-0000000000b1',
    author_name: 'Wren W.',
    author_status: 'active',
    memorial_slug: 'rosa-martinez-2024',
    memorial_name: 'Rosa Martínez',
    report_count: 2,
    reasons: ['hurtful', 'private'],
    details: ['It has a phone number.'],
    first_reported_at: '2026-11-11T12:00:00Z',
    ...overrides,
  };
}

test('the admin reviews a reported note and removes it with a reason', async ({
  page,
  supabase,
}, testInfo) => {
  supabase.isAdmin = true;
  supabase.reportQueue = [
    queueRow(),
    queueRow({
      note_id: '00000000-0000-4000-a000-00000000aa02',
      note_body: 'Probably fine',
      report_count: 1,
      reasons: ['spam'],
      details: [],
    }),
  ];
  await supabase.signIn();
  await page.goto('/');
  await page.getByRole('banner').getByRole('button', { name: 'Alex C.' }).click();
  await page.getByRole('menuitem', { name: 'Reports' }).click();
  await expect(page).toHaveURL('/admin/reports');
  await expect(page.getByText('2 notes waiting for review.')).toBeVisible();

  const card = page.locator('[data-report="00000000-0000-4000-a000-00000000aa01"]');
  await expect(card).toContainText('2 reports');
  await expect(card).toContainText('Something unkind');
  await expect(card).toContainText('Written by Wren W.');
  await expect(card).toContainText(
    'Hurtful, hateful or harassing · Shares someone’s private information',
  );
  await expect(card).toContainText('“It has a phone number.”');
  await expect(card.getByRole('link', { name: 'Open Rosa Martínez’s garden' })).toHaveAttribute(
    'href',
    '/m/rosa-martinez-2024',
  );
  if (process.env['GARDEN_SHOTS'])
    await page.screenshot({ path: testInfo.outputPath('admin-reports.png'), fullPage: true });

  await card.getByRole('button', { name: 'Save decision' }).click();
  await expect(card.getByText('Choose a decision.')).toBeVisible();
  await card.getByText('Remove the note', { exact: true }).click();
  await card.getByRole('button', { name: 'Save decision' }).click();
  await expect(card.getByText('Write a short reason.')).toBeVisible();
  expect(supabase.adminActions).toEqual([]);

  await card.getByLabel('Why? (kept in the audit log)').fill('  Shares a phone number  ');
  await card.getByRole('button', { name: 'Save decision' }).click();
  await expect(page.getByText('Note removed.')).toBeVisible();
  expect(supabase.adminActions).toEqual([
    {
      note: '00000000-0000-4000-a000-00000000aa01',
      decision: 'remove',
      reason: 'Shares a phone number',
    },
  ]);
  await expect(card).toHaveCount(0);
  await expect(page.getByText('1 note waiting for review.')).toBeVisible();

  const other = page.locator('[data-report="00000000-0000-4000-a000-00000000aa02"]');
  await other.getByText('Keep the note (dismiss the reports)', { exact: true }).click();
  await other.getByLabel('Why? (kept in the audit log)').fill('Kind memory, not spam');
  await other.getByRole('button', { name: 'Save decision' }).click();
  await expect(page.getByText('No open reports. All caught up.')).toBeVisible();
});

test('the reports page is not there for anyone else', async ({ page, supabase }) => {
  await page.goto('/admin/reports');
  await expect(page.getByText('This path leads nowhere')).toBeVisible();
  expect(supabase.calls.some((call) => call.path === '/rest/v1/rpc/admin_report_queue')).toBe(
    false,
  );

  await supabase.signIn();
  await page.goto('/admin/reports');
  await expect(page.getByText('This path leads nowhere')).toBeVisible();
  await page.getByRole('banner').getByRole('button', { name: 'Alex C.' }).click();
  await expect(page.getByRole('menuitem', { name: 'Reports' })).toHaveCount(0);
});

test('the reports page fits every screen', async ({ page, supabase }) => {
  test.slow();
  supabase.isAdmin = true;
  supabase.reportQueue = [queueRow({ note_body: 'A long memory. '.repeat(30) })];
  await supabase.signIn();
  for (const viewport of TEST_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await page.goto('/admin/reports');
    await expect(page.locator('[data-report]')).toBeVisible();
    await expectResponsiveLayout(page);
  }
});
