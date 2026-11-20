import { expect, test } from '@playwright/test';

// Self-hosted (no Stripe): the phone layout shows every view, no lock
test('an instance without Stripe locks nothing on a phone', async ({
  page,
}) => {
  for (const path of [
    '/dashboard/statistics',
    '/dashboard/statistics?view=capacities',
    '/dashboard/records',
  ]) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-supporter-lock]')).toHaveCount(0);
    await expect(page.locator('[data-locked-feature]')).toHaveCount(0);
  }
  await page.goto('/dashboard/statistics');
  await expect(page.getByRole('tablist').first().getByRole('tab')).toHaveCount(
    5,
  );
});
