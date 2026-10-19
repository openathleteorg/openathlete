import { buildZonesContext } from '../../agent/services/event-ai-helpers';
import {
  buildTrainingZonesContext,
  formatGoalSummary,
} from './training-load-prompt.helpers';

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

describe('goal RPE in training load prompts', () => {
  test('formats goal RPE on a 10-point scale', () => {
    expect(formatGoalSummary({ goalRpe: 0.6 })).toBe('Target RPE: 6/10');
    expect(formatGoalSummary({ goalRpe: 0.75 })).toBe('Target RPE: 7.5/10');
  });

  test('does not include RPE when it is not provided', () => {
    expect(formatGoalSummary({ goalRpe: null })).toBe(
      'No numeric goals specified.',
    );
  });
});
