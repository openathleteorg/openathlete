import { useGetRecordsQuery } from '@/api/record';
import {
  useStatisticsCardiacCostQuery,
  useStatisticsDurabilityQuery,
  useStatisticsTerrainQuery,
} from '@/api/statistics';
import { m } from '@/paraglide/messages';
import { subYears } from 'date-fns';
import { useMemo } from 'react';

import {
  SPORT_CONFIG,
  SPORT_TYPE,
  endOfDay,
  formatSpeed,
  formatSpeedUnit,
} from '@openathlete/shared';

import { MetricTile } from '../ui/metric-tile';
import { Skeleton } from '../ui/skeleton';
import {
  ProfileAxis,
  ProfileFigure,
  climbAt,
  descentAt,
  longDrift,
  progress,
  referenceOutput,
  strongestChanges,
} from './capacity-data';
import { criticalFit } from './critical-model';
import { QuickRead, QuickReadLine } from './quick-read';
import { StatSection } from './stat-section';

interface P {
  athleteId: number;
  sport: SPORT_TYPE;
}

const AXIS_LABELS: Record<ProfileAxis, () => string> = {
  climb: m.statistics_profile_climb,
  descent: m.statistics_profile_descent,
  critical: m.statistics_profile_critical,
  durability: m.statistics_profile_durability,
  cost: m.statistics_profile_cost,
};

/** The last twelve months against the twelve before, whatever the filters */
function useProfile({ athleteId, sport }: P, enabled: boolean) {
  const { now, yearAgo, twoYearsAgo } = useMemo(() => {
    const end = endOfDay(new Date());
    return {
      now: end,
      yearAgo: subYears(end, 1),
      twoYearsAgo: subYears(end, 2),
    };
  }, []);
  const recent = { athleteId, sport, from: yearAgo, to: now };
  const before = { athleteId, sport, from: twoYearsAgo, to: yearAgo };
  const terrain = useStatisticsTerrainQuery(recent, enabled);
  const terrainBefore = useStatisticsTerrainQuery(before, enabled);
  const cost = useStatisticsCardiacCostQuery(recent, enabled);
  const costBefore = useStatisticsCardiacCostQuery(before, enabled);
  const durability = useStatisticsDurabilityQuery(recent, enabled);
  const durabilityBefore = useStatisticsDurabilityQuery(before, enabled);
  const records = useGetRecordsQuery(recent, { enabled });
  const recordsBefore = useGetRecordsQuery(before, { enabled });

  const reference = referenceOutput(cost.data, costBefore.data);
  const fit = criticalFit(records.data ?? [], sport);
  const fitBefore = criticalFit(recordsBefore.data ?? [], sport);
  const figures: ProfileFigure[] = [
    {
      axis: 'climb',
      current: climbAt(terrain.data),
      previous: climbAt(terrainBefore.data),
      higherIsBetter: true,
    },
    {
      axis: 'descent',
      current: descentAt(terrain.data),
      previous: descentAt(terrainBefore.data),
      higherIsBetter: true,
    },
    {
      axis: 'critical',
      current: fit?.critical ?? null,
      previous: fitBefore?.critical ?? null,
      higherIsBetter: true,
    },
    {
      axis: 'durability',
      current: longDrift(durability.data),
      previous: longDrift(durabilityBefore.data),
      higherIsBetter: false,
    },
    {
      axis: 'cost',
      current: reference?.current ?? null,
      previous: reference?.previous ?? null,
      higherIsBetter: false,
    },
  ];
  return {
    figures,
    fit,
    reference,
    unit: cost.data?.unit,
    ready: !!terrain.data && !!cost.data && !!durability.data && !!records.data,
  };
}

function Profile({ athleteId, sport, visible }: P & { visible: boolean }) {
  const { figures, fit, reference, unit, ready } = useProfile(
    { athleteId, sport },
    visible,
  );
  if (!ready) {
    return (
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        {figures.map(({ axis }) => (
          <Skeleton key={axis} className="h-20 rounded-lg" />
        ))}
      </div>
    );
  }
  const display = ({ axis, current }: ProfileFigure) => {
    if (current === null) return { value: '–' };
    switch (axis) {
      case 'climb':
      case 'descent':
        return {
          value: `${Math.round(current)}`,
          unit: m.statistics_metres_per_hour(),
        };
      case 'critical': {
        if (fit?.kind === 'power') {
          return { value: `${Math.round(current)}`, unit: 'W' };
        }
        const speedUnit = SPORT_CONFIG[sport].speedUnit;
        return {
          value: formatSpeed(current, speedUnit),
          unit: formatSpeedUnit(speedUnit),
        };
      }
      case 'durability':
        return { value: current.toFixed(1), unit: m.percent_symbol() };
      case 'cost':
        return { value: `${Math.round(current)}`, unit: m.bpm() };
    }
  };
  const caption = (figure: ProfileFigure) => {
    if (figure.axis === 'cost' && reference) {
      return unit === 'power' ? `${reference.bin} W` : `${reference.bin} km/h`;
    }
    if (figure.axis === 'climb') return `+10${m.percent_symbol()}`;
    if (figure.axis === 'descent') return `-10${m.percent_symbol()}`;
    const change = progress(figure);
    return change === null
      ? undefined
      : `${change > 0 ? '+' : ''}${change.toFixed(1)}${m.percent_symbol()}`;
  };

  const known = figures.filter(({ current }) => current !== null);
  const missing = figures.filter(({ current }) => current === null);
  const { best, worst } = strongestChanges(figures);
  const lines: QuickReadLine[] = [
    ...(best
      ? [
          {
            kind: 'observation' as const,
            text: m.statistics_profile_read_best({
              axis: AXIS_LABELS[best.axis](),
            }),
          },
        ]
      : []),
    ...(worst
      ? [
          {
            kind: 'observation' as const,
            text: m.statistics_profile_read_worst({
              axis: AXIS_LABELS[worst.axis](),
            }),
          },
        ]
      : []),
    ...(missing.length
      ? [
          {
            kind: 'limit' as const,
            text: m.statistics_profile_read_missing({
              axes: missing.map(({ axis }) => AXIS_LABELS[axis]()).join(', '),
            }),
          },
        ]
      : []),
    { kind: 'limit', text: m.statistics_profile_read_limit() },
  ];
  return (
    <div className="space-y-4" data-capacity-profile>
      <p className="text-sm text-muted-foreground">
        {m.statistics_profile_coverage({
          known: known.length,
          total: figures.length,
        })}
      </p>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        {figures.map((figure) => (
          <MetricTile
            key={figure.axis}
            label={AXIS_LABELS[figure.axis]()}
            caption={caption(figure)}
            {...display(figure)}
          />
        ))}
      </div>
      <QuickRead lines={lines} />
    </div>
  );
}

/** Physical figures of the athlete: no score, no ranking against others. */
export function ProfileSection(props: P) {
  return (
    <StatSection plain id="profile" title={m.statistics_capacity_profile()}>
      {(visible) => <Profile {...props} visible={visible} />}
    </StatSection>
  );
}
