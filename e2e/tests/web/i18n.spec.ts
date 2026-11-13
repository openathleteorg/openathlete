import { expect, test } from '@playwright/test';

import { WEB_URL } from '../../support/env';

// Paraglide reads the locale from its cookie before rendering
for (const [locale, calendar] of [
  ['en', 'Calendar'],
  ['fr', 'Calendrier'],
  ['it', 'Calendario'],
  ['es', 'Calendario'],
  ['pt-BR', 'Calendário'],
  ['de', 'Kalender'],
]) {
  test(`renders the dashboard in ${locale}`, async ({ page, context }) => {
    await context.addCookies([
      { name: 'OA_LOCALE', value: locale, url: WEB_URL },
    ]);

    await page.goto('/dashboard/calendar');

    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(
      page.getByText(calendar, { exact: true }).first(),
    ).toBeVisible();
  });
}

test.describe('signed out', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  // Another site under the same parent domain can leave a PARAGLIDE_LOCALE
  // cookie for every subdomain, listed before the app's own. A longer path
  // puts this one first the same way on localhost.
  test('switches the language despite a foreign locale cookie', async ({
    page,
    context,
  }) => {
    await context.addCookies([
      {
        name: 'PARAGLIDE_LOCALE',
        value: 'en',
        domain: new URL(WEB_URL).hostname,
        path: '/auth',
      },
    ]);
    await page.goto('/auth/login');

    await page.getByRole('button', { name: 'Switch language' }).click();
    await page.getByRole('menuitem', { name: /Français/ }).click();

    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  });

  test('keeps the language chosen before the cookie was renamed', async ({
    page,
    context,
  }) => {
    await context.addCookies([
      { name: 'PARAGLIDE_LOCALE', value: 'it', url: WEB_URL },
    ]);
    await page.goto('/auth/login');
    await expect(page.locator('html')).toHaveAttribute('lang', 'it');
  });
});
