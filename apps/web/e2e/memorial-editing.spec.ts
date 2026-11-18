import type { Page } from '@playwright/test';
import { expect, memorialRow, test, TEST_USER_ID } from './fixtures';
import { expectResponsiveLayout } from './responsive';
import { TEST_VIEWPORTS } from './viewports';

async function openStory(page: Page) {
  await page
    .getByRole('button', { name: 'Life story', exact: true })
    .filter({ visible: true })
    .click();
  return page.getByRole('dialog', { name: 'Life story' });
}

test.describe('editing a memorial', () => {
  test.beforeEach(async ({ supabase }) => {
    await supabase.signIn();
  });

  test('the owner fixes a typo in a draft and its address follows', async ({ page, supabase }) => {
    supabase.memorials.push(
      memorialRow({
        slug: 'rosa-martnez-2024',
        full_name: 'Rosa Martnez',
        died_date: '2024-07-19',
        born_date: '1932-01-01',
        born_precision: 'circa',
        owner_id: TEST_USER_ID,
        status: 'draft',
      }),
    );
    await page.goto('/m/rosa-martnez-2024');
    await page.getByRole('link', { name: 'Edit memorial' }).click();
    await expect(page).toHaveURL('/m/rosa-martnez-2024/edit');
    await expect(page.getByRole('heading', { level: 1, name: 'Edit memorial' })).toBeVisible();
    await expect(page.getByLabel('Their full name')).toHaveValue('Rosa Martnez');
    const born = page.getByRole('group', { name: 'Born' });
    await expect(born.getByRole('radio', { name: 'Around' })).toBeChecked();
    await expect(born.getByRole('spinbutton')).toHaveValue('1932');
    const died = page.getByRole('group', { name: 'Passed away' });
    await expect(died.locator('input[type="date"]')).toHaveValue('2024-07-19');

    await page.getByLabel('Their full name').fill('Rosa Martínez');
    await page.getByLabel('A short epitaph (optional)').fill('Always in our garden');
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(page).toHaveURL('/m/rosa-martinez-2024');
    await expect(page.getByText('Changes saved.')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Rosa Martínez' })).toBeVisible();
    await expect(page.locator('main header').getByText('Always in our garden')).toBeVisible();
    const patch = supabase.calls.find(
      (call) => call.method === 'PATCH' && call.path === '/rest/v1/memorials',
    );
    expect(patch?.body).toMatchObject({
      full_name: 'Rosa Martínez',
      born_date: '1932-01-01',
      born_precision: 'circa',
      died_date: '2024-07-19',
      died_precision: 'day',
      epitaph: 'Always in our garden',
    });
  });

  test('a shared memorial keeps its address when renamed', async ({ page, supabase }) => {
    supabase.memorials.push(
      memorialRow({
        slug: 'shared-person-2020',
        full_name: 'Shared Person',
        died_date: '2020-01-01',
        died_precision: 'year',
        owner_id: TEST_USER_ID,
      }),
    );
    await page.goto('/m/shared-person-2020/edit');
    await expect(page.getByText('already shared, so its web address stays the same')).toBeVisible();
    const died = page.getByRole('group', { name: 'Passed away' });
    await expect(died.getByRole('radio', { name: 'Year' })).toBeChecked();
    await expect(died.getByRole('spinbutton')).toHaveValue('2020');
    await page.getByLabel('Their full name').fill('Shared Person Renamed');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page).toHaveURL('/m/shared-person-2020');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Shared Person Renamed' }),
    ).toBeVisible();
  });

  test('the form explains problems before saving anything', async ({ page, supabase }) => {
    supabase.memorials.push(
      memorialRow({
        slug: 'ana-2021',
        full_name: 'Ana',
        died_date: '2021-05-02',
        owner_id: TEST_USER_ID,
      }),
    );
    await page.goto('/m/ana-2021/edit');
    await expect(page.getByText('already shared, so its web address stays the same')).toBeVisible();
    await page.getByLabel('Their full name').fill('   ');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Enter their name.')).toBeVisible();
    expect(supabase.calls.some((call) => call.method === 'PATCH')).toBe(false);

    await page.getByLabel('Their full name').fill('Ana Renamed');
    supabase.memorialFailNext = true;
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('We couldn’t save your changes. Please try again.')).toBeVisible();
    await expect(page).toHaveURL('/m/ana-2021/edit');

    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page).toHaveURL('/m/ana-2021');
    await expect(page.getByRole('heading', { level: 1, name: 'Ana Renamed' })).toBeVisible();
  });

  test('cancel goes back without saving', async ({ page, supabase }) => {
    supabase.memorials.push(
      memorialRow({
        slug: 'ana-2021',
        full_name: 'Ana',
        died_date: '2021-05-02',
        owner_id: TEST_USER_ID,
      }),
    );
    await page.goto('/m/ana-2021/edit');
    await page.getByLabel('Their full name').fill('Something else');
    await page.getByRole('link', { name: 'Cancel' }).click();
    await expect(page).toHaveURL('/m/ana-2021');
    await expect(page.getByRole('heading', { level: 1, name: 'Ana' })).toBeVisible();
    expect(supabase.calls.some((call) => call.method === 'PATCH')).toBe(false);
  });

  test('the edit page fits every screen', async ({ page, supabase }) => {
    test.slow();
    supabase.memorials.push(
      memorialRow({
        slug: 'ana-2021',
        full_name: 'Ana',
        died_date: '2021-05-02',
        owner_id: TEST_USER_ID,
      }),
    );
    for (const viewport of TEST_VIEWPORTS) {
      await page.setViewportSize(viewport);
      await page.goto('/m/ana-2021/edit');
      await expect(page.getByLabel('Their full name')).toBeVisible();
      await expectResponsiveLayout(page);
    }
  });
});

