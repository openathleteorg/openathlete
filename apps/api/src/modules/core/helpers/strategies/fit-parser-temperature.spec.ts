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

/** Three one-second records with the given temperatures (°C). */
function fitFile(temperatures: (number | undefined)[]) {
  const encoder = new sdk.Encoder();
  const start =
    (Date.parse('2020-01-02T09:00:00Z') - Date.UTC(1989, 11, 31)) / 1000;
  encoder.onMesg(0, {
    type: 'activity',
    manufacturer: 'development',
    product: 1,
    timeCreated: start,
  });
  temperatures.forEach((temperature, i) =>
    encoder.onMesg(20, {
      timestamp: start + i,
      heartRate: 120 + i,
      ...(temperature === undefined ? {} : { temperature }),
    }),
  );
  encoder.onMesg(18, {
    startTime: start,
    timestamp: start + temperatures.length - 1,
    totalElapsedTime: temperatures.length - 1,
    totalTimerTime: temperatures.length - 1,
    sport: 'running',
  });
  return Uint8Array.from(encoder.close()).buffer;
}

describe('FitParserStrategy temperature', () => {
  it('reads the device temperature of each record', async () => {
    const { stream } = await new FitParserStrategy().parse(
      fitFile([18, 19, 21]),
    );
    expect(stream.temp).toEqual([18, 19, 21]);
  });

  it('leaves out a temperature series that is not complete', async () => {
    const { stream } = await new FitParserStrategy().parse(
      fitFile([18, undefined, 21]),
    );
    expect(stream.temp).toBeUndefined();
    expect(stream.heartrate).toEqual([120, 121, 122]);
  });
});
