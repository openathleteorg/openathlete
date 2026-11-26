import { useTrainingZones } from '@/hooks/use-training-zones';
import { useUnits } from '@/hooks/use-units';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { ZoomOut } from 'lucide-react';
import { PointerEvent, ReactNode, useMemo, useRef, useState } from 'react';
import {
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts';

import {
  ActivitySegment,
  ActivityStream,
  SPORT_TYPE,
  TRAINING_ZONE_TYPE,
  formatSpeed,
  formatSpeedUnit,
  getSportConfig,
} from '@openathlete/shared';

import { useActivityDetailsSelection } from '../event-details/activity-details-selection-context';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ChartContainer } from '../ui/chart';
import { formatAxisValue } from './format';
import { SelectionStats } from './selection-stats';
import { XAxisKind, indexRange, xSeries } from './stream-range';
import { ChartRow, TrackKey, buildChartRows, cadenceFactor } from './tracks';
import { useHiddenTracks } from './use-hidden-tracks';

const TRACK_COLORS: Record<TrackKey, string> = {
  speed: '#3b82f6',
  gap: '#8b5cf6',
  power: '#f59e0b',
  heartrate: '#ef4444',
  altitude: '#10b981',
  cadence: '#ec4899',
  temperature: '#f97316',
};

// A drag shorter than this share of the view is a tap, not a selection
const MIN_SELECTION_SHARE = 0.01;

interface P {
  stream: ActivityStream;
  sport: SPORT_TYPE;
  /** Whose zones colour the heart rate track */
  athleteId?: number;
  /** Device laps, shaded every other one */
  laps?: ActivitySegment[];
  onHover?: (hover?: { index: number; time: number }) => void;
}

/** First row at or after `x`, rows being sorted by x */
function rowAt(rows: ChartRow[], x: number): ChartRow | undefined {
  let lo = 0;
  let hi = rows.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (rows[mid].x < x) lo = mid + 1;
    else hi = mid;
  }
  return rows[lo];
}

/**
 * Every stream of an activity, stacked on one horizontal axis: hovering
 * reads all of them at once and moves the map's pin, dragging (with a mouse
 * or a finger) selects a part, whose figures show above.
 */
