import { expect, test } from '@playwright/test';

import {
  ERROR_BOUNDARY_TEXT,
  trackPageProblems,
} from '../../support/page-health';

const PAGES = [
  'calendar',
  'statistics',
  'records',
  'metrics',
  'settings',
  'messages',
];

for (const name of PAGES) {
  test(`/dashboard/${name} renders without errors`, async ({ page }) => {
    const problems = trackPageProblems(page);

    await page.goto(`/dashboard/${name}`);
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(new RegExp(`/dashboard/${name}`));
    await expect(page.locator('body')).not.toHaveText(ERROR_BOUNDARY_TEXT);
    expect(problems).toEqual([]);
  });
}
