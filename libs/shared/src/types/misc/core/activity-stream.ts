export interface ActivityStream {
  time?: number[];
  distance?: number[];
  /** Recorded speed in m/s, with null for unavailable samples. */
  speed?: (number | null)[];
  /** 1 if the interval until the next sample overlaps a timer pause, else 0. */
  timerPaused?: number[];
  /** One entry per time sample; [] means GPS unavailable (never [0, 0]). */
  latlng?: number[][];
  altitude?: number[];
  heartrate?: number[];
  cadence?: number[];
  watts?: number[];
  temp?: number[];
  gap?: number[]; // grade-adjusted speed (m/s)
  norm?: number[]; // normalized speed (m/s) accounting for slope, weather, altitude, etc.
}

export type CompressedActivityStreamUnit =
  | { r: number; v: number | number[] | null } // repeat
  | { s: number; i: number } // increment
  | (number | number[] | null);

export interface CompressedActivityStream {
  time?: CompressedActivityStreamUnit[];
  distance?: CompressedActivityStreamUnit[];
  speed?: CompressedActivityStreamUnit[];
  timerPaused?: CompressedActivityStreamUnit[];
  latlng?: CompressedActivityStreamUnit[];
  altitude?: CompressedActivityStreamUnit[];
  heartrate?: CompressedActivityStreamUnit[];
  cadence?: CompressedActivityStreamUnit[];
  watts?: CompressedActivityStreamUnit[];
  temp?: CompressedActivityStreamUnit[];
  gap?: CompressedActivityStreamUnit[]; // grade-adjusted speed (m/s)
  norm?: CompressedActivityStreamUnit[]; // normalized speed (m/s)
}
