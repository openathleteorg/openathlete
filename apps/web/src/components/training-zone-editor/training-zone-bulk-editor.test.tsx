// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TRAINING_ZONE_TYPE } from '@openathlete/shared';

import { TrainingZoneBulkEditor } from './training-zone-bulk-editor';

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));
const toast = vi.hoisted(() => ({ error: vi.fn() }));

vi.mock('@/utils/axios', () => ({
  default: api,
  routes: { metric: { getLatestMetrics: '/metric/latest' } },
}));
vi.mock('sonner', () => ({ toast }));
// Every message renders as its key.
vi.mock('@/paraglide/messages', () => ({
  m: new Proxy({}, { get: (_target, key) => () => String(key) }),
}));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

/** Five saved zones in bpm, 100 to 200. */
const savedZones = () =>
  [0, 1, 2, 3, 4].map((i) => ({
    trainingZoneId: 700 + i,
    athleteId: 998,
    index: i,
    type: TRAINING_ZONE_TYPE.HEARTRATE,
    name: `Zone ${i + 1}`,
    description: `Keep ${i}`,
    color: '#22C55E',
    values: [
      {
        min: 100 + 20 * i,
        max: i === 4 ? 200 : 119 + 20 * i,
        sports: ['RUNNING'],
      },
    ],
  }));

