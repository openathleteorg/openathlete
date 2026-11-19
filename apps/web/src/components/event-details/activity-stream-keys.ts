/**
 * The channels and resolution the activity details read: shared so that
 * whatever else needs the stream of the same activity hits the same cache.
 */
export const ACTIVITY_STREAM_RESOLUTION = 3000;
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
