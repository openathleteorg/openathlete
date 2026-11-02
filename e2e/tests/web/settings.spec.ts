import { expect, test } from '@playwright/test';

const TABS = [
  'connectors',
  'profile',
  'equipment',
  'training_zones',
  'ai',
  'agents',
  'coaches',
  'invitations',
  'contribute',
];

test('settings pages open from the sidebar', async ({ page }) => {
  await page.goto('/dashboard/settings');
  const sidebar = page.getByRole('navigation', { name: 'Settings' });
  await expect(sidebar.locator('[aria-current="page"]')).toHaveText(
    'Connectors',
  );

  await sidebar.getByRole('link', { name: 'Equipment' }).click();
  await expect(page).toHaveURL(/tab=equipment/);
  await expect(page.getByRole('heading', { name: 'Equipment' })).toBeVisible();
  await expect(sidebar.locator('[aria-current="page"]')).toHaveText(
    'Equipment',
  );

  await sidebar.getByRole('link', { name: /Edit my profile/ }).click();
  await expect(page).toHaveURL(/tab=profile/);
  await expect(page.getByLabel('First Name')).toBeVisible();
});

test('a narrow window lists the settings above the page', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1100 });
  await page.goto('/dashboard/settings?tab=profile');
  const strip = page.getByRole('navigation', { name: 'Settings' });
  await expect(strip.locator('[aria-current="page"]')).toHaveText('Profile');

  await strip.getByRole('link', { name: 'Contribute' }).click();
  await expect(page).toHaveURL(/tab=contribute/);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBe(0);
});

test('no settings page stacks a card in a card', async ({ page }) => {
  for (const tab of TABS) {
    await page.goto(`/dashboard/settings?tab=${tab}`);
    await expect(page.locator('main h1')).toBeVisible();
    await expect(
      page.locator('[data-slot="card"] [data-slot="card"]'),
    ).toHaveCount(0);
  }
});
