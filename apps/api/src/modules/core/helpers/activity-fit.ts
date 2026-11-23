import { Encoder } from '@garmin/fitsdk';

import {
  ActivityStream,
  SPORT_TYPE,
  isValidGpsPoint,
} from '@openathlete/shared';

import { fitSport } from './manual-fit-import';

/** FIT message numbers, from the FIT profile */
const FILE_ID = 0;
const SESSION = 18;
const LAP = 19;
const RECORD = 20;
const EVENT = 21;
const DEVICE_INFO = 23;
const ACTIVITY = 34;

/** FIT enum values, from the FIT profile */
const FILE_ACTIVITY = 4;
const MANUFACTURER_GARMIN = 1;
const MANUFACTURER_DEVELOPMENT = 255;
const EVENT_TIMER = 0;
const EVENT_ACTIVITY = 26;
const EVENT_TYPE_START = 0;
const EVENT_TYPE_STOP = 1;
const EVENT_TYPE_STOP_ALL = 4;

/**
 * The FIT sport and sub-sport of each of our sports, tried in order: the
 * first pair the importer reads back as the same sport wins, so an exported
 * file comes back as it left. Anything else is exported as generic.
 */
const FIT_SPORT_CANDIDATES: Array<[number, number]> = [
  [1, 0],
  [1, 3],
  [2, 0],
  [2, 8],
  [2, 46],
  [2, 58],
  [5, 0],
  [7, 0],
  [8, 0],
  [11, 0],
  [12, 0],
  [13, 0],
  [14, 0],
  [15, 0],
  [17, 0],
  [21, 0],
  [25, 0],
  [31, 0],
  [32, 0],
  [35, 0],
  [37, 0],
  [38, 0],
  [41, 0],
  [80, 0],
  [86, 0],
  [10, 20],
  [10, 43],
  [10, 44],
  [10, 15],
  [10, 70],
  [10, 0],
];

export function toFitSport(sport: SPORT_TYPE): [number, number] {
  return (
    FIT_SPORT_CANDIDATES.find(([fit, sub]) => fitSport(fit, sub) === sport) ?? [
      0, 0,
    ]
  );
}

const finite = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/** A value within the range of its FIT field, or nothing */
const within = (
  value: number | null | undefined,
  min: number,
  max: number,
): number | undefined =>
  finite(value) && value >= min && value <= max ? value : undefined;

/**
 * FIT times are seconds since 1989-12-31 UTC. Plain numbers rather than
 * dates: the SDK recognises only dates of its own realm.
 */
const FIT_EPOCH_SECONDS = Date.UTC(1989, 11, 31) / 1000;
const fitTime = (ms: number) => Math.round(ms / 1000) - FIT_EPOCH_SECONDS;

const semicircles = (degrees: number) => Math.round((degrees * 2 ** 31) / 180);

/**
 * An activity as a FIT activity file, for the tools that read nothing else
 * (WKO, Golden Cheetah, TrainingPeaks): one record per stream sample with
 * position, altitude, distance, speed, heart rate, cadence, power and
 * temperature, timer pauses as timer events, and one lap and one session
 * with the activity's totals. Null without a time stream.
 */
