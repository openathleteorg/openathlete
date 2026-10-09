import { type Page, expect, test } from '@playwright/test';

// Planning a session must not depend on knowing the right click
async function emptyDay(page: Page) {
  await page.goto('/dashboard/calendar');
  // The last cell belongs to the next month and holds no event
  const day = page.locator('[data-calendar-day]').last();
  await expect(day).toBeVisible();
  return day;
}

test('a simple click on a day opens the planning menu', async ({ page }) => {
  const day = await emptyDay(page);
  const box = (await day.boundingBox())!;

  await day.click({ position: { x: box.width / 2, y: box.height - 12 } });
  await page.getByRole('menuitem', { name: 'Plan a training' }).click();

  await expect(page.getByRole('dialog')).toBeVisible();
});

test('each day has a plan button for the mouse and the keyboard', async ({
  page,
}) => {
  const day = await emptyDay(page);
  const plan = day.locator('[data-calendar-day-plan]');

  await day.hover();
  await expect(plan).toBeVisible();
  await plan.focus();
  await page.keyboard.press('Enter');

  await expect(
    page.getByRole('menuitem', { name: 'Plan a note' }),
  ).toBeVisible();
});

test('the calendar bar has a Plan button', async ({ page }) => {
  await page.goto('/dashboard/calendar');

  await page.locator('[data-calendar-header-plan]').click();
  await page.getByRole('menuitem', { name: 'Plan a competition' }).click();

  await expect(page.getByRole('dialog')).toBeVisible();
});

test('the right click keeps working', async ({ page }) => {
  const day = await emptyDay(page);

  await day.click({ button: 'right' });

  await expect(
    page.getByRole('menuitem', { name: 'Set a template' }),
  ).toBeVisible();
});

test('dragging across days still creates a cycle', async ({ page }) => {
  await page.goto('/dashboard/calendar');
  // Raw mouse moves do not wait for the loading overlay to go
  await page.waitForLoadState('networkidle');
  // Two days later in the same week, both on screen
  const days = page.locator('[data-calendar-day]');
  await days.nth(8).scrollIntoViewIfNeeded();
  const from = (await days.nth(8).boundingBox())!;
  const to = (await days.nth(10).boundingBox())!;

  await page.mouse.move(from.x + from.width / 2, from.y + from.height - 12);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height - 12, {
    steps: 8,
  });
  await page.mouse.up();

  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(
    page.getByRole('menuitem', { name: 'Plan a training' }),
  ).toHaveCount(0);
});

test('the keyboard moves through periods and views', async ({ page }) => {
  await page.goto('/dashboard/calendar?view=month');
  const title = page.getByRole('heading', { level: 1 });
  await expect(title).toBeVisible();
  const thisMonth = await title.textContent();

  await page.keyboard.press('ArrowRight');
  await expect(title).not.toHaveText(thisMonth!);
  await page.keyboard.press('t');
  await expect(title).toHaveText(thisMonth!);

  await page.keyboard.press('w');
  await expect(title).toContainText('week');
  await page.keyboard.press('?');
  await expect(
    page.getByRole('dialog', { name: 'Keyboard shortcuts' }),
  ).toBeVisible();
  // Its own keys win while it is open (the page behind is hidden from
  // assistive technologies, so check once it is closed)
  await page.keyboard.press('m');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(title).toContainText('week');
});
