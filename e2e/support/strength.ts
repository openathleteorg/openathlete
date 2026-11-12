import { type APIRequestContext, expect } from '@playwright/test';

import { type TestAthlete, apiHeaders } from './api';
import { API_URL } from './env';

const lift = (ref: string, name: string, reps: number, load?: number) => ({
  stepType: 'INTERVAL_ACTIVE',
  name,
  exerciseRef: ref,
  durationType: 'REPS',
  durationValue: reps,
  targets: load ? [{ targetType: 'WEIGHT', targetValue: load }] : [],
});
const rest = (seconds: number) => ({
  stepType: 'INTERVAL_REST',
  durationType: 'TIME',
  durationValue: seconds,
  targets: [],
});

/**
 * A strength session planned today, as the strength builder stores it:
 * 2 sets of squats with their rest, then a superset of 2 rounds.
 */
export async function planStrengthSession(
  request: APIRequestContext,
  athlete: TestAthlete,
  name = 'Leg day',
) {
  const start = new Date();
  start.setUTCHours(17, 0, 0, 0);
  const response = await request.post(`${API_URL}/event`, {
    headers: apiHeaders(undefined, athlete.accessToken),
    data: {
      type: 'TRAINING',
      name,
      sport: 'STRENGTH',
      description: '',
      startDate: start,
      endDate: new Date(start.getTime() + 3600_000),
      workout: {
        steps: [
          {
            stepType: 'REPEAT',
            durationType: 'OPEN',
            targets: [],
            repeatBlock: {
              repetitions: 2,
              kind: 'REPEAT',
              childSteps: [
                lift('c:barbell-full-squat', 'Barbell full squat', 5, 80),
                rest(90),
              ],
            },
          },
          {
            stepType: 'REPEAT',
            durationType: 'OPEN',
            targets: [],
            repeatBlock: {
              repetitions: 2,
              kind: 'SUPERSET',
              childSteps: [
                lift('c:pull-up', 'Pull-up', 8),
                lift('c:push-up', 'Push-up', 15),
                rest(60),
              ],
            },
          },
        ],
      },
    },
  });
  expect(response.status(), await response.text()).toBe(201);
  return (await response.json()) as { eventId: number };
}
