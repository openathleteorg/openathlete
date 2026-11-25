export interface ZoneDistribution {
  z1: number;
  z2: number;
  z3: number;
}

export type IntensityModel =
  | 'POLARIZED'
  | 'PYRAMIDAL'
  | 'THRESHOLD'
  | 'INVERTED_PYRAMIDAL'
  | 'MIXED';

export type IntensityPeriod = 4 | 8 | 12;

export type PolarizationClassification =
  | 'POLARIZED'
  | 'NON_POLARIZED'
  | 'UNDEFINED';

export interface IntensityAnalysis {
  distribution: ZoneDistribution;

  model: IntensityModel;

  polarizationIndex: number | null;

  polarizationClassification: PolarizationClassification;

  trainingHistoryWeeks: number;

  references: {
    polarized: ZoneDistribution;
    pyramidal: ZoneDistribution;
  };
}
