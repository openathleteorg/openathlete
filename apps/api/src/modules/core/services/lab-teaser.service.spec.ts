import {
  BestRecordDto,
  RECORD_TYPE,
  SPORT_TYPE,
  StatisticsCardiacCostDto,
  StatisticsTerrainDto,
} from '@openathlete/shared';

import { AuthUser } from 'src/modules/auth/decorators/user.decorator';

import { LabTeaserService } from './lab-teaser.service';
import { RecordService } from './record.service';
import { StatisticsService } from './statistics.service';

const user = { userId: 1 } as AuthUser;
const now = new Date('2026-11-20T12:00:00Z');

const bin = (slope: number, median: number) => ({
  bin: slope,
  low: median * 0.9,
  median,
  high: median * 1.1,
  count: 6,
});
const terrain = (climb: number, descent: number): StatisticsTerrainDto => ({
  bins: [bin(10, climb), bin(-10, descent)],
  classes: [],
});
const cost = (heartrate: number): StatisticsCardiacCostDto => ({
  unit: 'speed',
  bins: [bin(12, heartrate)],
});

/** Best times over 3 to 20 minutes at a steady speed (m/s) */
const records = (speed: number): BestRecordDto[] =>
  [1000, 1500, 2000, 3000].map((distance, index) => ({
    recordId: index,
    type: RECORD_TYPE.SPEED,
    distance,
    duration: null,
    value: distance / (speed * (1 - index * 0.03)),
    date: now,
    eventId: null,
    activityName: null,
  }));

function service({
  recent,
  before,
}: {
  recent: { climb: number; descent: number; hr: number; speed: number };
  before: { climb: number; descent: number; hr: number; speed: number };
}) {
  // The recent year is asked first, the year before second
  const isRecent = (query: { to: Date }) =>
    query.to.getTime() === now.getTime();
  const statistics = {
    getTerrain: jest.fn(async (_user: AuthUser, query: { to: Date }) => {
      const side = isRecent(query) ? recent : before;
      return terrain(side.climb, side.descent);
    }),
    getCardiacCost: jest.fn(async (_user: AuthUser, query: { to: Date }) =>
      cost(isRecent(query) ? recent.hr : before.hr),
    ),
  } as unknown as StatisticsService;
  const recordService = {
    getRecords: jest.fn(async (_user: AuthUser, query: { to: Date }) =>
      records(isRecent(query) ? recent.speed : before.speed),
    ),
  } as unknown as RecordService;
  return new LabTeaserService(statistics, recordService);
}

const teaser = (labTeaser: LabTeaserService) =>
  labTeaser.teaser(user, { athleteId: 3, sport: SPORT_TYPE.RUNNING }, now);

describe('LabTeaserService', () => {
  it('quotes the capacity that progressed the most over a year', async () => {
    const result = await teaser(
      service({
        recent: { climb: 660, descent: 900, hr: 150, speed: 4.4 },
        before: { climb: 600, descent: 890, hr: 152, speed: 4.0 },
      }),
    );
    expect(result).toMatchObject({ axis: 'critical', unit: 'speed' });
    expect(result?.change).toBeGreaterThan(10);
  });

  it('reads a lower heart rate as progress of the cardiac cost', async () => {
    const result = await teaser(
      service({
        recent: { climb: 600, descent: 890, hr: 130, speed: 4.0 },
        before: { climb: 600, descent: 890, hr: 150, speed: 4.0 },
      }),
    );
    expect(result).toMatchObject({ axis: 'cost', reference: 12 });
    expect(result?.change).toBeCloseTo(13.33, 1);
  });

  it('shows nothing when no capacity progressed', async () => {
    const same = { climb: 600, descent: 890, hr: 150, speed: 4.0 };
    await expect(
      teaser(service({ recent: same, before: { ...same, climb: 650 } })),
    ).resolves.toBeNull();
  });
});
