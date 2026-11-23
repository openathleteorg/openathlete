import { cn } from '@/utils/shadcn';
import { LatLng, LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo } from 'react';
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet';

import { isValidGpsPoint } from '@openathlete/shared';

/** A part of the track drawn over it, such as a climb, that can be picked */
export interface MapHighlight {
  key: string;
  range: [number, number];
  label: string;
  onClick?: () => void;
}

interface Track {
  polyline: number[][];
  time?: number[];
  timerPaused?: number[];
}

interface P extends Track {
  className?: string;
  focusRange?: [number, number];
  pins?: number[][];
  highlights?: MapHighlight[];
}

const MAX_GPS_GAP_SECONDS = 10;
const MAX_GPS_SPEED_MPS = 50;
const GPS_JITTER_METRES = 20;

function routeSegments(
  { polyline, time, timerPaused }: Track,
  [start, end]: [number, number],
): LatLng[][] {
  // GPX imports without timestamps can have a time stream filled with zeros.
  const timed =
    time?.length === polyline.length && time[time.length - 1] > time[0];
  const segments: LatLng[][] = [];
  let segment: LatLng[] = [];
  let previousIndex = start;
  for (let i = start; i <= end; i++) {
    // A pause flag covers the interval from its sample to the next one.
    if (timerPaused?.[i - 1]) segment = [];
    const fix = polyline[i];
    if (!isValidGpsPoint(fix)) {
      if (!timed) segment = [];
      continue;
    }

    const point = new LatLng(fix[0], fix[1]);
    if (timed && segment.length) {
      const elapsed = time[i] - time[previousIndex];
      const previous = segment[segment.length - 1];
      if (
        !(elapsed >= 0 && elapsed <= MAX_GPS_GAP_SECONDS) ||
        previous.distanceTo(point) >
          GPS_JITTER_METRES + MAX_GPS_SPEED_MPS * elapsed
      ) {
        segment = [];
      }
    }
    if (!segment.length) segments.push(segment);
    segment.push(point);
    previousIndex = i;
  }
  return segments;
}

function toLeafletPath(
  track: Track,
  range: [number, number] = [0, track.polyline.length - 1],
) {
  return routeSegments(track, range).map((points) => {
    // Leaflet skips one-vertex paths. A round-capped zero-length line shows
    // the single GPS fix without joining it to a different part of the route.
    return points.length === 1 ? [points[0], points[0]] : points;
  });
}

export function Map({
  className,
  polyline,
  time,
  timerPaused,
  focusRange,
  pins,
  highlights,
}: P) {
  const track = useMemo(
    () => ({ polyline, time, timerPaused }),
    [polyline, time, timerPaused],
  );
  const convertedPolyline = useMemo(() => toLeafletPath(track), [track]);
  const polylineBounds = useMemo(
    () => new LatLngBounds(convertedPolyline.flat()),
    [convertedPolyline],
  );
  const convertedFocusPolyline = useMemo(
    () => focusRange && toLeafletPath(track, focusRange),
    [track, focusRange],
  );
  const focusPoints = useMemo(
    () => convertedFocusPolyline?.flat(),
    [convertedFocusPolyline],
  );
  if (!polylineBounds.isValid()) return null;
  const span = Math.max(
    polylineBounds.getNorth() - polylineBounds.getSouth(),
    polylineBounds.getEast() - polylineBounds.getWest(),
  );
  return (
    <MapContainer
      center={polylineBounds.getCenter()}
      zoom={Math.min(18, Math.floor(Math.log2(360 / span)))}
      // Leaflet stacks its panes up to z-index 1000: without a stacking
      // context of its own the map covers the sticky headers
      className={cn('isolate', className)}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FitToSelection
        polylineBounds={polylineBounds}
        focusPolyline={focusPoints}
      />
      {polyline && (
        <Polyline
          positions={convertedPolyline}
          pathOptions={{ color: 'black' }}
        />
      )}
      {highlights?.map((highlight) => (
        <Polyline
          key={highlight.key}
          positions={toLeafletPath(track, highlight.range)}
          pathOptions={{ color: '#f97316', weight: 6, opacity: 0.8 }}
          eventHandlers={
            highlight.onClick ? { click: highlight.onClick } : undefined
          }
        >
          <Tooltip sticky>{highlight.label}</Tooltip>
        </Polyline>
      ))}
      {convertedFocusPolyline && (
        <Polyline
          positions={convertedFocusPolyline}
          pathOptions={{ color: 'blue' }}
        />
      )}
      {pins &&
        pins.filter(isValidGpsPoint).map((p, idx) => (
          <CircleMarker
            key={idx}
            center={new LatLng(p[0], p[1])}
            radius={4}
            pathOptions={{
              color: 'red',
              fillColor: 'red',
              fillOpacity: 1,
              weight: 0,
            }}
          />
        ))}
    </MapContainer>
  );
}

function FitToSelection({
  polylineBounds,
  focusPolyline,
}: {
  polylineBounds: LatLngBounds;
  focusPolyline?: LatLng[];
}) {
  const map = useMap();

  useEffect(() => {
    if (focusPolyline?.length) {
      const first = focusPolyline[0];
      if (first === focusPolyline[focusPolyline.length - 1]) {
        map.setView(first, Math.max(map.getZoom(), 15));
      } else {
        map.fitBounds(new LatLngBounds(focusPolyline), { padding: [16, 16] });
      }
    } else {
      // No selection: fit to full track
      map.fitBounds(polylineBounds, { padding: [16, 16] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    map,
    polylineBounds,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    focusPolyline && focusPolyline.length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    focusPolyline && focusPolyline[0]?.lat,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    focusPolyline && focusPolyline[0]?.lng,
  ]);

  return null;
}
