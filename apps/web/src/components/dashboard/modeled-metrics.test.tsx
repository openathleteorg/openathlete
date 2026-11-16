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
});
