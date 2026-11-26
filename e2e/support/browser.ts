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
      const recordKey = `auth_record:${owner}`;
      const existingOwner = localStorage.getItem('auth_session');
      const existingRecord = existingOwner
        ? localStorage.getItem(`auth_record:${existingOwner}`)
        : null;
      let sameLogin = false;
      if (existingRecord) {
        try {
          const record = JSON.parse(existingRecord) as {
            accessToken?: unknown;
            refreshToken?: unknown;
          };
          // Calling signIn again for the same login must not churn its
          // generation; a different requested account replaces the shared
          // AUTH_FILE session explicitly.
          sameLogin =
            record.accessToken === accessToken &&
            record.refreshToken === refreshToken;
        } catch {
          sameLogin = false;
        }
      }
      if (!sameLogin) {
        // The storage state a project starts from may belong to another
        // account. Remove its credentials instead of leaving them behind
        // unreferenced when the test asks for this one.
        if (existingOwner && existingOwner !== owner) {
          localStorage.removeItem(`auth_record:${existingOwner}`);
          localStorage.removeItem(`auth_revoked:${existingOwner}`);
        }
        localStorage.removeItem(`auth_revoked:${owner}`);
        localStorage.setItem(
          recordKey,
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
 * signed in as them. Each page has its own storage, so this never switches
 * the first page's account.
 */
export async function pageAs(browser: Browser, user: TestAthlete) {
  const page = await browser.newPage({
    baseURL: test.info().project.use.baseURL,
  });
  await signIn(page, user);
  return page;
}
