import { type Page, expect, test } from '@playwright/test';

// The E2E stack runs like a self-hosted instance: no Stripe, so no feature
// is locked, and nothing mentions Supporter perks (rule 1 of FEATURES)

const PAGES = [
  '/dashboard/statistics',
  '/dashboard/statistics?view=capacities',
  '/dashboard/statistics?view=trends',
  '/dashboard/statistics?compare=previous',
  '/dashboard/records',
];

async function expectNoLock(page: Page) {
  await page.waitForLoadState('networkidle');
  await expect(page.locator('[data-supporter-lock]')).toHaveCount(0);
  await expect(page.locator('[data-locked-feature]')).toHaveCount(0);
  await expect(page.locator('[data-lab-preview]')).toHaveCount(0);
  await expect(page.locator('[data-early-access]')).toHaveCount(0);
}

test('an instance without Stripe locks no feature', async ({ page }) => {
  const current = page.waitForResponse((response) =>
    response.url().includes('/subscription/current'),
  );
  await page.goto('/dashboard/statistics');
  const subscription = (await (await current).json()) as {
    billingEnabled: boolean;
    features: Record<string, { available: boolean; reason: string }>;
  };
  expect(subscription.billingEnabled).toBe(false);
  for (const access of Object.values(subscription.features)) {
    expect(access).toMatchObject({ available: true, reason: 'free' });
  }

  for (const path of PAGES) {
    await page.goto(path);
    await expectNoLock(page);
  }

  // The Lab views are there, without a lock
  await page.goto('/dashboard/statistics');
  const tabs = page.getByRole('tablist').first().getByRole('tab');
  await expect(tabs).toHaveCount(5);
});
