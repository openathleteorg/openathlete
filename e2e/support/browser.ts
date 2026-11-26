import { type Browser, type Page, test } from '@playwright/test';

import type { TestAthlete } from './api';

/**
 * Logs the page in as the athlete with the tokens the API returned, before
 * any app script runs. Only tests about the login form go through it:
 * browser logins share the runner's IP and its 10 logins per minute.
 */
export async function signIn(page: Page, athlete: TestAthlete) {
  await page.addInitScript(
    ({ accessToken, refreshToken }) => {
      // Same layout as utils/auth-attempt: the shared key names the owner and
      // the credentials live in that owner's record. The legacy keys are no
      // longer read, so a legacy-only seed would land on the login page.
      const owner = 'e2e-owner';
      if (!localStorage.getItem('auth_session')) {
        localStorage.setItem(
          `auth_record:${owner}`,
          JSON.stringify({
            owner,
            generation: 'e2e-generation',
            accessToken,
            refreshToken,
          }),
        );
        localStorage.setItem('auth_session', owner);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    },
    { accessToken: athlete.accessToken, refreshToken: athlete.refreshToken },
  );
}

/**
 * A second person in the same test: a page of its own browser context,
 * signed in as them. signIn only fills an empty session, so it cannot
 * switch the first page to another account.
 */
export async function pageAs(browser: Browser, user: TestAthlete) {
  const page = await browser.newPage({
    baseURL: test.info().project.use.baseURL,
  });
  await signIn(page, user);
  return page;
}
