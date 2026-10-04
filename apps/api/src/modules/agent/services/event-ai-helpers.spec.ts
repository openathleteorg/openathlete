import { SportType } from '@openathlete/database';

import { buildZonesContext } from './event-ai-helpers';

// The heart-rate zones every new athlete gets, which apply to every sport.
const defaultZones = [
  ['Zone 1', 'Recovery', 0, 131],
  ['Zone 2', 'Endurance', 132, 142],
  ['Zone 3', 'Tempo', 143, 152],
  ['Zone 4', 'Threshold', 153, 163],
  ['Zone 5', 'VO2 Max', 164, 220],
].map(([name, description, min, max], index) => ({
  trainingZoneId: 10 + index,
  type: 'HEARTRATE',
  index,
  name: name as string,
  description: description as string,
  values: [
    {
      min: min as number,
      max: max as number,
      sports: Object.values(SportType),
    },
  ],
}));

describe('buildZonesContext', () => {
  test('does not list sports for zones that apply to every sport', () => {
    const context = buildZonesContext({ HEARTRATE: defaultZones } as never);
    expect(context).not.toContain('sports:');
    expect(context).not.toContain(SportType.RUNNING);
    expect(context).toContain('Zone ID 11: Zone 2 - Endurance');
    expect(context).toContain('Values: 132-142\n');
  });

  test('lists the sports of zones that only apply to some', () => {
    const zone = {
      ...defaultZones[1],
      values: [
        { min: 132, max: 142, sports: ['RUNNING', 'TRAIL_RUNNING'] },
        { min: 120, max: 135, sports: Object.values(SportType) },
      ],
    };
    const context = buildZonesContext({ HEARTRATE: [zone] } as never);
    expect(context).toContain(
      'Values: 132-142 (sports: RUNNING, TRAIL_RUNNING), 120-135\n',
    );
  });
});
