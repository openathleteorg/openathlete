
import type { ZoneDistribution } from './intensity-analysis.types';

interface Props {
  actual: ZoneDistribution;
  polarized: ZoneDistribution;
  pyramidal: ZoneDistribution;
}

/**
 * Same colors for every distribution.
 * Colors represent intensity zones, not training models.
 */
const ZONES = [
  {
    key: 'z1',
    label: 'Z1 · Easy',
    color: '#86D9A0',
  },
  {
    key: 'z2',
    label: 'Z2 · Threshold',
    color: '#FDBA74',
  },
  {
    key: 'z3',
    label: 'Z3 · High intensity',
    color: '#FCA5A5',
  },
] as const;

function DistributionBar({
  distribution,
}: {
  distribution: ZoneDistribution;
}) {
  return (
    <div className="flex h-5 w-full overflow-hidden rounded-full bg-muted">
      {ZONES.map((zone) => {
        const value = Math.max(
          0,
          Math.min(100, distribution[zone.key]),
        );

        return (
          <div
            key={zone.key}
            style={{
              width: `${value}%`,
              backgroundColor: zone.color,
            }}
            title={`${zone.label}: ${distribution[zone.key].toFixed(1)}%`}
          />
        );
      })}
    </div>
  );
}

export function IntensityAnalysisChart({
  actual,
  polarized,
  pyramidal,
}: Props) {
  const rows = [
    {
      label: 'Your training',
      value: actual,
    },
    {
      label: 'Polarized reference',
      value: polarized,
    },
    {
      label: 'Pyramidal reference',
      value: pyramidal,
    },
  ];

  return (
    <div className="space-y-5">
      {rows.map((row) => (
        <div key={row.label} className="space-y-2">
          <div className="flex flex-wrap justify-between gap-2 text-sm font-medium">
            <span>{row.label}</span>

            <span className="text-muted-foreground tabular-nums">
              {row.value.z1.toFixed(0)} /{' '}
              {row.value.z2.toFixed(0)} /{' '}
              {row.value.z3.toFixed(0)}%
            </span>
          </div>

          <DistributionBar distribution={row.value} />
        </div>
      ))}

      <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2">
        {ZONES.map((zone) => (
          <div key={zone.key} className="flex items-center gap-2">
            <span
              className="size-3 shrink-0 rounded-sm"
              style={{ backgroundColor: zone.color }}
            />

            <span className="text-xs text-muted-foreground">
              {zone.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

