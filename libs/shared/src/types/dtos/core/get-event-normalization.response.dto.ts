import { normalization_factor } from '@openathlete/database';

export interface EventNormalizationFactorDto {
  factor: normalization_factor;
  timeSeconds: number; // > 0 means time lost, < 0 means time gained
  percent: number; // fraction in [0,1]
}

export interface GetEventNormalizationResponseDto {
  averageNormalizedSpeed: number | null;
  factors: EventNormalizationFactorDto[];
}