test.describe('who can edit', () => {
  test('visitors see no edit link and the edit page is not there for them', async ({
    page,
    supabase,
  }) => {
    supabase.memorials.push(
      memorialRow({ slug: 'someone-2020', full_name: 'Someone', died_date: '2020-02-02' }),
    );
    await page.goto('/m/someone-2020');
    await expect(page.getByRole('heading', { level: 1, name: 'Someone' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Edit memorial' })).toHaveCount(0);
    await page.goto('/m/someone-2020/edit');
    await expect(page.getByText('Sign in to edit this memorial.')).toBeVisible();

    await supabase.signIn();
    await page.goto('/m/someone-2020/edit');
    await expect(page.getByText('This path leads nowhere')).toBeVisible();
    await expect(page.getByLabel('Their full name')).toHaveCount(0);
  });
});

test.describe('the life story', () => {
  test('the owner writes it in the drawer', async ({ page, supabase }, testInfo) => {
    supabase.memorials.push(
      memorialRow({
        slug: 'rosa-martinez-2024',
        full_name: 'Rosa Martínez',
        died_date: '2024-07-19',
        owner_id: TEST_USER_ID,
      }),
    );
    await supabase.signIn();
    await page.goto('/m/rosa-martinez-2024');
    const drawer = await openStory(page);
    await expect(
      drawer.getByText('Tell visitors who Rosa Martínez was', { exact: false }),
    ).toBeVisible();
    await drawer.getByRole('button', { name: 'Write the life story' }).click();
    await drawer
      .getByLabel('Life story')
      .fill(
        '  Born in Oaxaca in 1932.\nShe grew roses.  \r\n\r\n\r\n\r\nShe sang to them every morning.  ',
      );
    await drawer.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Life story saved.')).toBeVisible();
    const paragraphs = drawer.locator('[data-life-story] p.whitespace-pre-line');
    await expect(paragraphs).toHaveCount(2);
    await expect(paragraphs.first()).toHaveText('Born in Oaxaca in 1932.\nShe grew roses.');
    const patch = supabase.calls.find(
      (call) => call.method === 'PATCH' && call.path === '/rest/v1/memorials',
    );
    expect(patch?.body).toEqual({
      life_story: 'Born in Oaxaca in 1932.\nShe grew roses.\n\nShe sang to them every morning.',
    });
    if (process.env['GARDEN_SHOTS']) {
      await drawer.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished)));
      await page.screenshot({ path: testInfo.outputPath('life-story.png') });
    }
  });

  test('visitors read the life story in paragraphs', async ({ page, supabase }) => {
    supabase.memorials.push(
      memorialRow({
        slug: 'rosa-martinez-2024',
        full_name: 'Rosa Martínez',
        died_date: '2024-07-19',
        life_story: 'Born in Oaxaca.\n\nShe sang to them every morning.',
      }),
    );
    await page.goto('/m/rosa-martinez-2024');
    const drawer = await openStory(page);
    await expect(drawer.locator('[data-life-story] p.whitespace-pre-line')).toHaveCount(2);
    await expect(drawer.getByText('She sang to them every morning.')).toBeVisible();
    await expect(drawer.getByRole('button', { name: /life story/ })).toHaveCount(0);
    await expect(drawer.getByRole('link', { name: 'Edit name and dates' })).toHaveCount(0);
  });

  test('clearing the story brings back the empty message, and long stories are refused', async ({
    page,
    supabase,
  }) => {
    supabase.memorials.push(
      memorialRow({
        slug: 'rosa-martinez-2024',
        full_name: 'Rosa Martínez',
        died_date: '2024-07-19',
        owner_id: TEST_USER_ID,
        life_story: 'Something to remove.',
      }),
    );
    await supabase.signIn();
    await page.goto('/m/rosa-martinez-2024');
    const drawer = await openStory(page);
    await drawer.getByRole('button', { name: 'Edit the life story' }).click();
    const field = drawer.getByLabel('Life story');
    await expect(field).toHaveValue('Something to remove.');
    await field.fill('a'.repeat(10001));
    await drawer.getByRole('button', { name: 'Save' }).click();
    await expect(drawer.getByText('The life story can be up to 10000 characters.')).toBeVisible();
    expect(supabase.calls.some((call) => call.method === 'PATCH')).toBe(false);

    await field.fill('   ');
    await drawer.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Life story saved.')).toBeVisible();
    await expect(
      drawer.getByText('Tell visitors who Rosa Martínez was', { exact: false }),
    ).toBeVisible();
    expect(supabase.calls.find((call) => call.method === 'PATCH')?.body).toEqual({
      life_story: null,
    });
  });
});
