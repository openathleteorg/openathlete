import { useUnits } from '@/hooks/use-units';
import { m } from '@/paraglide/messages';
import { X } from 'lucide-react';
import { useMemo } from 'react';

import {
  ActivityStream,
  SPORT_TYPE,
  formatDuration,
  formatSpeed,
  formatSpeedUnit,
  getSportConfig,
} from '@openathlete/shared';

import { Button } from '../ui/button';
import { formatAxisValue } from './format';
import {
  XAxisKind,
  computeRangeStats,
  indexRange,
  xSeries,
} from './stream-range';
import { cadenceFactor } from './tracks';

interface P {
  stream: ActivityStream;
  sport: SPORT_TYPE;
  domain: [number, number];
  xAxis: XAxisKind;
  onClear: () => void;
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}

/** The figures of the part selected on the charts, a lap or a drag */
export function SelectionStats({ stream, sport, domain, xAxis, onClear }: P) {
  const units = useUnits();
  const config = getSportConfig(sport);
  const speedUnit = units.speedUnit(config.speedUnit);
  const stats = useMemo(() => {
    const series = xSeries(stream, xAxis);
    const range = series && indexRange(series, domain);
    return range ? computeRangeStats(stream, range) : null;
  }, [stream, domain, xAxis]);

  if (!stats) return null;
  const speed = (value: number) =>
    `${formatSpeed(value, speedUnit)} ${formatSpeedUnit(speedUnit)}`;

  return (
    <section
      aria-label={m.activity_selection_title()}
      className="rounded-lg border bg-muted/40 p-3"
      data-selection-stats
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">
          {m.activity_selection_title()}{' '}
          <span className="font-normal text-muted-foreground tabular-nums">
            {formatAxisValue(domain[0], xAxis, units)} –{' '}
            {formatAxisValue(domain[1], xAxis, units)}
          </span>
        </p>
        <Button
          size="icon"
          variant="ghost"
          className="size-8"
          onClick={onClear}
          aria-label={m.activity_selection_clear()}
          title={m.activity_selection_clear()}
        >
          <X className="size-4" />
        </Button>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
        <Figure
          label={m.duration()}
          value={formatDuration(stats.durationSec)}
        />
        {stats.distanceM !== undefined && (
          <Figure
            label={m.distance()}
            value={`${units.formatDist(stats.distanceM)} ${units.distanceLabel}`}
          />
        )}
        {config.showSpeed && stats.averageSpeed !== undefined && (
          <Figure label={m.average_speed()} value={speed(stats.averageSpeed)} />
        )}
        {config.showGap && stats.averageGapSpeed !== undefined && (
          <Figure label={m.gap()} value={speed(stats.averageGapSpeed)} />
        )}
        {stats.averageHeartrate !== undefined && (
          <Figure
            label={m.average_heart_rate()}
            value={`${Math.round(stats.averageHeartrate)} ${m.bpm()}`}
          />
        )}
        {stats.maxHeartrate !== undefined && (
          <Figure
            label={m.max_heart_rate()}
            value={`${Math.round(stats.maxHeartrate)} ${m.bpm()}`}
          />
        )}
        {stats.averagePower !== undefined && stats.maxPower !== undefined && (
          <Figure
            label={m.average_power()}
            value={`${Math.round(stats.averagePower)} ${m.watts()}`}
          />
        )}
        {stats.averageCadence !== undefined && (
          <Figure
            label={m.average_cadence()}
            value={`${Math.round(stats.averageCadence * cadenceFactor(sport))} ${
              cadenceFactor(sport) === 2 ? m.ppm() : m.rpm()
            }`}
          />
        )}
        {config.showElevation && stats.elevationGainM !== undefined && (
          <Figure
            label={m.elevation_gain()}
            value={`${units.elevation(stats.elevationGainM)} ${units.elevationLabel}`}
          />
        )}
        {config.showElevation && stats.elevationLossM !== undefined && (
          <Figure
            label={m.elevation_loss()}
            value={`${units.elevation(stats.elevationLossM)} ${units.elevationLabel}`}
          />
        )}
      </dl>
    </section>
  );
}
