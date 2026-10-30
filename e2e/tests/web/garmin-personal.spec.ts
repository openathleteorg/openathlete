import { expect, test } from '@playwright/test';

for (const initial of ['queued', 'running'] as const) {
  test(`locks Personal API preferences while ${initial} and unlocks after completion`, async ({
    page,
  }) => {
    let status: 'queued' | 'running' | 'completed' = initial;
    let preferenceWrites = 0;
    let preferences = { activities: true, automatic: false };
    // Exercise the web flow without Garmin credentials or external requests.
    await page.route('**/api/instance', async (route) => {
      const response = await route.fetch();
      await route.fulfill({
        response,
        json: { ...(await response.json()), garminPersonalApi: true },
      });
    });
    await page.route('**/api/provider/garmin-personal', async (route) => {
      if (route.request().method() === 'PATCH') {
        preferenceWrites++;
        preferences = route.request().postDataJSON();
      }
      const body = {
        connected: true,
        preferences,
        status,
        error: null,
        lastSyncedAt: null,
        result:
          status === 'completed'
            ? {
                imported: 0,
                matched: 0,
                skipped: 1,
                failed: 0,
                needsReview: 0,
                pending: 0,
                truncated: false,
              }
            : null,
      };
      await route.fulfill({ json: body });
    });
    await page.goto('/dashboard/settings?tab=connectors');
    const activities = page.locator('#garmin-personal-activities');
    const automatic = page.locator('#garmin-personal-automatic');
    await expect(activities).toBeDisabled();
    await expect(automatic).toBeDisabled();
    await expect(
      page.getByText(
        'Preferences cannot be changed while an import is queued or running.',
      ),
    ).toBeVisible();
    await activities.evaluate((element: HTMLButtonElement) => element.click());
    expect(preferenceWrites).toBe(0);
    await expect(
      page.getByRole('button', {
        name: 'Remove key and disconnect',
        exact: true,
      }),
    ).toBeEnabled();
    status = 'completed';
    await expect(activities).toBeEnabled({ timeout: 10000 });
    await expect(automatic).toBeEnabled();
    await expect(
      page.getByText('Unsupported files skipped: 1.', { exact: false }),
    ).toBeVisible();
    await automatic.click();
    await expect.poll(() => preferenceWrites).toBe(1);
    await expect(automatic).toBeChecked();
    expect(preferences).toEqual({ activities: true, automatic: true });
  });
}
