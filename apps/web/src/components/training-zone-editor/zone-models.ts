import { SPORT_TYPE, TRAINING_ZONE_TYPE } from '@openathlete/shared';

/** What a zone trains, for its description */
export type ZoneRole =
  | 'recovery'
  | 'endurance'
  | 'tempo'
  | 'subThreshold'
  | 'threshold'
  | 'vo2max'
  | 'anaerobic'
  | 'neuromuscular';

export interface ModelZone {
  /** Shown as "Zone {id}": 1, 5a, 1B… */
  id: string;
  role: ZoneRole;
  /** The zone of the five it falls in when zones are merged, 0 to 4 */
  merged: 0 | 1 | 2 | 3 | 4;
}

export type ZoneModelSport = 'run' | 'bike';

export interface ZoneModelTable {
  type: TRAINING_ZONE_TYPE;
  sport: ZoneModelSport | null;
  zones: ModelZone[];
  /**
   * Heart rate and power: the lower limit of each zone as a share of the
   * threshold, the first 0, the last open upwards
   */
  starts?: number[];
  /**
   * Pace: between two zones, the pace as a factor of the threshold pace,
   * slowest first. A zone is faster than the factor before it.
   */
  paceLimits?: number[];
}

export interface ZoneModel {
  id: 'friel' | 'coggan' | 'palladino' | 'vance' | 'stryd';
  author: string;
  source: string;
  tables: ZoneModelTable[];
}

const z = (id: string, role: ZoneRole, merged: ModelZone['merged']) => ({
  id,
  role,
  merged,
});

const FIVE: ModelZone[] = [
  z('1', 'recovery', 0),
  z('2', 'endurance', 1),
  z('3', 'tempo', 2),
  z('4', 'threshold', 3),
  z('5', 'vo2max', 4),
];

/** Friel's seven zones: 5a, 5b and 5c make zone 5 when merged */
const FRIEL_SEVEN: ModelZone[] = [
  z('1', 'recovery', 0),
  z('2', 'endurance', 1),
  z('3', 'tempo', 2),
  z('4', 'subThreshold', 3),
  z('5a', 'threshold', 4),
  z('5b', 'vo2max', 4),
  z('5c', 'anaerobic', 4),
];

/**
 * Training zone models, as shares of a threshold. Limits are the published
 * ones; a zone ends a beat, a watt or a second before the next one starts.
 */