export function activityToFit(
  activity: {
    startDate: Date;
    endDate: Date;
    sport: SPORT_TYPE;
    distance?: number | null;
    movingTime?: number | null;
    elevationGain?: number | null;
    averageHeartrate?: number | null;
    maxHeartrate?: number | null;
    averageWatts?: number | null;
    /** The Garmin device the data comes from, which must be named */
    garminDevice?: { name: string | null } | null;
  },
  stream: ActivityStream,
): Uint8Array | null {
  const time = stream.time ?? [];
  if (!time.length || !time.every(finite)) return null;

  const start = activity.startDate.getTime();
  const at = (seconds: number) => fitTime(start + seconds * 1000);
  const last = time[time.length - 1];
  const elapsed = Math.max(
    last,
    (activity.endDate.getTime() - activity.startDate.getTime()) / 1000,
  );
  const paused = (i: number) => stream.timerPaused?.[i] === 1;
  let timer = 0;
  for (let i = 1; i < time.length; i++) {
    if (!paused(i - 1)) timer += Math.max(0, time[i] - time[i - 1]);
  }
  const timerTime = within(activity.movingTime, 0, elapsed) ?? timer;
  const [sport, subSport] = toFitSport(activity.sport);

  const encoder = new Encoder();
  encoder.onMesg(FILE_ID, {
    type: FILE_ACTIVITY,
    manufacturer: MANUFACTURER_DEVELOPMENT,
    product: 0,
    productName: 'OpenAthlete',
    timeCreated: fitTime(start),
  });
  if (activity.garminDevice) {
    // Garmin's brand guidelines: its data names it as its source
    encoder.onMesg(DEVICE_INFO, {
      timestamp: fitTime(start),
      deviceIndex: 0,
      manufacturer: MANUFACTURER_GARMIN,
      ...(activity.garminDevice.name
        ? { productName: activity.garminDevice.name }
        : {}),
    });
  }
  encoder.onMesg(EVENT, {
    timestamp: at(time[0]),
    event: EVENT_TIMER,
    eventType: EVENT_TYPE_START,
  });

  time.forEach((seconds, i) => {
    const point = stream.latlng?.[i];
    const position = isValidGpsPoint(point)
      ? {
          positionLat: semicircles(point[0]),
          positionLong: semicircles(point[1]),
        }
      : {};
    const values = {
      altitude: within(stream.altitude?.[i], -500, 12000),
      distance: within(stream.distance?.[i], 0, 4e7),
      speed: within(stream.speed?.[i], 0, 65),
      heartRate: within(stream.heartrate?.[i], 1, 254),
      cadence: within(stream.cadence?.[i], 0, 254),
      power: within(stream.watts?.[i], 0, 65000),
      temperature: within(stream.temp?.[i], -127, 127),
    };
    encoder.onMesg(RECORD, {
      timestamp: at(seconds),
      ...position,
      ...Object.fromEntries(
        Object.entries(values).flatMap(([key, value]) =>
          value === undefined
            ? []
            : [
                [
                  key,
                  ['heartRate', 'cadence', 'power', 'temperature'].includes(key)
                    ? Math.round(value)
                    : value,
                ],
              ],
        ),
      ),
    });
    if (paused(i) && i < time.length - 1) {
      encoder.onMesg(EVENT, {
        timestamp: at(seconds),
        event: EVENT_TIMER,
        eventType: EVENT_TYPE_STOP_ALL,
      });
      encoder.onMesg(EVENT, {
        timestamp: at(time[i + 1]),
        event: EVENT_TIMER,
        eventType: EVENT_TYPE_START,
      });
    }
  });

  const end = at(last);
  encoder.onMesg(EVENT, {
    timestamp: end,
    event: EVENT_TIMER,
    eventType: EVENT_TYPE_STOP_ALL,
  });
  const totals = {
    timestamp: end,
    startTime: at(time[0]),
    totalElapsedTime: elapsed,
    totalTimerTime: timerTime,
    ...(finite(activity.distance) ? { totalDistance: activity.distance } : {}),
    ...(within(activity.elevationGain, 0, 65000) !== undefined
      ? { totalAscent: Math.round(activity.elevationGain!) }
      : {}),
    ...(within(activity.averageHeartrate, 1, 254) !== undefined
      ? { avgHeartRate: Math.round(activity.averageHeartrate!) }
      : {}),
    ...(within(activity.maxHeartrate, 1, 254) !== undefined
      ? { maxHeartRate: Math.round(activity.maxHeartrate!) }
      : {}),
    ...(within(activity.averageWatts, 0, 65000) !== undefined
      ? { avgPower: Math.round(activity.averageWatts!) }
      : {}),
    sport,
    subSport,
  };
  encoder.onMesg(LAP, { ...totals, messageIndex: 0 });
  encoder.onMesg(SESSION, {
    ...totals,
    messageIndex: 0,
    firstLapIndex: 0,
    numLaps: 1,
  });
  encoder.onMesg(ACTIVITY, {
    timestamp: end,
    totalTimerTime: timerTime,
    numSessions: 1,
    type: 0,
    event: EVENT_ACTIVITY,
    eventType: EVENT_TYPE_STOP,
  });
  return encoder.close();
}

/** The name a downloaded file gets: the activity's date and name */
export function fitFileName(activity: { name: string; startDate: Date }) {
  const name =
    activity.name
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 60) || 'activity';
  return `${activity.startDate.toISOString().slice(0, 10)}-${name}.fit`;
}
