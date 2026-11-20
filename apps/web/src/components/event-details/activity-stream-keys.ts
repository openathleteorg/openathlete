/**
 * The channels and resolution the activity details read: shared so that
 * whatever else needs the stream of the same activity hits the same cache.
 */
export const ACTIVITY_STREAM_RESOLUTION = 3000;
/** Use recording timestamps to distinguish GPS sampling gaps from dropouts. */
export const ACTIVITY_ROUTE_RESOLUTION = 100_000;
export const ACTIVITY_ROUTE_KEYS = [
  'latlng',
  'time',
  'distance',
  'timerPaused',
];

export const ACTIVITY_STREAM_KEYS = [
  'altitude',
  'latlng',
  'heartrate',
  'distance',
  'speed',
  'timerPaused',
  'time',
  'watts',
  'gap',
  'temp',
  'cadence',
];
