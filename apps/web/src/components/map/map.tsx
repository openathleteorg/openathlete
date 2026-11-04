import { cn } from '@/utils/shadcn';
import { LatLng, LatLngBounds, LatLngExpression } from 'leaflet';
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

import {
  findPathCenter,
  findPathZoomLevel,
  isValidGpsPoint,
  splitGpsPath,
} from '@openathlete/shared';

/** A part of the track drawn over it, such as a climb, that can be picked */
export interface MapHighlight {
  key: string;
  path: number[][];
  label: string;
  onClick?: () => void;
}

interface P {
  className?: string;
  polyline: number[][];
  focusPolyline?: number[][];
  pins?: number[][];
  highlights?: MapHighlight[];
}

export function Map({
  className,
  polyline,
  focusPolyline,
  pins,
  highlights,
}: P) {
  const validPoints = polyline.filter(isValidGpsPoint);
  if (!validPoints.length) return null;
  const center = findPathCenter(validPoints);
  const zoomLevel = Math.min(18, findPathZoomLevel(validPoints));
  const convert = (path: number[][]) => path.map((p) => new LatLng(p[0], p[1]));
  const convertedPolyline = splitGpsPath(polyline).map(convert);
  const convertedFocusPolyline =
    focusPolyline && splitGpsPath(focusPolyline).map(convert);
  return (
    <MapContainer
      center={center as LatLngExpression}
      zoom={zoomLevel}
      // Leaflet stacks its panes up to z-index 1000: without a stacking
      // context of its own the map covers the sticky headers
      className={cn('isolate', className)}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FitToSelection
        polyline={convertedPolyline.flat()}
        focusPolyline={convertedFocusPolyline?.flat()}
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
          positions={splitGpsPath(highlight.path).map(convert)}
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
  polyline,
  focusPolyline,
}: {
  polyline: LatLng[];
  focusPolyline?: LatLng[];
}) {
  const map = useMap();
  const polylineBounds = useMemo(() => {
    const b = new LatLngBounds([]);
    polyline.forEach((p) => b.extend(p));
    return b;
  }, [polyline]);

  useEffect(() => {
    if (focusPolyline && focusPolyline.length > 1) {
      const fb = new LatLngBounds([]);
      focusPolyline.forEach((p) => fb.extend(p));
      map.fitBounds(fb, { padding: [16, 16] });
    } else if (focusPolyline && focusPolyline.length === 1) {
      map.setView(focusPolyline[0], Math.max(map.getZoom(), 15));
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
