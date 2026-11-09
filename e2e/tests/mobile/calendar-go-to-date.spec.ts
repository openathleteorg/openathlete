import { expect, test } from '@playwright/test';

test('the agenda jumps to a month years back', async ({ page }) => {
  await page.goto('/dashboard/calendar?view=month');

  await page.getByRole('button', { name: 'Go to a date' }).tap();
  await page.getByRole('button', { name: 'Choose a year' }).tap();
  const year = page.getByRole('button', { name: '2020', exact: true });
  while (!(await year.isVisible())) {
    await page.getByRole('button', { name: 'Earlier years' }).tap();
  }
  await year.tap();
  await page.getByRole('button', { name: 'March 2020' }).tap();

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    /march 2020/i,
  );
});
