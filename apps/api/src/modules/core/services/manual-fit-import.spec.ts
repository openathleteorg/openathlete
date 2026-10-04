import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  PayloadTooLargeException,
} from '@nestjs/common';

import { AuthUser } from '../../auth/decorators/user.decorator';
import { PrismaService } from '../../prisma/services/prisma.service';
import { QueueService } from '../../queue/queue.service';
import { uncompressActivityStream } from '../helpers/activity-stream';
import {
  MAX_MANUAL_FIT_BYTES,
  prepareManualFit,
} from '../helpers/manual-fit-import';
import { FitParserStrategy } from '../helpers/strategies/fit-parser.strategy';
import { ManualFitImportService } from './manual-fit-import.service';

jest.mock('@garmin/fitsdk', () => {
  const sdk = process.getBuiltinModule('module').createRequire(__filename)(
    '@garmin/fitsdk',
  );
  // Native ESM runs outside Jest's VM. Normalize Date objects into the test
  // realm so the production parser's instanceof Date checks behave as in Node.
  class Decoder extends sdk.Decoder {
    read(options: unknown) {
      const result = super.read(options);
      for (const messages of Object.values(result.messages ?? {})) {
        if (!Array.isArray(messages)) continue;
        for (const message of messages) {
          for (const [key, value] of Object.entries(message)) {
            if (Object.prototype.toString.call(value) === '[object Date]') {
              message[key] = new Date((value as Date).getTime());
            }
          }
        }
      }
      return result;
    }
  }
  return { ...sdk, Decoder };
});

// Synthetic FIT bytes are produced with the installed SDK; no athlete data.
const sdk = process.getBuiltinModule('module').createRequire(__filename)(
  '@garmin/fitsdk',
);
function fixture(
  options: {
    records?: boolean;
    sessions?: number;
    fileType?: string;
    partial?: boolean;
    gps?: boolean;
    missingGps?: number[];
    session?: Record<string, unknown>;
  } = {},
) {
  const encoder = new sdk.Encoder();
  const start =
    (Date.parse('2020-01-02T09:00:00Z') - Date.UTC(1989, 11, 31)) / 1000;
  encoder.onMesg(0, {
    type: options.fileType ?? 'activity',
    manufacturer: 'development',
    product: 1,
    timeCreated: start,
  });
  if (options.records !== false) {
    for (let i = 0; i < 3; i++)
      encoder.onMesg(20, {
        timestamp: start + i,
        distance: i * 3,
        altitude: 100 + i,
        power: 200 + i,
        ...(!(options.partial && i === 1) ? { heartRate: 120 + i } : {}),
        ...(options.gps && !options.missingGps?.includes(i)
          ? { positionLat: 1000000 + i * 100, positionLong: 2000000 + i * 100 }
          : {}),
      });
    encoder.onMesg(19, {
      startTime: start,
      timestamp: start + 2,
      totalElapsedTime: 2,
      totalTimerTime: 2,
    });
  }
  for (let i = 0; i < (options.sessions ?? 1); i++)
    encoder.onMesg(18, {
      startTime: start,
      timestamp: start + 2,
      totalElapsedTime: 2,
      totalTimerTime: 2,
      totalDistance: 6,
      totalAscent: 2,
      sport: 'running',
      subSport: 'trail',
      avgHeartRate: 121,
      maxHeartRate: 122,
      ...options.session,
    });
  return {
    originalname: 'synthetic.FIT',
    buffer: Buffer.from(encoder.close()),
    get size() {
      return this.buffer.length;
    },
  };
}
const parse = async (file = fixture()) =>
  prepareManualFit(
    await new FitParserStrategy().parse(Uint8Array.from(file.buffer).buffer),
  );
// The athlete always comes from the user ID, never from the token's profile.
const athlete = {
  userId: 4,
  email: 'athlete@example.test',
  athlete: { athleteId: 999 },
} as AuthUser;
function setup() {
  const db = {
    athlete: { findUnique: jest.fn().mockResolvedValue({ athleteId: 4 }) },
    eventActivity: {
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn(),
    },
    event: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(async ({ data }) => ({
        eventId: 90,
        ...data,
        activity: { eventActivityId: 80, eventId: 90 },
      })),
    },
    $transaction: jest.fn(),
  };
  db.$transaction.mockImplementation(async (fn) => fn(db));
  const queue = {
    addActivityProcessingJob: jest.fn().mockResolvedValue(undefined),
  };
  return {
    db,
    queue,
    service: new ManualFitImportService(
      db as unknown as PrismaService,
      queue as unknown as QueueService,
    ),
  };
}

