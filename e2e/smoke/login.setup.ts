import { expect, test as setup } from '@playwright/test';

import { AUTH_FILE } from './playwright.config';

// The dedicated smoke account signs in through the real form, once per run;
// the other checks reuse its session.
setup('the smoke account signs in', async ({ page }) => {
  const email = process.env.SMOKE_EMAIL;
  const password = process.env.SMOKE_PASSWORD;
  if (!email || !password) {
    throw new Error('SMOKE_EMAIL and SMOKE_PASSWORD are required');
  }

  await page.goto('/auth/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });

  await page.context().storageState({ path: AUTH_FILE });
});
