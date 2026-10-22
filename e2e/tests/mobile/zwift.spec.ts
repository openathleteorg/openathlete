import { expect, test } from '@playwright/test';

// Exercise the production UI at iPhone width. Only the native bridge and server are
// simulated: no real Zwift credentials, external requests or user accounts are used.
test('connects Zwift in settings and sends today’s planned workout from Sync', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    const payload = btoa(
      JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }),
    );
    localStorage.setItem('access_token', `test.${payload}.test`);
    localStorage.setItem('current_space', 'ATHLETE');
    localStorage.setItem(
      'openathlete_mobile_server_url',
      'https://training.example.org',
    );
    (
      window as unknown as { CapacitorCustomPlatform: unknown }
    ).CapacitorCustomPlatform = { name: 'ios' };
    const methods = ['status', 'connect', 'disconnect', 'upload'];
    let connected = false;
    (window as unknown as { Capacitor: unknown }).Capacitor = {
      getPlatform: () => 'ios',
      isNativePlatform: () => true,
      PluginHeaders: [
        {
          name: 'OpenAthleteZwift',
          methods: methods.map((name) => ({ name, rtype: 'promise' })),
        },
      ],
      nativePromise: async (
        plugin: string,
        method: string,
        options: { eventID?: number; xml?: string },
      ) => {
        if (plugin !== 'OpenAthleteZwift')
          throw new Error('Plugin unavailable');
        if (method === 'connect') connected = true;
        if (method === 'disconnect') connected = false;
        if (method === 'upload') {
          if (
            options.eventID !== 9 ||
            !options.xml?.includes('FreeRide Duration="120"')
          )
            throw new Error('Invalid workout');
          return { verified: true };
        }
        return { connected };
      },
    };
  });
  const planned = {
    eventId: 9,
    athleteId: 17,
    type: 'TRAINING',
    sport: 'CYCLING',
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    name: 'Zwift test ride',
    description: '',
    workout: {
      steps: [
        {
          orderIndex: 0,
          stepType: 'FREE',
          durationType: 'TIME',
          durationValue: 120,
          targets: [],
        },
      ],
    },
  };
  let stravaRequests = 0;
  let stravaStatusRequests = 0;
  await page.route('https://training.example.org/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/provider/strava/sync')) {
      expect(route.request().method()).toBe('POST');
      stravaRequests++;
      await route.fulfill({
        status: 202,
        json: { success: true, queued: true, syncId: '12' },
      });
      return;
    }
    if (path.endsWith('/provider/strava/sync/12')) {
      stravaStatusRequests++;
      await route.fulfill({
        json: {
          state: stravaStatusRequests === 1 ? 'running' : 'completed',
          total: 1,
          imported: stravaStatusRequests === 1 ? 0 : 1,
          pending: stravaStatusRequests === 1 ? 1 : 0,
          needsReview: 0,
          failed: 0,
          retrying: false,
        },
      });
      return;
    }
    if (path.endsWith('/provider/connected')) {
      await route.fulfill({
        json: [
          {
            provider: 'STRAVA',
            status: 'active',
            importActivitiesEnabled: true,
          },
        ],
      });
      return;
    }
    if (path.endsWith('/ai/access')) {
      await route.fulfill({
        json: {
          tasks: Object.fromEntries(
            [
              'EVENT_GENERATION',
              'EVENT_MODIFICATION',
              'POST_ACTIVITY_QUESTIONS',
              'FEEDBACK_EXTRACTION',
              'TRAINING_LOAD_ESTIMATION',
            ].map((task) => [task, { available: false }]),
          ),
        },
      });
      return;
    }
    const body = path.endsWith('/user/me')
      ? {
          userId: 42,
          firstName: 'Test',
          lastName: 'Athlete',
          email: 'test@example.org',
          roles: ['ATHLETE'],
          language: 'EN',
          timeZone: 'Europe/Berlin',
          onboardingCompleted: true,
        }
      : path.endsWith('/instance')
        ? { providers: [], billingEnabled: false, features: {} }
        : path.endsWith('/athlete/me')
          ? { athleteId: 17, trainingZones: [] }
          : path.endsWith('/event/9')
            ? planned
            : path.endsWith('/event')
              ? [planned]
              : path.endsWith('/metric/latest')
                ? {}
                : path.includes('subscription')
                  ? { billingEnabled: false }
                  : [];
    await route.fulfill({ json: body });
  });
  await page.goto('/');
  await page.waitForFunction(() =>
    document.querySelector('[data-sidebar="trigger"]'),
  );
  await page.evaluate(() => {
    window.history.pushState({}, '', '/dashboard/settings?tab=connectors');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await page.getByLabel('Zwift email').fill('test@example.org');
  await page.getByLabel('Zwift password').fill('fake-test-password');
  await page
    .getByRole('button', { name: 'Connect Zwift', exact: true })
    .click();
  await expect(
    page.getByText('Connected on this iPhone', { exact: true }),
  ).toBeVisible();
  await page.evaluate(() => {
    window.history.pushState({}, '', '/dashboard/sync');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await expect(
    page.getByText('Zwift test ride', { exact: true }),
  ).toBeVisible();
  expect(stravaRequests).toBe(0);
  await page
    .getByRole('button', { name: 'Sync Strava now', exact: true })
    .click();
  await expect(
    page.getByText('Checking Strava and importing missing activities…', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText('Activities imported or linked to existing training: 1.', {
      exact: true,
    }),
  ).toBeVisible();
  expect(stravaRequests).toBe(1);
  expect(stravaStatusRequests).toBeGreaterThanOrEqual(2);
  await page
    .getByRole('button', { name: 'Send to Zwift', exact: true })
    .click();
  await expect(
    page.getByText(/Uploaded and file contents verified/),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(() => {
    window.history.pushState({}, '', '/dashboard/calendar?view=week');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await page.locator('.calendar-event', { hasText: 'Zwift test ride' }).click();
  const details = page.getByRole('dialog');
  await details
    .getByRole('button', { name: 'Send to Zwift', exact: true })
    .click();
  await expect(
    details.getByText(/Uploaded and file contents verified/),
  ).toBeVisible();
});
