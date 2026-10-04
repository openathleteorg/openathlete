import { LatLng, LatLngBounds, LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo } from 'react';
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  useMap,
} from 'react-leaflet';

import {
  findPathCenter,
  findPathZoomLevel,
  isValidGpsPoint,
  splitGpsPath,
} from '@openathlete/shared';

interface P {
  className?: string;
  polyline: number[][];
  focusPolyline?: number[][];
  pins?: number[][];
}

export function Map({ className, polyline, focusPolyline, pins }: P) {
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
      className={className}
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
