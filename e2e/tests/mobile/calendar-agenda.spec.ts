import { expect, test } from '@playwright/test';

test('the agenda plans on the day picked in the week strip', async ({
  page,
}) => {
  await page.goto('/dashboard/calendar?view=month');

  const strip = page.locator('[data-calendar-week-strip]');
  await expect(strip.getByRole('button')).toHaveCount(7);

  await page.locator('[data-calendar-plan-trigger]').tap();
  // A sheet from the bottom edge of the screen, not a floating menu
  const sheet = page.getByRole('menu');
  await expect(sheet).toBeVisible();
  const viewport = page.viewportSize();
  expect((await sheet.boundingBox())?.width).toBe(viewport?.width);
  // Once it has finished sliding up
  await expect
    .poll(async () => {
      const box = await sheet.boundingBox();
      return Math.round((box?.y ?? 0) + (box?.height ?? 0));
    })
    .toBe(viewport?.height);

  await page.getByRole('menuitem', { name: 'Plan a training' }).tap();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('view options open as a sheet and close again', async ({ page }) => {
  await page.goto('/dashboard/calendar?view=month');

  await page.locator('[data-calendar-options]').tap();
  const sheet = page.getByRole('dialog');
  await expect(sheet).toHaveAttribute('data-sheet', 'bottom');

  await sheet.getByRole('button', { name: 'Close' }).tap();
  await expect(sheet).toHaveCount(0);
});
