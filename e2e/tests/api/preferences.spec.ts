import { expect, test } from '@playwright/test';

import { apiHeaders, createAthlete } from '../../support/api';
import { API_URL } from '../../support/env';

test('keeps display preferences with the account', async ({ request }) => {
  const athlete = await createAthlete(request);
  const headers = apiHeaders(undefined, athlete.accessToken);
  const getMe = async () =>
    (await request.get(`${API_URL}/user/me`, { headers })).json();

  expect((await getMe()).supportReminderDismissedAt).toBeNull();

  const updated = await request.patch(`${API_URL}/user`, {
    headers,
    data: {
      calendarDisplay: { view: 'season', seasonMonths: 12, coloredBy: 'RPE' },
      hiddenActivityTracks: { RUNNING: ['altitude'] },
      supportReminderDismissed: true,
    },
  });
  expect(updated.ok(), await updated.text()).toBe(true);

  const me = await getMe();
  expect(me.calendarDisplay).toMatchObject({
    view: 'season',
    seasonMonths: 12,
    coloredBy: 'RPE',
  });
  expect(me.hiddenActivityTracks).toEqual({ RUNNING: ['altitude'] });
  expect(me.supportReminderDismissedAt).not.toBeNull();

  const refused = await request.patch(`${API_URL}/user`, {
    headers,
    data: { hiddenActivityTracks: { SWIMMING_ON_THE_MOON: [] } },
  });
  expect(refused.status()).toBe(400);
});

test('keeps vouched record suspects with the athlete', async ({ request }) => {
  const athlete = await createAthlete(request);
  const headers = apiHeaders(undefined, athlete.accessToken);
  const { athleteId } = await (
    await request.get(`${API_URL}/athlete/me`, { headers })
  ).json();
  const url = `${API_URL}/athlete/${athleteId}/settings`;

  const before = await (await request.get(url, { headers })).json();
  expect(before.dismissedRecordSuspects).toEqual([]);

  await request.patch(url, {
    headers,
    data: { dismissedRecordSuspects: [12, 12, 34] },
  });

  const after = await (await request.get(url, { headers })).json();
  expect(after.dismissedRecordSuspects).toEqual([12, 34]);
});
