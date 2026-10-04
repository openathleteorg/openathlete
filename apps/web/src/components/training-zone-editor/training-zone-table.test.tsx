// @vitest-environment jsdom
import { act } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TRAINING_ZONE_TYPE } from '@openathlete/shared';

import { TrainingZoneTable } from './training-zone-table';

// Every message renders as its key.
vi.mock('@/paraglide/messages', () => ({
  m: new Proxy({}, { get: (_target, key) => () => String(key) }),
}));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const zones = (type: TRAINING_ZONE_TYPE, sports: string[]) =>
  ['Zone 0', 'Zone 1'].map((name, index) => ({
    trainingZoneId: index + 1,
    athleteId: 1,
    index,
    type,
    name,
    description: '',
    color: '#22C55E',
    values: [{ min: index * 100, max: index * 100 + 99, sports }],
  }));

describe('TrainingZoneTable', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const render = (items: ReturnType<typeof zones>) =>
    act(() => root.render(<TrainingZoneTable zones={items as never} />));
  const rows = () =>
    [...container.querySelectorAll('tbody tr')].map((row) =>
      [...row.querySelectorAll('td')].map((cell) => cell.textContent),
    );

  it('shows zones by name, the maximum heart rate without "or more"', async () => {
    await render(zones(TRAINING_ZONE_TYPE.HEARTRATE, ['RUNNING']));
    expect(rows().map((cells) => cells.slice(0, 4))).toEqual([
      ['Zone 0', '', '0', '99'],
      ['Zone 1', '', '100', '199'],
    ]);
  });

  it('keeps "or more" on the last power zone', async () => {
    await render(zones(TRAINING_ZONE_TYPE.POWER, ['CYCLING']));
    expect(rows()[1][3]).toBe('199+');
  });

  it('does not reorder the sports of the zones it shows', async () => {
    const items = zones(TRAINING_ZONE_TYPE.HEARTRATE, ['RUNNING', 'CYCLING']);
    await render(items);
    expect(items[0].values[0].sports).toEqual(['RUNNING', 'CYCLING']);
  });
});
