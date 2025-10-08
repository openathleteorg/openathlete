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

import { findPathCenter, findPathZoomLevel } from '@openathlete/shared';

interface P {
  className?: string;
  polyline: number[][];
  focusPolyline?: number[][];
  pins?: number[][];
}

export function Map({ className, polyline, focusPolyline, pins }: P) {
  const center = findPathCenter(polyline);
  const zoomLevel = findPathZoomLevel(polyline);
  const convertedPolyline = polyline.map(
    (path) => new LatLng(path[0], path[1]),
  );
  const convertedFocusPolyline = focusPolyline?.map(
    (path) => new LatLng(path[0], path[1]),
  );
  return (
    <MapContainer
      center={center as LatLngExpression}
      zoom={zoomLevel}
      className={className}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FitToSelection
        polyline={convertedPolyline}
        focusPolyline={convertedFocusPolyline}
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
        pins.map((p, idx) => (
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
    focusPolyline && focusPolyline.length,
    focusPolyline && focusPolyline[0]?.lat,
    focusPolyline && focusPolyline[0]?.lng,
  ]);

  return null;
}
