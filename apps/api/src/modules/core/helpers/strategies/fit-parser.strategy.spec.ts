import { FitParserStrategy } from './fit-parser.strategy';

jest.mock('@garmin/fitsdk', () => {
  const sdk = process.getBuiltinModule('module').createRequire(__filename)(
    '@garmin/fitsdk',
  );
  // Native ESM runs outside Jest's VM. Normalize Date objects into the test
  // realm so the parser's instanceof Date checks behave as in Node.
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

// Synthetic FIT bytes produced with the installed SDK; no athlete data.
const sdk = process.getBuiltinModule('module').createRequire(__filename)(
  '@garmin/fitsdk',
);

/** Three one-second records; `withoutPosition` lists records with no GPS fix. */
function fitFile(withoutPosition: number[]) {
  const encoder = new sdk.Encoder();
  const start =
    (Date.parse('2020-01-02T09:00:00Z') - Date.UTC(1989, 11, 31)) / 1000;
  encoder.onMesg(0, {
    type: 'activity',
    manufacturer: 'development',
    product: 1,
    timeCreated: start,
  });
  for (let i = 0; i < 3; i++)
    encoder.onMesg(20, {
      timestamp: start + i,
      heartRate: 120 + i,
      ...(withoutPosition.includes(i)
        ? {}
        : { positionLat: 1000000 + i * 100, positionLong: 2000000 + i * 100 }),
    });
  encoder.onMesg(18, {
    startTime: start,
    timestamp: start + 2,
    totalElapsedTime: 2,
    totalTimerTime: 2,
    sport: 'running',
  });
  return Uint8Array.from(encoder.close()).buffer;
}

describe('FitParserStrategy GPS', () => {
  it('keeps positions aligned with time across a GPS gap', async () => {
    const { stream } = await new FitParserStrategy().parse(fitFile([1]));
    expect(stream.time).toHaveLength(3);
    expect(stream.latlng).toHaveLength(3);
    expect(stream.latlng![1]).toEqual([]);
    expect(stream.latlng![0]).toHaveLength(2);
    expect(stream.latlng![2]).toHaveLength(2);
    expect(stream.heartrate).toEqual([120, 121, 122]);
  });

  it('leaves out positions when the file has none', async () => {
    const { stream } = await new FitParserStrategy().parse(fitFile([0, 1, 2]));
    expect(stream.latlng).toBeUndefined();
    expect(stream.time).toHaveLength(3);
  });
});