export function ActivityStreamsChart({
  stream,
  sport,
  athleteId,
  laps,
  onHover,
}: P) {
  const units = useUnits();
  const config = getSportConfig(sport);
  const speedUnit = units.speedUnit(config.speedUnit);
  const { domain, setDomain, reset, fullDomain, xAxis, setXAxis } =
    useActivityDetailsSelection();
  const { hidden, toggle } = useHiddenTracks(sport);
  const heartrateZones = useTrainingZones(
    TRAINING_ZONE_TYPE.HEARTRATE,
    sport,
    athleteId,
  );
  const plotRef = useRef<HTMLDivElement>(null);
  const [hoverX, setHoverX] = useState<number>();
  const [drag, setDrag] = useState<{ start: number; end: number }>();

  const { rows, tracks } = useMemo(
    () => buildChartRows(stream, sport, xAxis),
    [stream, sport, xAxis],
  );
  const visible = tracks.filter((track) => !hidden.includes(track));
  const view: [number, number] = domain ?? fullDomain ?? [0, 1];
  const canUseDistance =
    xSeries(stream, 'distance') !== xSeries(stream, 'time');

  const visibleRows = useMemo(() => {
    const range = indexRange(
      rows.map((row) => row.x),
      view,
    );
    return range ? rows.slice(range[0], range[1] + 1) : rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, view[0], view[1]]);

  // Laps are timed from the start: place them on the axis through time
  const lapAreas = useMemo(() => {
    const time = stream.time;
    const x = xSeries(stream, xAxis);
    if (!laps?.length || !time?.length || !x?.length) return [];
    return laps.flatMap((lap, i) => {
      const range = indexRange(time, [
        lap.startTimeSeconds,
        lap.endTimeSeconds,
      ]);
      return range && i % 2 === 1 ? [{ x1: x[range[0]], x2: x[range[1]] }] : [];
    });
  }, [laps, stream, xAxis]);

  const hoverRow = hoverX === undefined ? undefined : rowAt(rows, hoverX);

  const xAtPointer = (event: PointerEvent<HTMLDivElement>) => {
    const rect = plotRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return undefined;
    const share = Math.min(
      1,
      Math.max(0, (event.clientX - rect.left) / rect.width),
    );
    return view[0] + share * (view[1] - view[0]);
  };

  const hoverAt = (x: number | undefined) => {
    setHoverX(x);
    const row = x === undefined ? undefined : rowAt(rows, x);
    onHover?.(row ? { index: row.index, time: row.time } : undefined);
  };

  const formatTrack = (track: TrackKey, value: number): ReactNode => {
    switch (track) {
      case 'speed':
      case 'gap':
        return `${formatSpeed(value, speedUnit)} ${formatSpeedUnit(speedUnit)}`;
      case 'power':
        return `${Math.round(value)} ${m.watts()}`;
      case 'heartrate':
        return `${Math.round(value)} ${m.bpm()}`;
      case 'altitude':
        return `${units.elevation(value)} ${units.elevationLabel}`;
      case 'cadence':
        return `${Math.round(value)} ${cadenceFactor(sport) === 2 ? m.ppm() : m.rpm()}`;
      case 'temperature':
        return units.formatTemp(value);
    }
  };

  const trackLabel = (track: TrackKey): string => {
    switch (track) {
      case 'speed':
        return config.speedLabel === 'pace' ? m.pace() : m.speed();
      case 'gap':
        return m.gap();
      case 'power':
        return m.power();
      case 'heartrate':
        return m.heart_rate();
      case 'altitude':
        return m.altitude();
      case 'cadence':
        return m.cadence();
      case 'temperature':
        return m.temperature();
    }
  };

  if (!rows.length || !tracks.length) return null;

  const ticks = [0, 0.25, 0.5, 0.75, 1].map(
    (share) => view[0] + share * (view[1] - view[0]),
  );

  return (
    <Card className="col-span-2" data-activity-streams-chart>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle>{m.activity_charts_title()}</CardTitle>
        <div className="flex items-center gap-2">
          {canUseDistance && (
            <div
              role="group"
              aria-label={m.activity_chart_axis()}
              className="flex rounded-md border p-0.5"
            >
              {(['distance', 'time'] as XAxisKind[]).map((kind) => (
                <Button
                  key={kind}
                  size="sm"
                  variant={xAxis === kind ? 'secondary' : 'ghost'}
                  aria-pressed={xAxis === kind}
                  className="h-8 px-3 text-xs"
                  onClick={() => setXAxis(kind)}
                >
                  {kind === 'distance' ? m.distance() : m.activity_chart_time()}
                </Button>
              ))}
            </div>
          )}
          {domain && (
            <Button
              size="icon"
              variant="ghost"
              title={m.reset_zoom()}
              aria-label={m.reset_zoom()}
              onClick={reset}
            >
              <ZoomOut className="size-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div
          role="group"
          aria-label={m.activity_chart_tracks()}
          className="flex flex-wrap gap-1.5"
        >
          {tracks.map((track) => {
            const shown = !hidden.includes(track);
            return (
              <button
                key={track}
                type="button"
                aria-pressed={shown}
                data-track-toggle={track}
                onClick={() => toggle(track)}
                className={cn(
                  'flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors',
                  shown
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground opacity-70',
                )}
              >
                <span
                  aria-hidden
                  className="size-2 rounded-full"
                  style={{
                    background: shown ? TRACK_COLORS[track] : 'currentColor',
                  }}
                />
                {trackLabel(track)}
              </button>
            );
          })}
        </div>

        {domain && (
          <SelectionStats
            stream={stream}
            sport={sport}
            domain={domain}
            xAxis={xAxis}
            onClear={reset}
          />
        )}

        <div
          className="flex min-h-5 flex-wrap items-center gap-x-4 gap-y-1 text-xs"
          aria-live="off"
          data-chart-readout
        >
          {hoverRow ? (
            <>
              <span className="font-medium tabular-nums">
                {formatAxisValue(hoverRow.x, xAxis, units)}
              </span>
              {visible.map((track) => {
                const value = hoverRow[track];
                if (value === null || value === undefined) return null;
                return (
                  <span
                    key={track}
                    className="flex items-center gap-1 tabular-nums"
                  >
                    <span
                      aria-hidden
                      className="size-2 rounded-full"
                      style={{ background: TRACK_COLORS[track] }}
                    />
                    {formatTrack(track, value)}
                  </span>
                );
              })}
            </>
          ) : (
            <span className="text-muted-foreground">
              {m.activity_chart_hint()}
            </span>
          )}
        </div>

        <div
          ref={plotRef}
          className="relative select-none touch-pan-y"
          onPointerDown={(event) => {
            const x = xAtPointer(event);
            if (x === undefined) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            setDrag({ start: x, end: x });
            hoverAt(x);
          }}
          onPointerMove={(event) => {
            const x = xAtPointer(event);
            if (x === undefined) return;
            if (drag) setDrag({ ...drag, end: x });
            hoverAt(x);
          }}
          onPointerUp={() => {
            if (drag) {
              const from = Math.min(drag.start, drag.end);
              const to = Math.max(drag.start, drag.end);
              if (to - from > (view[1] - view[0]) * MIN_SELECTION_SHARE)
                setDomain([from, to]);
            }
            setDrag(undefined);
          }}
          onPointerCancel={() => setDrag(undefined)}
          onPointerLeave={() => {
            if (!drag) hoverAt(undefined);
          }}
          onDoubleClick={reset}
          data-chart-plot
        >
          {visible.map((track) => {
            const values = visibleRows.flatMap((row) => {
              const value = row[track];
              return value === null || value === undefined ? [] : [value];
            });
            const min = Math.min(...values);
            const max = Math.max(...values);
            const pad = (max - min) * 0.05 || 1;
            const yDomain: [number, number] = [min - pad, max + pad];
            return (
              <div key={track} data-track={track}>
                <div className="flex items-baseline justify-between text-[11px] text-muted-foreground">
                  <span>{trackLabel(track)}</span>
                </div>
                <ChartContainer
                  config={{ [track]: { label: trackLabel(track) } }}
                  className="aspect-auto h-16 w-full"
                >
                  <LineChart
                    data={rows}
                    margin={{ top: 2, right: 0, bottom: 2, left: 0 }}
                  >
                    <XAxis
                      type="number"
                      dataKey="x"
                      domain={view}
                      allowDataOverflow
                      hide
                    />
                    <YAxis
                      type="number"
                      domain={yDomain}
                      allowDataOverflow
                      hide
                    />
                    {lapAreas.map((area, i) => (
                      <ReferenceArea
                        key={`lap-${i}`}
                        x1={area.x1}
                        x2={area.x2}
                        fill="currentColor"
                        fillOpacity={0.05}
                        strokeOpacity={0}
                        ifOverflow="hidden"
                      />
                    ))}
                    {track === 'heartrate' &&
                      heartrateZones.map((zone) => (
                        <ReferenceArea
                          key={zone.id}
                          y1={zone.min}
                          y2={zone.max}
                          fill={zone.color}
                          fillOpacity={0.08}
                          strokeOpacity={0}
                          ifOverflow="hidden"
                        />
                      ))}
                    <Line
                      type="monotone"
                      dataKey={track}
                      stroke={TRACK_COLORS[track]}
                      dot={false}
                      strokeWidth={1.25}
                      isAnimationActive={false}
                      connectNulls={false}
                    />
                    {hoverRow && (
                      <ReferenceLine
                        x={hoverRow.x}
                        stroke="currentColor"
                        strokeOpacity={0.4}
                      />
                    )}
                    {drag && drag.end !== drag.start && (
                      <ReferenceArea
                        x1={drag.start}
                        x2={drag.end}
                        fill="currentColor"
                        fillOpacity={0.12}
                        strokeOpacity={0}
                      />
                    )}
                  </LineChart>
                </ChartContainer>
              </div>
            );
          })}
          <div className="relative mt-1 h-4 text-[11px] tabular-nums text-muted-foreground">
            {ticks.map((tick, i) => (
              <span
                key={i}
                className={cn(
                  'absolute top-0',
                  i === 0 && 'left-0',
                  i === ticks.length - 1 && 'right-0',
                  i > 0 && i < ticks.length - 1 && '-translate-x-1/2',
                )}
                style={
                  i > 0 && i < ticks.length - 1
                    ? { left: `${(i / (ticks.length - 1)) * 100}%` }
                    : undefined
                }
              >
                {formatAxisValue(tick, xAxis, units)}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