export const ZONE_MODELS: ZoneModel[] = [
  {
    id: 'friel',
    author: 'Joe Friel',
    source: "Joe Friel's Quick Guide to Setting Zones (TrainingPeaks)",
    tables: [
      {
        // Run zones: Z1 < 85 %, Z2 85-89, Z3 90-94, Z4 95-99, Z5a 100-102,
        // Z5b 103-106, Z5c > 106 % of the lactate threshold heart rate
        type: TRAINING_ZONE_TYPE.HEARTRATE,
        sport: 'run',
        zones: FRIEL_SEVEN,
        starts: [0, 0.85, 0.9, 0.95, 1, 1.03, 1.07],
      },
      {
        // Bike zones: Z1 < 81 %, Z2 81-89, Z3 90-93, Z4 94-99, then as run
        type: TRAINING_ZONE_TYPE.HEARTRATE,
        sport: 'bike',
        zones: FRIEL_SEVEN,
        starts: [0, 0.81, 0.9, 0.94, 1, 1.03, 1.07],
      },
      {
        // Power from Allen & Coggan, as Friel gives it: Z1 < 55 %, Z2 55-74,
        // Z3 75-89, Z4 90-104, Z5 105-120, Z6 > 120 % of FTP
        type: TRAINING_ZONE_TYPE.POWER,
        sport: 'bike',
        zones: [...FIVE, z('6', 'anaerobic', 4)],
        starts: [0, 0.55, 0.75, 0.9, 1.05, 1.21],
      },
      {
        // Pace: Z1 slower than 129 %, Z2 114-129, Z3 106-113, Z4 99-105,
        // Z5a 97-100, Z5b 90-96, Z5c faster than 90 % of threshold pace
        type: TRAINING_ZONE_TYPE.PACE,
        sport: 'run',
        zones: FRIEL_SEVEN,
        paceLimits: [1.29, 1.14, 1.06, 0.99, 0.97, 0.9],
      },
    ],
  },
  {
    id: 'coggan',
    author: 'Andrew Coggan',
    source: 'Allen & Coggan, Training and Racing with a Power Meter',
    tables: [
      {
        // Power levels: L1 ≤ 55 %, L2 56-75, L3 76-90, L4 91-105, L5 106-120,
        // L6 121-150, L7 > 150 % of FTP
        type: TRAINING_ZONE_TYPE.POWER,
        sport: 'bike',
        zones: [...FIVE, z('6', 'anaerobic', 4), z('7', 'neuromuscular', 4)],
        starts: [0, 0.56, 0.76, 0.91, 1.06, 1.21, 1.51],
      },
      {
        // Heart rate by the same levels: ≤ 68 %, 69-83, 84-94, 95-105,
        // > 105 % of threshold heart rate
        type: TRAINING_ZONE_TYPE.HEARTRATE,
        sport: 'bike',
        zones: FIVE,
        starts: [0, 0.69, 0.84, 0.95, 1.06],
      },
    ],
  },
  {
    id: 'palladino',
    author: 'Steve Palladino',
    source: 'Palladino Power Project, Running Power Zones 2017',
    tables: [
      {
        // 1A 50-65 %, 1B 65-75, 1C 75-80, 2 above 80 to below 88, 3A 88 to
        // below 95, 3B 95-101, 4 above 101 to below 106, 5 106-116, 6 above
        // 116 to 150, 7 above 150 % of FTP or CP. Merged: zone 1
        // takes 1A-1C, zone 4 3B and 4, zone 5 everything from 106 %
        type: TRAINING_ZONE_TYPE.POWER,
        sport: 'run',
        zones: [
          z('1A', 'recovery', 0),
          z('1B', 'recovery', 0),
          z('1C', 'endurance', 0),
          z('2', 'endurance', 1),
          z('3A', 'tempo', 2),
          z('3B', 'threshold', 3),
          z('4', 'threshold', 3),
          z('5', 'vo2max', 4),
          z('6', 'anaerobic', 4),
          z('7', 'neuromuscular', 4),
        ],
        starts: [0, 0.65, 0.75, 0.81, 0.88, 0.95, 1.02, 1.06, 1.17, 1.51],
      },
    ],
  },
  {
    id: 'vance',
    author: 'Jim Vance',
    source: 'Vance, Run with Power, table 6.1',
    tables: [
      {
        // Table 6.1 of Run with Power: Z1 < 81 %, Z2 81-88, Z3 89-95,
        // Z4 96-105, Z5 106-115, Z6 116-128, Z7 129 % and more of rFTPw
        type: TRAINING_ZONE_TYPE.POWER,
        sport: 'run',
        zones: [...FIVE, z('6', 'anaerobic', 4), z('7', 'neuromuscular', 4)],
        starts: [0, 0.81, 0.89, 0.96, 1.06, 1.16, 1.29],
      },
    ],
  },
  {
    id: 'stryd',
    author: 'Stryd',
    source:
      'Stryd PowerCenter zones, as listed in Palladino Power Project, Running Power Zones 2017',
    tables: [
      {
        // Easy 65-80 %, Moderate 80-90, Threshold 90-100, Interval 100-115,
        // Repetition 115-130 % of critical power: five zones, nothing to
        // merge. Below 65 % counts as easy
        type: TRAINING_ZONE_TYPE.POWER,
        sport: 'run',
        zones: [
          z('1', 'endurance', 0),
          z('2', 'tempo', 1),
          z('3', 'threshold', 2),
          z('4', 'vo2max', 3),
          z('5', 'anaerobic', 4),
        ],
        starts: [0, 0.8, 0.9, 1, 1.15],
      },
    ],
  },
];

