// @vitest-environment jsdom
import { act } from 'react';
import { type Root, createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ModeledMetrics } from './modeled-metrics';

const response = vi.hoisted(() => ({ data: undefined as unknown }));
vi.mock('@/api/record', () => ({
  useGetModeledMetricsQuery: () => ({ data: response.data, isLoading: false }),
}));
vi.mock('@/components/garmin-attribution/garmin-attribution', () => ({
  GarminAttribution: () => <p data-testid="garmin-attribution" />,
}));
vi.mock('@/utils/label-map/core/metric-type.label-map', () => ({
  metricTypeLabelMap: { FTP_RUNNING: 'FTP run', FTP_CYCLING: 'FTP bike' },
}));
// Every message renders as its key, followed by its parameters
vi.mock('@/paraglide/messages', () => ({
  m: new Proxy(
    {},
    {
      get: (_target, key) => (params?: Record<string, unknown>) =>
        [String(key), ...Object.values(params ?? {})].join(' '),
    },
  ),
}));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe('ModeledMetrics', () => {
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

  const tiles = () =>
    [...container.querySelectorAll('[data-slot="metric-tile"]')].map(
      (tile) => tile.textContent,
    );

  it('shows each FTP in watts with the effort it comes from', () => {
    response.data = {
      from: new Date('2026-08-18'),
      days: 90,
      ftpRunning: {
        value: 318,
        duration: 1200,
        power: 335,
        factor: 0.95,
        date: new Date('2026-09-14T08:00:00Z'),
        eventId: 1,
        activityName: 'Bahn',
      },
      ftpCycling: null,
      trainingFocusRunning: null,
    };
    act(() => root.render(<ModeledMetrics />));

    const [running, cycling] = tiles();
    expect(running).toContain('FTP run');
    expect(running).toContain('318W');
    expect(running).toMatch(/modeled_ftp_caption 95 20/);
    expect(cycling).toBe('FTP bike–');
    expect(
      container
        .querySelector('[title^="modeled_ftp_title"]')
        ?.getAttribute('title'),
    ).toContain('335');
    // Insights derived from activity power carry Garmin's attribution
    expect(
      container.querySelector('[data-testid="garmin-attribution"]'),
    ).not.toBeNull();
  });

  it('says so when no activity has 20 minutes of power', () => {
    response.data = {
      from: new Date('2026-08-18'),
      days: 90,
      ftpRunning: null,
      ftpCycling: null,
      trainingFocusRunning: null,
    };
    act(() => root.render(<ModeledMetrics />));
    expect(tiles()).toEqual([]);
    expect(
      container.querySelector('[data-testid="garmin-attribution"]'),
    ).toBeNull();
    expect(container.textContent).toContain(
      'dashboard_header_no_modeled_metrics 90',
    );
  });

  it('names the training focus, with the ratios behind it', () => {
    response.data = {
      from: new Date('2026-08-18'),
      days: 90,
      ftpRunning: null,
      ftpCycling: null,
      trainingFocusRunning: {
        aerobicThreshold: 264,
        lactateThreshold: 318,
        vo2max: 345,
        ratios: {
          aerobicToVo2max: 0.7652,
          aerobicToThreshold: 0.8297,
          thresholdToVo2max: 0.9217,
        },
        weaknesses: ['AEROBIC', 'VO2MAX'],
        focus: 'VO2MAX',
        byRule: false,
      },
    };
    act(() => root.render(<ModeledMetrics />));

    const focus = tiles()[2];
    expect(focus).toContain('modeled_training_focus');
    expect(focus).toContain('training_focus_vo2max');
    expect(focus).toContain('77 · 83 · 92 %');
    const title = container
      .querySelector('[title^="modeled_training_focus_title"]')
      ?.getAttribute('title');
    expect(title).toContain('76.5');
    expect(title).toContain(
      'modeled_training_focus_weak training_weakness_aerobic, training_weakness_vo2max',
    );
    expect(title).toContain('modeled_training_focus_no_rule');
  });
});
