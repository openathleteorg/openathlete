// @vitest-environment jsdom
import type { LatLng } from 'leaflet';
import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, expect, it, vi } from 'vitest';

import { Map } from './map';

const drawPolyline = vi.hoisted(() => vi.fn());
const first = [40, 1];
const second = [40, 1.00002];
const third = [40, 1.00004];
const fourth = [40, 1.00006];

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: ReactNode }) => children,
  Polyline: ({ positions }: { positions: LatLng[][] }) => {
    drawPolyline(
      positions.map((part) => part.map(({ lat, lng }) => [lat, lng])),
    );
    return null;
  },
  CircleMarker: () => null,
  TileLayer: () => null,
  Tooltip: () => null,
  useMap: () => ({}),
}));

beforeEach(() => {
  drawPolyline.mockClear();
});

it('draws an isolated fix as a dot when the timeline is unavailable', () => {
  renderToStaticMarkup(<Map polyline={[first, [], second, third]} />);
  expect(drawPolyline).toHaveBeenCalledExactlyOnceWith([
    [first, first],
    [second, third],
  ]);
});

it('joins nearby fixes over short GPS sampling gaps', () => {
  renderToStaticMarkup(
    <Map polyline={[first, [], second, third]} time={[0, 1, 2, 3]} />,
  );
  expect(drawPolyline).toHaveBeenCalledExactlyOnceWith([
    [first, second, third],
  ]);
});

it('keeps consecutive GPX fixes connected when timestamps are all zero', () => {
  const next = [40.0003, 1]; // about 33 m from the first fix
  renderToStaticMarkup(
    <Map polyline={[first, next, [], third]} time={[0, 0, 0, 0]} />,
  );
  expect(drawPolyline).toHaveBeenCalledExactlyOnceWith([
    [first, next],
    [third, third],
  ]);
});

it('breaks at a long dropout even when there were no records in the gap', () => {
  renderToStaticMarkup(
    <Map
      polyline={[first, [], second, third, fourth]}
      time={[0, 1, 13, 29, 30]}
    />,
  );
  expect(drawPolyline).toHaveBeenCalledExactlyOnceWith([
    [first, first],
    [second, second],
    [third, fourth],
  ]);
});

it('breaks at an implausible jump between consecutive GPS fixes', () => {
  const far = [40, 2];
  renderToStaticMarkup(
    <Map polyline={[first, second, far]} time={[0, 1, 2]} />,
  );
  expect(drawPolyline).toHaveBeenCalledExactlyOnceWith([
    [first, second],
    [far, far],
  ]);
});

it('breaks at a short timer pause in the route and its overlays', () => {
  renderToStaticMarkup(
    <Map
      polyline={[first, [], second, third]}
      time={[0, 1, 2, 3]}
      timerPaused={[0, 1, 0, 0]}
      highlights={[{ key: 'climb', range: [0, 3], label: 'Climb' }]}
      focusRange={[0, 3]}
    />,
  );
  expect(drawPolyline.mock.calls).toEqual(
    Array.from({ length: 3 }, () => [
      [
        [first, first],
        [second, third],
      ],
    ]),
  );
});
