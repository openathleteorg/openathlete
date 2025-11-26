import { NORMALIZATION_FACTOR } from '../../misc';

export interface EventNormalizationFactorDto {
  factor: NORMALIZATION_FACTOR;
  timeSeconds: number; // > 0 means time lost, < 0 means time gained
  percent: number; // fraction in [0,1]
}

export interface GetEventNormalizationResponseDto {
  averageNormalizedSpeed: number | null;
  factors: EventNormalizationFactorDto[];
}