describe('Manual FIT parsing', () => {
  test('accepts the synthetic run used by the end-to-end tests', async () => {
    const buffer = readFileSync(
      join(__dirname, '../../../../../../e2e/fixtures/synthetic-run.fit'),
    );
    const result = await parse({
      originalname: 'synthetic-run.fit',
      buffer,
      size: buffer.length,
    });
    expect(result.startDate).toEqual(new Date('2024-05-01T07:00:00Z'));
    expect(result.warnings).toEqual([]);
    expect(result.activity).toMatchObject({ sport: 'RUNNING', distance: 1666 });
  });
  test('decodes summary, GPS, streams and laps using the real SDK', async () => {
    const result = await parse(fixture({ gps: true }));
    expect(result.startDate).toEqual(new Date('2020-01-02T09:00:00Z'));
    expect(result.activity).toMatchObject({
      sport: 'TRAIL_RUNNING',
      distance: 6,
      movingTime: 2,
      elevationGain: 2,
      averageHeartrate: 121,
      maxHeartrate: 122,
    });
    const stream = uncompressActivityStream(result.details.stream);
    expect(stream.time).toEqual([0, 1, 2]);
    expect(stream.heartrate).toEqual([120, 121, 122]);
    expect(stream.latlng).toHaveLength(3);
    expect(result.details.segments).toHaveLength(1);
  });
  test.each([
    { missingGps: [0] },
    { missingGps: [1] },
    { missingGps: [2] },
    { missingGps: [0, 2] },
  ])(
    'keeps GPS gaps aligned at indices $missingGps',
    async ({ missingGps }) => {
      const result = await parse(fixture({ gps: true, missingGps }));
      const stream = uncompressActivityStream(result.details.stream);
      expect(stream.time).toEqual([0, 1, 2]);
      expect(stream.heartrate).toEqual([120, 121, 122]);
      expect(stream.latlng).toHaveLength(3);
      for (let i = 0; i < 3; i++) {
        expect(stream.latlng![i]).toEqual(
          missingGps.includes(i)
            ? []
            : [
                ((1000000 + i * 100) * 180) / 2 ** 31,
                ((2000000 + i * 100) * 180) / 2 ** 31,
              ],
        );
      }
    },
  );
  test('omits GPS when every record lacks coordinates', async () => {
    const result = await parse(fixture({ gps: true, missingGps: [0, 1, 2] }));
    expect(
      uncompressActivityStream(result.details.stream).latlng,
    ).toBeUndefined();
  });
  test('accepts indoor summary-only activities without inventing GPS', async () => {
    const result = await parse(
      fixture({
        records: false,
        session: { sport: 'training', subSport: 'strengthTraining' },
      }),
    );
    expect(result.activity.sport).toBe('WEIGHT_TRAINING');
    expect(result.details.stream).toEqual({});
    expect(result.warnings).toContain('FIT_NO_STREAM');
  });
  test('omits incomplete channels rather than shifting their timestamps', async () => {
    const result = await parse(fixture({ partial: true }));
    const stream = uncompressActivityStream(result.details.stream);
    expect(stream.heartrate).toBeUndefined();
    expect(stream.watts).toEqual([200, 201, 202]);
    expect(result.warnings).toContain('FIT_INCOMPLETE_CHANNELS');
  });
  test('rejects corrupted files, planned workouts and multisession files', async () => {
    const broken = fixture();
    broken.buffer[broken.buffer.length - 1] ^= 255;
    await expect(parse(broken)).rejects.toThrow('FIT_INVALID');
    await expect(parse(fixture({ fileType: 'workout' }))).rejects.toThrow(
      'FIT_NOT_ACTIVITY',
    );
    await expect(parse(fixture({ sessions: 2 }))).rejects.toThrow(
      'FIT_MULTISPORT_UNSUPPORTED',
    );
    await expect(
      parse(fixture({ session: { sport: 'multisport' } })),
    ).rejects.toThrow('FIT_MULTISPORT_UNSUPPORTED');
  });
  test('rejects invalid duration and nonmonotonic timelines', async () => {
    await expect(
      parse(fixture({ session: { totalTimerTime: 0 } })),
    ).rejects.toThrow('FIT_INVALID');
    const parsed = await new FitParserStrategy().parse(
      Uint8Array.from(fixture().buffer).buffer,
    );
    parsed.stream.time = [2, 1, 0];
    expect(() => prepareManualFit(parsed)).toThrow('Invalid FIT timeline');
  });
});

