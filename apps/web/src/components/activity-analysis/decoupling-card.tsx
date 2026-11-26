import { useUnits } from '@/hooks/use-units';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { useMemo, useState } from 'react';

import {
  ActivityStream,
  SPORT_TYPE,
  formatSpeed,
  formatSpeedUnit,
  getSportConfig,
} from '@openathlete/shared';
import {
  MIN_DECOUPLING_SECONDS,
  aerobicDecoupling,
  decouplingLevel,
} from '@openathlete/shared';

import { useActivityDetailsSelection } from '../event-details/activity-details-selection-context';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { indexRange, xSeries } from './stream-range';
import { buildChartRows } from './tracks';

// Slower than a slow walk is standing still, which says nothing of the drift
const MOVING_SPEED = 0.5;

const LEVEL_STYLE = {
  steady: 'bg-green-500',
  drift: 'bg-yellow-400',
  marked: 'bg-orange-500',
};
const LEVEL_TEXT = {
  steady: m.activity_decoupling_steady,
  drift: m.activity_decoupling_drift,
  marked: m.activity_decoupling_marked,
};

interface P {
  stream: ActivityStream;
  sport: SPORT_TYPE;
}

/**
 * How heart rate drifted against power or pace from the first half of the
 * effort to the second, warm-up left out, and the efficiency factor.
 */
export function DecouplingCard({ stream, sport }: P) {
  const units = useUnits();
  const config = getSportConfig(sport);
  const speedUnit = units.speedUnit(config.speedUnit);
  const { domain, xAxis } = useActivityDetailsSelection();
  const [warmupMinutes, setWarmupMinutes] = useState(0);

  const { rows, tracks } = useMemo(
    () => buildChartRows(stream, sport, 'time', { smooth: false }),
    [stream, sport],
  );
  // Power when there is some, else pace, grade adjusted on foot
  const output = tracks.includes('power')
    ? 'power'
    : tracks.includes('gap')
      ? 'gap'
      : tracks.includes('speed')
        ? 'speed'
        : undefined;
  const hasHeartrate = tracks.includes('heartrate');

  const base = useMemo((): [number, number] | null => {
    if (!rows.length) return null;
    if (!domain) return [0, rows.length - 1];
    const series = xSeries(stream, xAxis);
    return series ? indexRange(series, domain) : null;
  }, [rows.length, domain, stream, xAxis]);

  const totalMinutes = base
    ? Math.floor((rows[base[1]].time - rows[base[0]].time) / 60)
    : 0;
  // The warm-up slider only applies to the whole activity: a selection
  // already says which part to read
  const skipMinutes = domain ? 0 : Math.min(warmupMinutes, totalMinutes / 2);

  const result = useMemo(() => {
    if (!output || !hasHeartrate || !base) return null;
    const times = rows.map((row) => row.time);
    const range = indexRange(times, [
      times[base[0]] + skipMinutes * 60,
      times[base[1]],
    ]);
    if (!range) return null;
    return aerobicDecoupling(
      rows.map((row) => row[output]),
      rows.map((row) => row.heartrate),
      times,
      range,
      (value) => output !== 'power' && value < MOVING_SPEED,
    );
  }, [output, hasHeartrate, base, rows, skipMinutes]);

  if (!output || !result) return null;
  const level = decouplingLevel(result.percent);
  const usesPower = output === 'power';
  const formatOutput = (value: number) =>
    usesPower
      ? `${Math.round(value)} ${m.watts()}`
      : `${formatSpeed(value, speedUnit)} ${formatSpeedUnit(speedUnit)}`;
  const efficiency = usesPower
    ? `${result.efficiencyFactor.toFixed(2)} ${m.activity_ef_unit_power()}`
    : `${(result.efficiencyFactor * 60).toFixed(2)} ${m.activity_ef_unit_speed()}`;

  return (
    <Card className="col-span-2 sm:col-span-1" data-decoupling={level}>
      <CardHeader className="space-y-1">
        <CardTitle>{m.activity_decoupling_title()}</CardTitle>
        <p className="text-xs text-muted-foreground">
          {usesPower
            ? m.activity_decoupling_kind_power()
            : m.activity_decoupling_kind_pace()}
          {domain && ` · ${m.activity_zones_selection()}`}
        </p>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex items-baseline gap-3">
          <span
            className="text-3xl font-semibold tabular-nums"
            data-decoupling-percent
          >
            {result.percent.toFixed(1)}
            {m.percent_symbol()}
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span
              aria-hidden
              className={cn('size-2 rounded-full', LEVEL_STYLE[level])}
            />
            {result.durationSec < MIN_DECOUPLING_SECONDS
              ? m.activity_decoupling_short()
              : LEVEL_TEXT[level]()}
          </span>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
          {(
            [
              ['first', m.activity_decoupling_first_half(), result.firstHalf],
              [
                'second',
                m.activity_decoupling_second_half(),
                result.secondHalf,
              ],
            ] as const
          ).map(([key, label, part]) => (
            <div key={key}>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="tabular-nums">
                {formatOutput(part.output)} · {Math.round(part.heartrate)}{' '}
                {m.bpm()}
              </dd>
            </div>
          ))}
          <div className="col-span-2">
            <dt className="text-xs text-muted-foreground">
              {m.activity_efficiency_factor()}
            </dt>
            <dd className="tabular-nums">{efficiency}</dd>
          </div>
        </dl>

        {!domain && totalMinutes >= 4 && (
          <label className="block space-y-1">
            <span className="text-xs text-muted-foreground">
              {m.activity_decoupling_warmup({ minutes: skipMinutes })}
            </span>
            <input
              type="range"
              min={0}
              max={Math.floor(totalMinutes / 2)}
              step={1}
              value={skipMinutes}
              onChange={(event) => setWarmupMinutes(Number(event.target.value))}
              className="h-11 w-full accent-primary"
              data-decoupling-warmup
            />
          </label>
        )}
      </CardContent>
    </Card>
  );
}
