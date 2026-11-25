import { SPORT_TYPE } from '@openathlete/shared';

import {
  CalendarEvent,
  GARMIN_ATTRIBUTION,
  activitySource,
  speedFields,
  toCalendarItem,
} from './presenters';

describe('speedFields', () => {
  it('gives runners a pace per km', () => {
    expect(speedFields(SPORT_TYPE.RUNNING, 1000 / 270)).toEqual({
      avgPace: '4:30/km',
    });
  });

  it('gives swimmers a pace per 100 m and rowers per 500 m', () => {
    expect(speedFields(SPORT_TYPE.SWIMMING, 1)).toEqual({
      avgPace: '1:40/100m',
    });
    expect(speedFields(SPORT_TYPE.ROWING, 500 / 115)).toEqual({
      avgPace: '1:55/500m',
    });
  });

  it('gives cyclists a speed and skips missing values', () => {
    expect(speedFields(SPORT_TYPE.CYCLING, 10)).toEqual({ avgSpeedKmh: 36 });
    expect(speedFields(SPORT_TYPE.RUNNING, 0)).toEqual({});
  });
});

describe('activitySource', () => {
  it("names Garmin and the device, as Garmin's attribution requires", () => {
    expect(activitySource('GARMIN', 'Forerunner 965')).toBe(
      'Garmin Forerunner 965',
    );
    expect(activitySource('GARMIN', null)).toBe('Garmin');
  });

  it('leaves other sources unlabelled', () => {
    expect(activitySource('STRAVA', 'Forerunner 965')).toBeUndefined();
    expect(activitySource(null, null)).toBeUndefined();
  });
});

describe('toCalendarItem attribution', () => {
  const activityEvent = (provider: string | null, deviceName: string | null) =>
    ({
      eventId: 1,
      type: 'ACTIVITY',
      name: 'Morning run',
      startDate: new Date('2026-01-01T08:00:00Z'),
      seriesId: null,
      activity: {
        sport: SPORT_TYPE.RUNNING,
        description: null,
        movingTime: 3600,
        distance: 10000,
        averageSpeed: 2.8,
        provider,
        deviceName,
        trainingLoadEntries: [],
      },
    }) as unknown as CalendarEvent;

  const item = (event: CalendarEvent) =>
    toCalendarItem(event, 'UTC', '2026-01-02', new Map());

  it('gives a Garmin activity its source and the attribution notice', () => {
    expect(item(activityEvent('GARMIN', 'Forerunner 965'))).toMatchObject({
      source: 'Garmin Forerunner 965',
      attribution: GARMIN_ATTRIBUTION,
    });
  });

  it('gives other activities neither', () => {
    for (const event of [
      activityEvent('STRAVA', 'Forerunner 965'),
      activityEvent(null, null),
    ]) {
      const result = item(event);
      expect(result).not.toHaveProperty('source');
      expect(result).not.toHaveProperty('attribution');
    }
  });
});