const RUNNING = new Set<string>([
  SPORT_TYPE.RUNNING,
  SPORT_TYPE.TRAIL_RUNNING,
  SPORT_TYPE.VIRTUAL_RUN,
]);
const CYCLING = new Set<string>([
  SPORT_TYPE.CYCLING,
  SPORT_TYPE.VIRTUAL_RIDE,
  SPORT_TYPE.MOUNTAIN_BIKE_RIDE,
  SPORT_TYPE.GRAVEL_RIDE,
  SPORT_TYPE.E_BIKE_RIDE,
  SPORT_TYPE.E_MOUNTAIN_BIKE_RIDE,
  SPORT_TYPE.HANDCYCLE,
]);

/** Run or bike, for the sports of a zone set; null when it has both or none */
export function zoneModelSport(sports: string[]): ZoneModelSport | null {
  const run = sports.some((sport) => RUNNING.has(sport));
  const bike = sports.some((sport) => CYCLING.has(sport));
  if (run === bike) return null;
  return run ? 'run' : 'bike';
}

export interface ZoneModelChoice {
  model: ZoneModel;
  table: ZoneModelTable;
}

/**
 * The tables that fit a zone type and a zone set's sports: those of its
 * sport, or of any sport when the set covers running and cycling alike.
 * Models without a table for the type stay out (Coggan has no running zones,
 * Palladino and Vance only running power).
 */
export function zoneModelChoices(
  type: TRAINING_ZONE_TYPE,
  sports: string[],
): ZoneModelChoice[] {
  const sport = zoneModelSport(sports);
  return ZONE_MODELS.flatMap((model) =>
    model.tables
      .filter(
        (table) =>
          table.type === type &&
          (table.sport === null || sport === null || table.sport === sport),
      )
      .map((table) => ({ model, table })),
  );
}

/**
 * The five zones of a table, its sub-zones merged: each of the five starts
 * where its first sub-zone does.
 */
export function mergedTable(table: ZoneModelTable): ZoneModelTable {
  const firsts = FIVE.map((_, index) =>
    table.zones.findIndex((zone) => zone.merged === index),
  ).filter((index) => index >= 0);
  return {
    ...table,
    zones: FIVE.slice(0, firsts.length),
    starts: table.starts && firsts.map((index) => table.starts![index]),
    paceLimits:
      table.paceLimits &&
      firsts.slice(1).map((index) => table.paceLimits![index - 1]),
  };
}

/**
 * Starting limits of five zones set by hand: those of the first published
 * model for the type and sport, merged, or of a common one when none fits
 * (Friel for heart rate and pace, Coggan for power)
 */
export function defaultCustomLimits(
  type: TRAINING_ZONE_TYPE,
  sports: string[],
): number[] {
  const [first] = zoneModelChoices(type, sports);
  const merged = first && mergedTable(first.table);
  if (merged?.starts) return merged.starts.slice(1);
  if (merged?.paceLimits) return merged.paceLimits;
  if (type === TRAINING_ZONE_TYPE.PACE) return [1.29, 1.14, 1.06, 0.99];
  if (type === TRAINING_ZONE_TYPE.POWER) return [0.56, 0.76, 0.91, 1.06];
  return [0.85, 0.9, 0.95, 1];
}

/**
 * Five zones from four limits set by hand, as shares of the threshold: the
 * lower limits of zones 2 to 5 for heart rate and power, rising; the paces
 * between zones for pace, as factors of the threshold pace, falling. Null
 * when they are not in order or not above zero.
 */
export function customTable(
  type: TRAINING_ZONE_TYPE,
  limits: number[],
): ZoneModelTable | null {
  if (limits.length !== 4 || limits.some((limit) => !(limit > 0))) return null;
  const pace = type === TRAINING_ZONE_TYPE.PACE;
  const ordered = limits.every((limit, index) =>
    index === 0
      ? true
      : pace
        ? limit < limits[index - 1]
        : limit > limits[index - 1],
  );
  if (!ordered) return null;
  return pace
    ? { type, sport: null, zones: FIVE, paceLimits: limits }
    : { type, sport: null, zones: FIVE, starts: [0, ...limits] };
}
