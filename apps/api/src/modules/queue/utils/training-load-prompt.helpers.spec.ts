import { buildZonesContext } from '../../agent/services/event-ai-helpers';
import { buildTrainingZonesContext } from './training-load-prompt.helpers';

// Heart-rate zones may start at Zone 0, so the AI must see their names
// rather than numbers derived from their position.
const zones = ['Zone 0', 'Zone 1'].map((name, index) => ({
  trainingZoneId: 30 + index,
  type: 'HEARTRATE',
  index,
  name,
  description: '',
  values: [{ min: 100 + index * 20, max: 119 + index * 20, sports: [] }],
}));

describe('zone labels in AI prompts', () => {
  test('training load estimation names zones as the athlete does', () => {
    const { summary, zoneLookup } = buildTrainingZonesContext(zones, 'RUNNING');
    expect(summary).toBe(
      'HEARTRATE Zone 0: 100-119 bpm\nHEARTRATE Zone 1: 120-139 bpm',
    );
    expect(zoneLookup.get(30)?.label).toBe('Zone 0');
  });

  test('workout generation lists zones by name and ID', () => {
    const context = buildZonesContext({ HEARTRATE: zones } as never);
    expect(context).toContain('Zone ID 30: Zone 0 - ');
    expect(context).toContain('Zone ID 31: Zone 1 - ');
    expect(context).not.toContain('Zone 2');
  });
});
