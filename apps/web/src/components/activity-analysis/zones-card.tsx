import { useTrainingZones } from '@/hooks/use-training-zones';
import { useUnits } from '@/hooks/use-units';
import { m } from '@/paraglide/messages';
import { useMemo, useState } from 'react';

import {
  ActivityEvent,
  ActivityStream,
  TRAINING_ZONE_TYPE,
  formatDuration,
  formatSpeed,
  formatSpeedUnit,
  getSportConfig,
} from '@openathlete/shared';

import { useActivityDetailsSelection } from '../event-details/activity-details-selection-context';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { indexRange, xSeries } from './stream-range';
import { TrackKey, buildChartRows } from './tracks';
import { paceZoneAsSpeed, timeInZones } from './zones';

type ZoneKind = 'heartrate' | 'speed' | 'power';

// Slower than a slow walk is standing still, in no pace zone
const MOVING_SPEED = 0.5;

interface P {
  event: ActivityEvent;
  stream: ActivityStream;
}

/**
 * Time spent in each of the athlete's heart rate, pace and power zones,
 * over the whole activity or the part selected on the charts.
 */
export function ZonesCard({ event, stream }: P) {
  const units = useUnits();
  const config = getSportConfig(event.sport);
  const speedUnit = units.speedUnit(config.speedUnit);
  const athleteId = event.athleteId ?? undefined;
  const { domain, xAxis } = useActivityDetailsSelection();
  const heartrateZones = useTrainingZones(
    TRAINING_ZONE_TYPE.HEARTRATE,
    event.sport,
    athleteId,
  );
  // Default zones exist for heart rate only: these are the athlete's own
  const paceZones = useTrainingZones(
    TRAINING_ZONE_TYPE.PACE,
    event.sport,
    athleteId,
  );
  const powerZones = useTrainingZones(
    TRAINING_ZONE_TYPE.POWER,
    event.sport,
    athleteId,
  );
  const zonesByKind: Record<ZoneKind, typeof heartrateZones> = {
    heartrate: heartrateZones,
    speed: paceZones,
    power: powerZones,
  };

  const { rows, tracks } = useMemo(
    () => buildChartRows(stream, event.sport, 'time', { smooth: false }),
    [stream, event.sport],
  );
  const kinds = (['heartrate', 'speed', 'power'] as ZoneKind[]).filter(
    (kind) => tracks.includes(kind as TrackKey) && zonesByKind[kind].length > 0,
  );
  const [chosen, setChosen] = useState<ZoneKind>();
  const kind = chosen && kinds.includes(chosen) ? chosen : kinds[0];

  const range = useMemo((): [number, number] | null => {
    if (!rows.length) return null;
    if (!domain) return [0, rows.length - 1];
    const series = xSeries(stream, xAxis);
    return series ? indexRange(series, domain) : null;
  }, [rows.length, domain, stream, xAxis]);

  const result = useMemo(() => {
    if (!kind || !range) return [];
    const zones =
      kind === 'heartrate'
        ? heartrateZones
        : kind === 'power'
          ? powerZones
          : paceZones.map((zone) => paceZoneAsSpeed(zone));
    return timeInZones(
      rows.map((row) => row[kind]),
      rows.map((row) => row.time),
      zones,
      range,
      (value) => (kind === 'speed' ? value < MOVING_SPEED : value <= 0),
    );
  }, [kind, range, rows, heartrateZones, paceZones, powerZones]);

  if (!kind || !result.length) return null;
  const maxShare = Math.max(...result.map((r) => r.share), 0.01);

  const label = (value: ZoneKind) =>
    value === 'heartrate'
      ? m.heart_rate()
      : value === 'power'
        ? m.power()
        : config.speedLabel === 'pace'
          ? m.pace()
          : m.speed();
  const bounds = (zone: { min: number; max: number }) => {
    if (kind === 'speed') {
      const speed = paceZoneAsSpeed({ id: 0, ...zone });
      const unit = formatSpeedUnit(speedUnit);
      // Read from slow to fast, as the zones go up
      return `${formatSpeed(speed.min, speedUnit)}–${formatSpeed(speed.max, speedUnit)} ${unit}`;
    }
    const unit = kind === 'power' ? m.watts() : m.bpm();
    return `${Math.round(zone.min)}–${Math.round(zone.max)} ${unit}`;
  };

  return (
    <Card className="col-span-2 sm:col-span-1" data-zones-card={kind}>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle>{m.activity_zones_title()}</CardTitle>
        {kinds.length > 1 && (
          <div
            role="group"
            aria-label={m.activity_zones_title()}
            className="flex rounded-md border p-0.5"
          >
            {kinds.map((value) => (
              <Button
                key={value}
                size="sm"
                variant={value === kind ? 'secondary' : 'ghost'}
                aria-pressed={value === kind}
                className="h-8 px-3 text-xs"
                onClick={() => setChosen(value)}
              >
                {label(value)}
              </Button>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {domain && (
          <p className="text-xs text-muted-foreground" data-zones-selection>
            {m.activity_zones_selection()}
          </p>
        )}
        <ul className="space-y-2">
          {result.map(({ zone, seconds, share }) => (
            <li
              key={zone.id}
              className="grid grid-cols-[minmax(0,7rem)_1fr_auto] items-center gap-3 text-sm"
              data-zone={zone.id}
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{zone.name}</span>
                <span className="block truncate text-xs text-muted-foreground tabular-nums">
                  {bounds(zone)}
                </span>
              </span>
              <span className="h-3 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${(share / maxShare) * 100}%`,
                    background: zone.color ?? 'var(--chart-1)',
                  }}
                />
              </span>
              <span className="text-right tabular-nums">
                {formatDuration(Math.round(seconds))}
                <span className="ml-2 inline-block w-10 text-muted-foreground">
                  {Math.round(share * 100)}
                  {m.percent_symbol()}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
