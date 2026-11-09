import { expect, test } from '@playwright/test';

// Reaching a month years back used to take one click per month
test('the calendar jumps to a month years back in two clicks', async ({
  page,
}) => {
  await page.goto('/dashboard/calendar?view=month');

  await page.getByRole('button', { name: 'Go to a date' }).click();
  await page.getByRole('button', { name: 'Choose a year' }).click();
  // The page of years holding the current one may not reach 2020
  const year = page.getByRole('button', { name: '2020', exact: true });
  while (!(await year.isVisible())) {
    await page.getByRole('button', { name: 'Earlier years' }).click();
  }
  await year.click();
  await page.getByRole('button', { name: 'March 2020' }).click();

  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'March 2020',
  );
});

test('the statistics pick a calendar year directly', async ({ page }) => {
  const lastYear = new Date().getFullYear() - 1;
  await page.goto('/dashboard/statistics?period=year');

  await page.getByRole('combobox', { name: 'Year' }).click();
  await page.getByRole('option', { name: String(lastYear) }).click();

  await expect(page).toHaveURL(/offset=-1/);
  await expect(page.getByRole('combobox', { name: 'Year' })).toHaveText(
    String(lastYear),
  );
});