describe('Manual FIT ownership and persistence', () => {
  test('binds import to authenticated user, writes atomically and queues without AI feedback', async () => {
    const { db, queue, service } = setup();
    const result = await service.import(athlete, fixture(), 'Test trail');
    expect(db.athlete.findUnique).toHaveBeenCalledWith({
      where: { userId: 4 },
    });
    const data = db.event.create.mock.calls[0][0].data;
    expect(data).toMatchObject({
      athleteId: 4,
      type: 'ACTIVITY',
      name: 'Test trail',
    });
    expect(data.activity.create.externalId).toMatch(
      /^fit-manual:4:[a-f0-9]{64}$/,
    );
    expect(data.activity.create.provider).toBeNull();
    expect(data.activity.create.segments.create).toHaveLength(1);
    expect(queue.addActivityProcessingJob).toHaveBeenCalledWith(80, 90, true);
    expect(result).toMatchObject({
      eventId: 90,
      alreadyImported: false,
      processingQueued: true,
    });
  });
  test('denies accounts without an athlete profile', async () => {
    const { db, service } = setup();
    db.athlete.findUnique.mockResolvedValue(null);
    await expect(
      service.import(athlete, fixture(), 'Test'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(db.event.create).not.toHaveBeenCalled();
  });
  test('rejects missing, invalid and oversized files before writing', async () => {
    const { db, service } = setup();
    await expect(
      service.import(athlete, undefined, 'Test'),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.import(
        athlete,
        { ...fixture(), originalname: 'bad.zip' },
        'Test',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.import(
        athlete,
        { ...fixture(), size: MAX_MANUAL_FIT_BYTES + 1 },
        'Test',
      ),
    ).rejects.toBeInstanceOf(PayloadTooLargeException);
    await expect(
      service.import(
        athlete,
        { originalname: 'bad.fit', buffer: Buffer.from('invalid'), size: 7 },
        'Test',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(db.event.create).not.toHaveBeenCalled();
  });
  test('does not overwrite a synced activity with the same start time', async () => {
    const { db, service } = setup();
    db.event.findFirst.mockResolvedValue({ eventId: 42 });
    await expect(
      service.import(athlete, fixture(), 'Test'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(db.event.create).not.toHaveBeenCalled();
  });
  test('same-file retry reuses existing activity and can retry queue submission', async () => {
    const { db, queue, service } = setup();
    db.eventActivity.findUnique.mockResolvedValue({
      eventId: 90,
      eventActivityId: 80,
      event: { name: 'Original', startDate: new Date('2020-01-02T09:00:00Z') },
    });
    const result = await service.import(athlete, fixture(), 'Renamed file');
    expect(result.alreadyImported).toBe(true);
    expect(result.name).toBe('Original');
    expect(db.event.create).not.toHaveBeenCalled();
    expect(queue.addActivityProcessingJob).toHaveBeenCalledWith(80, 90, true);
  });
  test('same-file retry restores missing GPS without overwriting any other data', async () => {
    const { db, service } = setup();
    db.eventActivity.findUnique.mockResolvedValue({
      eventId: 90,
      eventActivityId: 80,
      event: { name: 'Original', startDate: new Date('2020-01-02T09:00:00Z') },
      stream: { time: [0, 1, 2], heartrate: [99, 100, 101] },
    });
    const result = await service.import(
      athlete,
      fixture({ gps: true, missingGps: [1] }),
      'New name',
    );
    expect(result.name).toBe('Original');
    expect(db.event.create).not.toHaveBeenCalled();
    const update = db.eventActivity.update.mock.calls[0][0];
    expect(Object.keys(update.data)).toEqual(['stream']);
    const stream = uncompressActivityStream(update.data.stream);
    expect(stream.heartrate).toEqual([99, 100, 101]);
    expect(stream.latlng?.map((p) => p.length)).toEqual([2, 0, 2]);
  });
  test.each([
    { time: [0, 2, 3] },
    {
      time: [0, 1, 2],
      latlng: [
        [40, 1],
        [40, 1],
        [40, 1],
      ],
    },
  ])(
    'does not replace existing GPS or repair a different timeline',
    async (stream) => {
      const { db, service } = setup();
      db.eventActivity.findUnique.mockResolvedValue({
        eventId: 90,
        eventActivityId: 80,
        stream,
        event: {
          name: 'Original',
          startDate: new Date('2020-01-02T09:00:00Z'),
        },
      });
      await service.import(athlete, fixture({ gps: true }), 'Test');
      expect(db.eventActivity.update).not.toHaveBeenCalled();
    },
  );
  test('queue failure reports a saved activity, not a failed import', async () => {
    const { queue, service } = setup();
    queue.addActivityProcessingJob.mockRejectedValue(
      new Error('Redis unavailable'),
    );
    expect(await service.import(athlete, fixture(), 'Test')).toMatchObject({
      eventId: 90,
      alreadyImported: false,
      processingQueued: false,
    });
  });
});
