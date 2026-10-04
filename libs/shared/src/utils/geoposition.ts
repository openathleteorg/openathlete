/** Empty coordinate arrays represent missing GPS samples on the shared time axis. */
export const isValidGpsPoint = (point: unknown): point is [number, number] =>
  Array.isArray(point) &&
  point.length === 2 &&
  point.every((value) => typeof value === 'number' && Number.isFinite(value)) &&
  Math.abs(point[0]) <= 90 &&
  Math.abs(point[1]) <= 180;

/** Split instead of drawing a straight line across missing GPS samples. */
export const splitGpsPath = (path: number[][]): number[][][] => {
  const segments: number[][][] = [];
  let segment: number[][] = [];
  for (const point of path) {
    if (isValidGpsPoint(point)) {
      segment.push(point);
    } else if (segment.length) {
      segments.push(segment);
      segment = [];
    }
  }
  if (segment.length) segments.push(segment);
  return segments;
};

export const findPathCenter = (path: number[][]): number[] => {
  const latitudes = path.map((point) => point[0]);
  const longitudes = path.map((point) => point[1]);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  return [(minLatitude + maxLatitude) / 2, (minLongitude + maxLongitude) / 2];
};

export const findPathZoomLevel = (path: number[][]): number => {
  const latitudes = path.map((point) => point[0]);
  const longitudes = path.map((point) => point[1]);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const latDiff = maxLatitude - minLatitude;
  const lonDiff = maxLongitude - minLongitude;
  const latZoom = Math.floor(Math.log2(360 / latDiff));
  const lonZoom = Math.floor(Math.log2(360 / lonDiff));
  return Math.min(latZoom, lonZoom);
};