describe('TrainingZoneBulkEditor', () => {
  let container: HTMLDivElement;
  let root: Root;
  let completed: number;

  beforeEach(() => {
    for (const fn of [...Object.values(api), toast.error]) fn.mockReset();
    api.post.mockImplementation(async (_url: string, body: object) => ({
      data: { ...body, trainingZoneId: 900 + api.post.mock.calls.length },
    }));
    api.patch.mockImplementation(async (_url: string, body: object) => ({
      data: body,
    }));
    api.delete.mockResolvedValue({ data: { success: true } });
    completed = 0;
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const waitFor = async (check: () => boolean) => {
    for (let tries = 0; tries < 200 && !check(); tries++)
      await act(() => new Promise((resolve) => setTimeout(resolve, 5)));
    expect(check()).toBe(true);
  };

  async function render({
    hrMax = 200 as number | null,
    hrRest = 60 as number | null,
    zones = [] as ReturnType<typeof savedZones>,
    type = TRAINING_ZONE_TYPE.HEARTRATE,
  } = {}) {
    api.get.mockResolvedValue({
      data: {
        ...(hrMax ? { HR_MAX: { value: hrMax } } : {}),
        ...(hrRest ? { HR_REST: { value: hrRest } } : {}),
        // The lowest heart rate of a day is not a resting heart rate.
        HR_MIN_DAILY: { value: 40 },
      },
    });
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <TrainingZoneBulkEditor
            athleteId={998}
            type={type}
            zones={zones as never}
            onComplete={() => completed++}
          />
        </QueryClientProvider>,
      ),
    );
    if (type === TRAINING_ZONE_TYPE.HEARTRATE)
      await waitFor(() => api.get.mock.calls.length > 0);
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
  }

  const buttons = () => [...document.body.querySelectorAll('button')];
  const button = (label: string) =>
    buttons().find((item) => item.textContent?.trim() === label)!;
  const click = (label: string) => act(async () => button(label).click());
  const field = (id: string) =>
    document.getElementById(id) as HTMLInputElement | null;
  const type = (id: string, value: string) =>
    act(async () => {
      const input = field(id)!;
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      )!.set!.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  const previews = () =>
    [...container.querySelectorAll('[data-testid=hr-zone-preview]')].map(
      (item) => item.textContent,
    );
  const saveDisabled = () => button('save').disabled;
  const alerts = () =>
    [...document.body.querySelectorAll('[role=alert]')].map(
      (item) => item.textContent,
    );
  const save = async () => {
    await click('save');
    await waitFor(() => !button('save').disabled || completed > 0);
  };

  it('creates zones 0 to 5 from the maximum heart rate', async () => {
    await render();
    expect(
      [...container.querySelectorAll('[role=group] button')].map(
        (item) => item.textContent,
      ),
    ).toEqual([
      'hr_zones_manual',
      'hr_zones_reserve_percent',
      'percent_of_max_heart_rate',
    ]);
    expect(field('zones-hr-max')!.value).toBe('200');
    // Resting heart rate only matters for the reserve.
    expect(field('zones-hr-rest')).toBeNull();
    expect(previews()).toEqual([
      '0–99 bpm',
      '100–119 bpm',
      '120–139 bpm',
      '140–159 bpm',
      '160–179 bpm',
      '180–200 bpm',
    ]);

    await save();
    expect(completed).toBe(1);
    expect(api.post.mock.calls.map(([, body]) => body)).toMatchObject([
      { name: 'hr_zone_0', min: 0, max: 99, athleteId: 998 },
      { name: 'zone_1', min: 100, max: 119 },
      { name: 'zone_2', min: 120, max: 139 },
      { name: 'zone_3', min: 140, max: 159 },
      { name: 'zone_4', min: 160, max: 179 },
      { name: 'zone_5', min: 180, max: 200 },
    ]);
  });

  it('calculates the reserve from the resting heart rate', async () => {
    await render({ hrMax: 195, hrRest: 60 });
    await click('hr_zones_reserve_percent');
    expect(field('zones-hr-rest')!.value).toBe('60');
    expect(previews()).toEqual([
      '60–127 bpm',
      '128–140 bpm',
      '141–154 bpm',
      '155–167 bpm',
      '168–181 bpm',
      '182–195 bpm',
    ]);

    await type('zones-hr-rest', '50');
    expect(previews()[2]).toBe('137–151 bpm');
    await type('zones-hr-rest', '60');
    // Manual keeps the bpm limits; the reserve gives the same ranges back.
    await click('hr_zones_manual');
    expect(field('zone-2-min')!.value).toBe('141');
    expect(field('zones-hr-max')).toBeNull();
    await click('hr_zones_reserve_percent');
    expect(previews()[2]).toBe('141–154 bpm');

    await save();
    expect(api.post.mock.calls[2][1]).toMatchObject({ min: 141, max: 154 });
  });

  it('asks for a valid resting heart rate, never the daily minimum', async () => {
    await render({ hrMax: 195, hrRest: null });
    await click('hr_zones_reserve_percent');
    expect(field('zones-hr-rest')!.value).toBe('');
    expect(alerts()).toContain('hr_zones_rest_required');
    expect(saveDisabled()).toBe(true);
    for (const rest of ['0', '195', '200', '60.5']) {
      await type('zones-hr-rest', rest);
      expect(saveDisabled()).toBe(true);
    }
    // Without a valid resting rate the percentages cannot become bpm.
    await click('hr_zones_manual');
    expect(alerts()).toContain('hr_zones_conversion_error');
    expect(field('zones-hr-rest')).not.toBeNull();

    await type('zones-hr-rest', '60');
    expect(saveDisabled()).toBe(false);
    await type('zones-hr-rest', '');
    await click('percent_of_max_heart_rate');
    expect(field('zones-hr-rest')).toBeNull();
    expect(saveDisabled()).toBe(false);
    expect(api.post).not.toHaveBeenCalled();
  });

  it('asks for the maximum heart rate when there is none', async () => {
    await render({ hrMax: null });
    expect(field('zones-hr-max')!.value).toBe('');
    expect(alerts()).toContain('hr_zones_max_required');
    expect(saveDisabled()).toBe(true);
    await type('zones-hr-max', '200.5');
    expect(saveDisabled()).toBe(true);
    await type('zones-hr-max', '180');
    expect(saveDisabled()).toBe(false);
    expect(previews()[2]).toBe('108–125 bpm');
  });

  it('applies custom percentages and the default ones', async () => {
    await render();
    await type('zone-3-min', '75');
    // The previous zone ends where this one starts.
    expect(field('zone-2-max')!.value).toBe('75');
    expect(previews().slice(2, 4)).toEqual(['120–149 bpm', '150–159 bpm']);
    await type('zone-3-max', '70');
    expect(saveDisabled()).toBe(true);
    expect(alerts()).toContain('hr_zones_invalid');

    await click('hr_zones_default_percentages');
    expect(previews()[3]).toBe('140–159 bpm');
    expect(saveDisabled()).toBe(false);
  });

  it('opens saved zones in bpm and keeps their IDs, sports and descriptions', async () => {
    await render({ zones: savedZones() });
    expect(field('zones-hr-max')).toBeNull();
    expect(container.textContent).not.toContain('hr_zones_percentage_help');
    expect(field('zone-0-min')!.value).toBe('100');

    await click('percent_of_max_heart_rate');
    expect(field('zone-0-min')!.value).toBe('50');
    // Five zones get the five-zone preset, without a Zone 0.
    await type('zone-0-min', '45');
    await click('hr_zones_default_percentages');
    expect(field('zone-0-min')!.value).toBe('50');
    await click('hr_zones_manual');
    expect(field('zone-0-min')!.value).toBe('100');

    await save();
    expect(api.post).not.toHaveBeenCalled();
    expect(api.patch.mock.calls).toEqual(
      savedZones().map((zone) => [
        `/training-zone/${zone.trainingZoneId}`,
        expect.objectContaining({
          name: zone.name,
          description: zone.description,
          min: zone.values[0].min,
          max: zone.values[0].max,
          sports: ['RUNNING'],
        }),
      ]),
    );
  });

  it('asks for missing references before converting saved zones', async () => {
    await render({ zones: savedZones(), hrRest: null });
    await click('hr_zones_reserve_percent');
    const dialog = () => document.body.querySelector('[role=dialog]');
    expect(dialog()?.querySelector('#zones-hr-rest')).not.toBeNull();
    // The dialog's own Cancel, not the editor's.
    await act(async () =>
      [...dialog()!.querySelectorAll('button')]
        .find((item) => item.textContent?.trim() === 'cancel')!
        .click(),
    );
    await waitFor(() => !dialog());
    expect(completed).toBe(0);
    expect(field('zone-0-min')!.value).toBe('100');
    expect(field('zones-hr-max')).toBeNull();

    await click('hr_zones_reserve_percent');
    await type('zones-hr-rest', '60');
    await click('hr_zones_convert_limits');
    await waitFor(() => !dialog());
    expect(previews()).toHaveLength(5);
    expect(previews()[0]).toBe('100–119 bpm');
    expect(api.patch).not.toHaveBeenCalled();
  });

  it('keeps the zones created before a failed save', async () => {
    await render();
    api.post
      .mockResolvedValueOnce({ data: { trainingZoneId: 901 } })
      .mockRejectedValueOnce(new Error('offline'));
    await save();
    expect(toast.error).toHaveBeenCalledWith('hr_zones_save_error');
    expect(completed).toBe(0);

    await save();
    expect(completed).toBe(1);
    // Zone 0 is updated on retry instead of being created twice.
    expect(
      api.post.mock.calls.filter(([, body]) => body.name === 'hr_zone_0'),
    ).toHaveLength(1);
    expect(api.patch.mock.calls[0][0]).toBe('/training-zone/901');
  });

  it('does not delete a removed zone twice when retrying', async () => {
    await render({ zones: savedZones() });
    await act(async () =>
      container
        .querySelector<HTMLButtonElement>('[aria-label="delete_ Zone 5"]')!
        .click(),
    );
    api.patch.mockRejectedValueOnce(new Error('offline'));
    await save();
    expect(toast.error).toHaveBeenCalled();

    await save();
    expect(completed).toBe(1);
    expect(api.delete.mock.calls).toEqual([['/training-zone/704']]);
  });

  it('leaves power zones without heart-rate options', async () => {
    await render({ type: TRAINING_ZONE_TYPE.POWER });
    expect(container.querySelector('[role=group]')).toBeNull();
    expect(api.get).not.toHaveBeenCalled();
    expect(previews()).toEqual([]);
  });
});
