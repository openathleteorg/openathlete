export interface ActivityStream {
  time?: number[];
  distance?: number[];
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
  | { r: number; v: number | number[] } // repeat
  | { s: number; i: number } // increment
  | (number | number[]);

export interface CompressedActivityStream {
  time?: CompressedActivityStreamUnit[];
  distance?: CompressedActivityStreamUnit[];
  latlng?: CompressedActivityStreamUnit[];
  altitude?: CompressedActivityStreamUnit[];
  heartrate?: CompressedActivityStreamUnit[];
  cadence?: CompressedActivityStreamUnit[];
  watts?: CompressedActivityStreamUnit[];
  temp?: CompressedActivityStreamUnit[];
  gap?: CompressedActivityStreamUnit[]; // grade-adjusted speed (m/s)
  norm?: CompressedActivityStreamUnit[]; // normalized speed (m/s)
}
