import { useUnits } from '@/hooks/use-units';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { getStepTypeLabel } from '@/utils/workout/formatters';
import { useMemo, useState } from 'react';

import {
  ActivityEvent,
  WORKOUT_STEP_TYPE,
  formatDuration,
  formatSpeed,
  formatSpeedUnit,
  getSportConfig,
} from '@openathlete/shared';

import { useActivityDetailsSelection } from '../event-details/activity-details-selection-context';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  LapOptions,
  LapRow,
  LapSource,
  ResolvedTarget,
  availableLapSources,
  lapRows,
} from './laps';
import { stepComplianceDot, stepComplianceLabel } from './laps-options';
import { indexRange, xSeries } from './stream-range';

interface P {
  event: ActivityEvent;
  options: LapOptions;
}

/**
 * The activity cut into parts: the planned steps against their targets, the
 * watch's laps, or even splits. A row selects its part on the charts.
 */
export function LapsCard({ event, options }: P) {
  const units = useUnits();
  const config = getSportConfig(event.sport);
  const speedUnit = units.speedUnit(config.speedUnit);
  const { domain, setDomain, xAxis } = useActivityDetailsSelection();
  const sources = useMemo(() => availableLapSources(options), [options]);
  const [chosen, setChosen] = useState<LapSource>();
  const source = chosen && sources.includes(chosen) ? chosen : sources[0];
  const [workOnly, setWorkOnly] = useState(false);

  const allRows = useMemo(
    () => (source ? lapRows(source, options) : []),
    [source, options],
  );
  if (!source || !allRows.length) return null;
  const rows =
    source === 'plan' && workOnly
      ? allRows.filter((row) => row.active)
      : allRows;

  const has = (pick: (row: LapRow) => number | undefined) =>
    rows.some((row) => pick(row) !== undefined);
  const columns = {
    distance: has((row) => row.stats.distanceM),
    speed: config.showSpeed && has((row) => row.stats.averageSpeed),
    heartrate: has((row) => row.stats.averageHeartrate),
    power: has((row) => row.stats.averagePower),
    cadence: config.showCadence && has((row) => row.stats.averageCadence),
    elevation: config.showElevation && has((row) => row.stats.elevationGainM),
    target: source === 'plan' && rows.some((row) => row.target),
    climb: source === 'climbs',
  };

  const speed = (value: number) =>
    `${formatSpeed(value, speedUnit)} ${formatSpeedUnit(speedUnit)}`;
  const formatTarget = ({ metric, min, max }: ResolvedTarget) => {
    const one = (value: number) => {
      if (metric === 'speed') return formatSpeed(value, speedUnit);
      return `${Math.round(value)}`;
    };
    const unit =
      metric === 'speed'
        ? formatSpeedUnit(speedUnit)
        : metric === 'heartrate'
          ? m.bpm()
          : metric === 'power'
            ? m.watts()
            : options.cadenceFactor === 2
              ? m.ppm()
              : m.rpm();
    // Slower paces are lower speeds: list them first as a pace range reads
    const [low, high] =
      metric === 'speed' && config.speedLabel === 'pace'
        ? [max, min]
        : [min, max];
    return low === high
      ? `${one(low)} ${unit}`
      : `${one(low)}–${one(high)} ${unit}`;
  };
  const formatActual = (row: LapRow) => {
    if (!row.target || row.actual === undefined) return null;
    if (row.target.metric === 'speed')
      return formatSpeed(row.actual, speedUnit);
    return `${Math.round(row.actual)}`;
  };

  const sourceLabel = (value: LapSource) => {
    if (value === 'plan') return m.activity_laps_source_plan();
    if (value === 'device') return m.activity_laps_source_device();
    if (value === 'intervals') return m.activity_laps_source_intervals();
    if (value === 'climbs') return m.activity_laps_source_climbs();
    const meters = options.splitMeters ?? 1000;
    return m.activity_laps_source_splits({
      distance:
        meters >= 1000
          ? `${Number(units.distanceValue(meters).toFixed(2))} ${units.distanceLabel}`
          : `${meters} ${m.meters()}`,
    });
  };

  const series = xSeries(options.stream, xAxis);
  const select = (row: LapRow) => {
    const time = options.stream?.time;
    const range = time && indexRange(time, [row.startTime, row.endTime]);
    if (!range || !series) return;
    setDomain([series[range[0]], series[range[1]]]);
  };
  const isSelected = (row: LapRow) => {
    const time = options.stream?.time;
    const range = time && indexRange(time, [row.startTime, row.endTime]);
    return (
      !!domain &&
      !!range &&
      !!series &&
      domain[0] === series[range[0]] &&
      domain[1] === series[range[1]]
    );
  };

  const rowLabel = (row: LapRow, position: number) => {
    if (!row.planned) return `${position}`;
    const { step, repetition } = row.planned;
    const name =
      step.name || getStepTypeLabel(step.stepType as WORKOUT_STEP_TYPE);
    return repetition
      ? `${name} ${repetition.index}/${repetition.count}`
      : name;
  };

  return (
    <Card className="col-span-2" data-laps-card={source}>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle>{m.activity_laps_title()}</CardTitle>
        <div className="flex flex-wrap items-center gap-3">
          {source === 'plan' && (
            <div className="flex items-center gap-2">
              <Switch
                id={`work-only-${event.eventId}`}
                checked={workOnly}
                onCheckedChange={setWorkOnly}
              />
              <Label htmlFor={`work-only-${event.eventId}`} className="text-xs">
                {m.activity_laps_work_only()}
              </Label>
            </div>
          )}
          {sources.length > 1 && (
            <div
              role="group"
              aria-label={m.activity_laps_source()}
              className="flex rounded-md border p-0.5"
            >
              {sources.map((value) => (
                <Button
                  key={value}
                  size="sm"
                  variant={value === source ? 'secondary' : 'ghost'}
                  aria-pressed={value === source}
                  className="h-8 px-3 text-xs"
                  onClick={() => setChosen(value)}
                >
                  {sourceLabel(value)}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  {source === 'plan' ? m.activity_laps_step() : '#'}
                </TableHead>
                <TableHead className="text-right">{m.duration()}</TableHead>
                {columns.distance && (
                  <TableHead className="text-right">{m.distance()}</TableHead>
                )}
                {columns.speed && (
                  <TableHead className="text-right">
                    {config.speedLabel === 'pace' ? m.pace() : m.speed()}
                  </TableHead>
                )}
                {columns.heartrate && (
                  <TableHead className="text-right">{m.heart_rate()}</TableHead>
                )}
                {columns.power && (
                  <TableHead className="text-right">{m.power()}</TableHead>
                )}
                {columns.cadence && (
                  <TableHead className="text-right">{m.cadence()}</TableHead>
                )}
                {columns.elevation && (
                  <TableHead className="text-right">
                    {m.elevation_gain()}
                  </TableHead>
                )}
                {columns.climb && (
                  <>
                    <TableHead className="text-right">
                      {m.activity_climb_grade()}
                    </TableHead>
                    <TableHead className="text-right">
                      {m.activity_climb_category()}
                    </TableHead>
                  </>
                )}
                {columns.target && (
                  <TableHead>{m.activity_laps_target()}</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow
                  key={row.key}
                  data-lap-row={row.key}
                  data-state={isSelected(row) ? 'selected' : undefined}
                  className={cn(
                    'cursor-pointer tabular-nums',
                    !row.active && 'text-muted-foreground',
                  )}
                  onClick={() => select(row)}
                >
                  <TableCell className="whitespace-nowrap">
                    <button
                      type="button"
                      className="text-left font-medium hover:underline"
                      aria-label={`${rowLabel(row, i + 1)} · ${m.activity_laps_select()}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        select(row);
                      }}
                    >
                      {rowLabel(row, i + 1)}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatDuration(row.stats.durationSec)}
                  </TableCell>
                  {columns.distance && (
                    <TableCell className="text-right">
                      {row.stats.distanceM !== undefined
                        ? `${units.formatDist(row.stats.distanceM)} ${units.distanceLabel}`
                        : '–'}
                    </TableCell>
                  )}
                  {columns.speed && (
                    <TableCell className="text-right">
                      {row.stats.averageSpeed !== undefined
                        ? speed(row.stats.averageSpeed)
                        : '–'}
                    </TableCell>
                  )}
                  {columns.heartrate && (
                    <TableCell className="text-right">
                      {row.stats.averageHeartrate !== undefined
                        ? Math.round(row.stats.averageHeartrate)
                        : '–'}
                    </TableCell>
                  )}
                  {columns.power && (
                    <TableCell className="text-right">
                      {row.stats.averagePower !== undefined
                        ? Math.round(row.stats.averagePower)
                        : '–'}
                    </TableCell>
                  )}
                  {columns.cadence && (
                    <TableCell className="text-right">
                      {row.stats.averageCadence !== undefined
                        ? Math.round(
                            row.stats.averageCadence * options.cadenceFactor,
                          )
                        : '–'}
                    </TableCell>
                  )}
                  {columns.elevation && (
                    <TableCell className="text-right">
                      {row.stats.elevationGainM !== undefined
                        ? `${units.elevation(row.stats.elevationGainM)} ${units.elevationLabel}`
                        : '–'}
                    </TableCell>
                  )}
                  {columns.climb && row.climb && (
                    <>
                      <TableCell className="text-right">
                        {(row.climb.grade * 100).toFixed(1)}
                        {m.percent_symbol()}
                      </TableCell>
                      <TableCell className="text-right" data-climb-category>
                        {row.climb.category === 'HC'
                          ? m.activity_climb_hc()
                          : (row.climb.category ?? '–')}
                      </TableCell>
                    </>
                  )}
                  {columns.target && (
                    <TableCell className="whitespace-nowrap">
                      {row.target ? (
                        <span
                          className="flex items-center gap-2"
                          data-step-compliance={row.compliance}
                        >
                          {row.compliance && (
                            <span
                              aria-hidden
                              className={cn(
                                'size-2 shrink-0 rounded-full',
                                stepComplianceDot[row.compliance],
                              )}
                            />
                          )}
                          <span>{formatTarget(row.target)}</span>
                          {formatActual(row) && (
                            <span className="text-muted-foreground">
                              → {formatActual(row)}
                            </span>
                          )}
                          {row.compliance && (
                            <span className="sr-only">
                              {stepComplianceLabel[row.compliance]()}
                            </span>
                          )}
                        </span>
                      ) : (
                        '–'
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
