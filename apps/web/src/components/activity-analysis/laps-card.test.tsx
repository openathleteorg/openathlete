// @vitest-environment jsdom
import { act } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ActivityEvent,
  ActivitySegment,
  EVENT_TYPE,
  SPORT_TYPE,
  WORKOUT_DURATION_TYPE,
  WORKOUT_STEP_TYPE,
  WORKOUT_TARGET_TYPE,
  WorkoutStep,
} from '@openathlete/shared';

import { ActivityDetailsSelectionProvider } from '../event-details/activity-details-selection-context';
import { LapOptions } from './laps';
import { LapsCard } from './laps-card';
import { PlanBanner } from './plan-banner';

// Every message renders as its key, followed by its parameters
// Rendered without the app's query client: the user reads metric units
vi.mock('@/hooks/use-units', async () => {
  const { unitsFor } = await import('@/utils/units');
  return { useUnits: () => unitsFor('METRIC') };
});

vi.mock('@/paraglide/messages', () => ({
  m: new Proxy(
    {},
    {
      get: (_target, key) => (params?: Record<string, unknown>) =>
        [String(key), ...Object.values(params ?? {})].join(' '),
    },
  ),
}));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const range = <T,>(n: number, f: (i: number) => T): T[] =>
  Array.from({ length: n }, (_, i) => f(i));

const step = (
  stepType: WORKOUT_STEP_TYPE,
  seconds: number,
  orderIndex: number,
  targets: WorkoutStep['targets'] = [],
) =>
  ({
    stepType,
    orderIndex,
    durationType: WORKOUT_DURATION_TYPE.TIME,
    durationValue: seconds,
    targets,
  }) as WorkoutStep;

// 5 min easy then 5 min hard at 3 m/s; the plan wanted 160-170 bpm for the
// hard part, done at 175
const stream = {
  time: range(61, (i) => i * 10),
  distance: range(61, (i) => i * 30),
  heartrate: range(61, (i) => (i < 30 ? 130 : 175)),
};
const workout = {
  steps: [
    step(WORKOUT_STEP_TYPE.WARMUP, 300, 0),
    step(WORKOUT_STEP_TYPE.INTERVAL_ACTIVE, 300, 1, [
      {
        targetType: WORKOUT_TARGET_TYPE.HEARTRATE,
        targetMin: 160,
        targetMax: 170,
        targetValue: null,
        metricType: null,
      } as WorkoutStep['targets'][number],
    ]),
  ],
};
const laps = [0, 300].map(
  (start, i) =>
    ({
      activitySegmentId: i,
      segmentType: 'LAP',
      startTimeSeconds: start,
      endTimeSeconds: start + 300,
    }) as ActivitySegment,
);
const options: LapOptions = {
  stream,
  sport: SPORT_TYPE.RUNNING,
  laps,
  workout,
  splitMeters: 1000,
  metrics: {},
  zones: [],
  cadenceFactor: 2,
};
const event = {
  eventId: 9,
  type: EVENT_TYPE.ACTIVITY,
  sport: SPORT_TYPE.RUNNING,
  movingTime: 630,
  distance: 1800,
  plannedSession: {
    type: EVENT_TYPE.TRAINING,
    eventId: 8,
    name: 'Threshold',
    goalDuration: 600,
    goalDistance: null,
    workout,
  },
} as unknown as ActivityEvent;

describe('LapsCard and PlanBanner', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    act(() =>
      root.render(
        <ActivityDetailsSelectionProvider
          fullDomain={[0, 1800]}
          xAxis="distance"
          onXAxisChange={() => {}}
        >
          <PlanBanner event={event} options={options} />
          <LapsCard event={event} options={options} />
        </ActivityDetailsSelectionProvider>,
      ),
    );
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const rows = () => [...container.querySelectorAll('[data-lap-row]')];
  const button = (label: string) =>
    [...container.querySelectorAll('button')].find((b) =>
      b.textContent?.startsWith(label),
    )!;

  it('grades the session and its work steps', () => {
    const banner = container.querySelector('[data-plan-banner]')!;
    // 630 s done for 600 planned: within 20%
    expect(banner.getAttribute('data-plan-banner')).toBe('complete');
    expect(banner.textContent).toContain('activity_plan_title Threshold');
    expect(banner.textContent).toContain('activity_plan_steps_on_target 0 1');
  });

  it('shows the plan first, with each step against its target', () => {
    expect(
      container
        .querySelector('[data-laps-card]')!
        .getAttribute('data-laps-card'),
    ).toBe('plan');
    expect(rows()).toHaveLength(2);
    const work = container.querySelector('[data-step-compliance]')!;
    // 175 is within 5% of 170
    expect(work.getAttribute('data-step-compliance')).toBe('near');
    expect(work.textContent).toContain('160–170 bpm');
    expect(work.textContent).toContain('175');
  });

  it('keeps only the work steps on request', () => {
    act(() =>
      container.querySelector<HTMLButtonElement>('[role="switch"]')!.click(),
    );
    expect(rows()).toHaveLength(1);
  });

  it('switches to the watch laps, a single split being no table', () => {
    act(() => button('activity_laps_source_device').click());
    expect(
      container
        .querySelector('[data-laps-card]')!
        .getAttribute('data-laps-card'),
    ).toBe('device');
    // 1.8 km makes one whole kilometre: not worth a source
    expect(button('activity_laps_source_splits')).toBeUndefined();
  });

  it('selects a row on the charts', () => {
    act(() => (rows()[1] as HTMLElement).click());
    expect(rows()[1].getAttribute('data-state')).toBe('selected');
    expect(rows()[0].getAttribute('data-state')).toBeNull();
  });
});
