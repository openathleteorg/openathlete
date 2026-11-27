
import { useMemo, useState } from 'react';
import { subWeeks } from 'date-fns';

import {
  useStatisticsIntensityQuery,
} from '@/api/statistics';

import {
  SPORT_TYPE,
  SportGroup,
  StatisticsIntensityDto,
} from '@openathlete/shared';

import { intensityShares } from './intensity-data';

import {
  calculatePolarizationIndex,
  classifyByPolarizationIndex,
  classifyDistribution,
} from './intensity-analysis-utils';

import { IntensityAnalysisChart } from './intensity-analysis-chart';
import { IntensityAnalysisRecommendation } from './intensity-analysis-recommendation';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';

import type {
  IntensityAnalysis,
  IntensityPeriod,
  ZoneDistribution,
} from './intensity-analysis.types';

const MODEL_LABELS = {
  POLARIZED: 'Polarized',
  PYRAMIDAL: 'Pyramidal',
  THRESHOLD: 'Threshold-based',
  INVERTED_PYRAMIDAL: 'Inverted pyramidal',
  MIXED: 'Mixed distribution',
} as const;

const POLARIZATION_LABELS = {
  POLARIZED: 'Polarized distribution',
  NON_POLARIZED: 'Non-polarized distribution',
  UNDEFINED: 'Not applicable for this distribution',
} as const;

interface Props {
  athleteId: number;
  sport: SPORT_TYPE | null;
  group: SportGroup | null;
  endDate: Date;
}

const PERIODS: IntensityPeriod[] = [4, 8, 12];

/**
 * Converts intensity buckets into a three-zone distribution.
 */
function toThreeZoneDistribution(
  data: StatisticsIntensityDto,
): ZoneDistribution {
  const totals = data.buckets.reduce(
    (sum, bucket) => ({
      low: sum.low + bucket.low,
      middle: sum.middle + bucket.middle,
      high: sum.high + bucket.high,
    }),
    {
      low: 0,
      middle: 0,
      high: 0,
    },
  );

  const shares = intensityShares({
    period: '',
    partial: false,
    ...totals,
  });

  return {
    z1: shares.low,
    z2: shares.middle,
    z3: shares.high,
  };
}

export function IntensityAnalysisSection({
  athleteId,
  sport,
  group,
  endDate,
}: Props) {
  const [period, setPeriod] = useState<IntensityPeriod>(8);

  /**
   * Selected analysis period.
   */
  const from = useMemo(
    () => subWeeks(endDate, period),
    [endDate, period],
  );

  /**
   * Only intensity data is requested.
   */
  const {
    data: intensityData,
    isLoading,
    isFetching,
  } = useStatisticsIntensityQuery(
    {
      athleteId,
      from,
      to: endDate,
      sport: sport ?? undefined,
      group: group ?? undefined,
    },
    true,
  );

  /**
   * Convert API data into Z1 / Z2 / Z3.
   */
  const distribution = useMemo(() => {
    if (!intensityData) {
      return null;
    }

    return toThreeZoneDistribution(intensityData);
  }, [intensityData]);

  /**
   * Build analysis using only intensity distribution.
   */
  const analysis = useMemo(() => {
    if (!distribution) {
      return null;
    }

    const polarizationIndex =
      calculatePolarizationIndex(distribution);

    return {
      distribution,

      model: classifyDistribution(distribution),

      polarizationIndex,

      polarizationClassification:
        classifyByPolarizationIndex(polarizationIndex),

      trainingHistoryWeeks: period,

      references: {
        polarized: {
          z1: 75,
          z2: 5,
          z3: 20,
        },

        pyramidal: {
          z1: 70,
          z2: 20,
          z3: 10,
        },
      },
    } satisfies IntensityAnalysis;
  }, [distribution, period]);

  const hasTrainingData =
    distribution !== null &&
    distribution.z1 + distribution.z2 + distribution.z3 > 0;

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>
              Training intensity analysis
            </CardTitle>

            <p className="mt-1 text-sm text-muted-foreground">
              Understand how your training intensity is distributed.
            </p>
          </div>

          {analysis && hasTrainingData && (
            <Badge variant="secondary">
              {MODEL_LABELS[analysis.model]}
            </Badge>
          )}
        </div>

        {/* Period selector */}
        <div
          className="flex flex-wrap gap-2"
          aria-label="Analysis period"
        >
          {PERIODS.map((weeks) => (
            <button
              key={weeks}
              type="button"
              onClick={() => setPeriod(weeks)}
              aria-pressed={period === weeks}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                period === weeks
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              Last {weeks} weeks
            </button>
          ))}
        </div>

        {isFetching && (
          <p className="text-xs text-muted-foreground" role="status">
            Updating analysis...
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {isLoading && !intensityData ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Loading training intensity analysis...
          </p>
        ) : !intensityData || !hasTrainingData || !analysis ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No training intensity data available for the last {period} weeks.
          </p>
        ) : (
          <>
            <IntensityAnalysisChart
              actual={analysis.distribution}
              polarized={analysis.references.polarized}
              pyramidal={analysis.references.pyramidal}
            />

            {/* Zone distribution */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: 'Easy',
                  value: analysis.distribution.z1,
                  color: 'text-green-600',
                },
                {
                  label: 'Threshold',
                  value: analysis.distribution.z2,
                  color: 'text-amber-600',
                },
                {
                  label: 'High intensity',
                  value: analysis.distribution.z3,
                  color: 'text-red-600',
                },
              ].map((zone) => (
                <div
                  key={zone.label}
                  className="rounded-lg border p-3 text-center"
                >
                  <p className="text-xs text-muted-foreground">
                    {zone.label}
                  </p>

                  <p className={`mt-1 text-2xl font-semibold ${zone.color}`}>
                    {zone.value.toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>

            {/* Polarization index */}
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">
                Polarization index
              </p>

              <p className="mt-1 text-xl font-semibold">
                {analysis.polarizationIndex === null
                  ? 'Not applicable'
                  : analysis.polarizationIndex.toFixed(2)}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {POLARIZATION_LABELS[
                  analysis.polarizationClassification
                ]}
              </p>
            </div>

            {/* Recommendation */}
            <IntensityAnalysisRecommendation
              analysis={analysis}
            />

            <p className="text-xs leading-relaxed text-muted-foreground">
              Reference distributions are examples from endurance
              training research, not mandatory targets. Classification
              depends on physiological threshold mapping and the
              selected period. The polarization index follows the
              methodology of Treff et al. (2019).
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

