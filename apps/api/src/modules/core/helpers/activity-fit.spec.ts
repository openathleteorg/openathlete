import { SPORT_TYPE } from '@openathlete/shared';

import { activityToFit, fitFileName, toFitSport } from './activity-fit';
import { fitSport } from './manual-fit-import';
import { FitParserStrategy } from './strategies/fit-parser.strategy';

jest.mock('@garmin/fitsdk', () => {
  const sdk = process.getBuiltinModule('module').createRequire(__filename)(
    '@garmin/fitsdk',
  );
  // Native ESM runs outside Jest's VM: bring decoded dates into this realm
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

const sdk = process.getBuiltinModule('module').createRequire(__filename)(
  '@garmin/fitsdk',
);

const ride = {
  startDate: new Date('2026-11-20T08:00:00Z'),
  endDate: new Date('2026-11-20T08:00:05Z'),
  sport: SPORT_TYPE.CYCLING,
  distance: 40,
  movingTime: 4,
  elevationGain: 2,
  averageHeartrate: 141,
  maxHeartrate: 150,
  averageWatts: 210,
};

const stream = {
  time: [0, 1, 2, 3, 4, 5],
  distance: [0, 8, 16, 24, 32, 40],
  latlng: [
    [45.1, 6.1],
    [45.10007, 6.1],
    [],
    [45.10021, 6.1],
    [45.10028, 6.1],
    [45.10035, 6.1],
  ],
  altitude: [200, 200.4, 200.8, 201.2, 201.6, 202],
  heartrate: [130, 135, 140, 145, 148, 150],
  cadence: [88, 89, 90, 91, 90, 89],
  watts: [200, 205, 210, 215, 220, 210],
  timerPaused: [0, 0, 1, 0, 0, 0],
};

const decode = (bytes: Uint8Array, options?: Record<string, boolean>) => {
  const decoder = new sdk.Decoder(sdk.Stream.fromByteArray(Array.from(bytes)));
  expect(decoder.checkIntegrity()).toBe(true);
  return decoder.read(options).messages;
};

describe('activityToFit', () => {
  it('reads back through our own importer as the same activity', async () => {
    const bytes = activityToFit(ride, stream)!;
    const parsed = await new FitParserStrategy().parse(
      Uint8Array.from(bytes).buffer,
    );
    expect(parsed.stream.time).toEqual(stream.time);
    expect(parsed.stream.watts).toEqual(stream.watts);
    expect(parsed.stream.heartrate).toEqual(stream.heartrate);
    expect(parsed.stream.cadence).toEqual(stream.cadence);
    expect(parsed.stream.latlng![2]).toEqual([]);
    expect(parsed.stream.latlng![1][0]).toBeCloseTo(45.10007, 5);
    expect(parsed.stream.altitude![5]).toBeCloseTo(202, 1);
    // Sport numbers, as the importer reads them
    const session = decode(bytes, { convertTypesToStrings: false })
      .sessionMesgs[0];
    expect(fitSport(session.sport, session.subSport)).toBe(SPORT_TYPE.CYCLING);
    expect(session).toMatchObject({
      totalDistance: 40,
      totalTimerTime: 4,
      totalElapsedTime: 5,
      avgPower: 210,
      avgHeartRate: 141,
    });
  });

  it('marks timer pauses with timer events', () => {
    const events = decode(activityToFit(ride, stream)!).eventMesgs;
    expect(events.map((e: { eventType: string }) => e.eventType)).toEqual([
      'start',
      'stopAll',
      'start',
      'stopAll',
    ]);
  });

  it('names Garmin and the device of a Garmin activity', () => {
    const messages = decode(
      activityToFit({ ...ride, garminDevice: { name: 'Edge 1050' } }, stream)!,
    );
    expect(messages.deviceInfoMesgs[0]).toMatchObject({
      manufacturer: 'garmin',
      productName: 'Edge 1050',
    });
    expect(
      decode(activityToFit(ride, stream)!).deviceInfoMesgs,
    ).toBeUndefined();
  });

  it('exports an indoor activity without GPS, and nothing without time', () => {
    const indoor = { time: [0, 1], watts: [150, 160] };
    expect(activityToFit(ride, indoor)).not.toBeNull();
    expect(activityToFit(ride, { watts: [150] })).toBeNull();
  });
});

it('gives each sport a FIT sport the importer reads back the same', () => {
  for (const sport of [
    SPORT_TYPE.RUNNING,
    SPORT_TYPE.TRAIL_RUNNING,
    SPORT_TYPE.GRAVEL_RIDE,
    SPORT_TYPE.VIRTUAL_RIDE,
    SPORT_TYPE.SWIMMING,
    SPORT_TYPE.ROWING,
    SPORT_TYPE.WEIGHT_TRAINING,
    SPORT_TYPE.MOBILITY,
  ]) {
    expect(fitSport(...toFitSport(sport))).toBe(sport);
  }
  expect(toFitSport(SPORT_TYPE.OTHER)).toEqual([0, 0]);
});

it('names the file after the day and the activity', () => {
  expect(
    fitFileName({ name: 'Sortie à vélo', startDate: ride.startDate }),
  ).toBe('2026-11-20-Sortie-a-velo.fit');
});
