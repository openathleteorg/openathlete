import { LatLng, LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CircleMarker, MapContainer, Polyline, TileLayer } from 'react-leaflet';

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
      {polyline && (
        <Polyline
          positions={convertedPolyline}
          pathOptions={{ color: 'var(--primary)' }}
        />
      )}
      {convertedFocusPolyline && (
        <Polyline
          positions={convertedFocusPolyline}
          pathOptions={{ color: 'red' }}
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
