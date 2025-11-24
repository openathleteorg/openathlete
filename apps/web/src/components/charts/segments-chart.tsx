import { m } from '@/paraglide/messages';
import { List, PanelRight } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  ActivitySegment,
  SPORT_TYPE,
  formatDistance,
  formatDuration,
  formatSpeed,
  formatSpeedUnit,
  getSportConfig,
} from '@openathlete/shared';

import { Button } from '../ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

type SegmentPoint = {
  id: number;
  label: string | null;
  displayIndex: number;
  averageSpeed: number;
  averageHeartrate: number | null;
  averageWatts: number | null;
  distance: number;
  movingTime: number | null;
  widthPercent: number;
};

interface P {
  segments: ActivitySegment[];
  sport: SPORT_TYPE;
}

export function SegmentsChart({ segments, sport }: P) {
  const speedConfig = getSportConfig(sport);
  const [view, setView] = useState<'chart' | 'table'>('chart');

  const points = useMemo<SegmentPoint[]>(() => {
    if (!segments?.length) {
      return [];
    }

    const sorted = [...segments].sort(
      (a, b) =>
        (a.startTimeSeconds ?? 0) - (b.startTimeSeconds ?? 0) ||
        (a.orderIndex ?? 0) - (b.orderIndex ?? 0),
    );

    const durations = sorted.map((segment) => {
      const explicit =
        typeof segment.endTimeSeconds === 'number' &&
        typeof segment.startTimeSeconds === 'number'
          ? Math.max(0, segment.endTimeSeconds - segment.startTimeSeconds)
          : 0;
      if (explicit > 0) {
        return explicit;
      }
      if (segment.movingTime && segment.movingTime > 0) {
        return segment.movingTime;
      }
      return 0;
    });

    const totalDuration = durations.reduce((sum, value) => sum + value, 0);
    if (!totalDuration) {
      return [];
    }

    const rawPoints = sorted.map((segment, index) => {
      const durationSeconds = durations[index] ?? 0;
      const movingTimeSeconds = segment.movingTime ?? durationSeconds ?? 0;
      const averageSpeed =
        segment.averageSpeed ??
        (segment.distance && movingTimeSeconds > 0
          ? segment.distance / movingTimeSeconds
          : 0);
      const distanceMeters =
        segment.distance ??
        (averageSpeed && durationSeconds ? averageSpeed * durationSeconds : 0);

      return {
        id: segment.activitySegmentId ?? index,
        label: segment.name ?? null,
        displayIndex: index + 1,
        averageSpeed,
        averageHeartrate: segment.averageHeartrate ?? null,
        averageWatts: segment.averageWatts ?? null,
        distance: distanceMeters,
        movingTime: movingTimeSeconds || null,
        widthPercent: Math.max(
          durationSeconds ? (durationSeconds / totalDuration) * 100 : 0,
          0.4,
        ),
      };
    });

    const widthSum = rawPoints.reduce(
      (sum, point) => sum + point.widthPercent,
      0,
    );

    if (rawPoints.length && Math.abs(widthSum - 100) > 0.01) {
      const adjustment = (100 - widthSum) / rawPoints.length;
      return rawPoints.map((point) => ({
        ...point,
        widthPercent: point.widthPercent + adjustment,
      }));
    }

    return rawPoints;
  }, [segments]);

  if (!points.length) {
    return null;
  }

  const speedValues = points
    .map((point) => point.averageSpeed)
    .filter((speed) => Number.isFinite(speed));
  const maxSpeed = speedValues.length ? Math.max(...speedValues) : 0;
  const padding = maxSpeed > 0 ? Math.max(maxSpeed * 0.1, 0.3) : 0.5;
  const maxDisplaySpeed = Math.max(maxSpeed + padding, 1);

  return (
    <div className="space-y-3">
      <div className="flex justify-end gap-2 -mt-12">
        <Button
          size="icon"
          variant={view === 'chart' ? 'default' : 'ghost'}
          onClick={() => setView('chart')}
          title={m.overview()}
        >
          <PanelRight className="size-4" />
        </Button>
        <Button
          size="icon"
          variant={view === 'table' ? 'default' : 'ghost'}
          onClick={() => setView('table')}
          title={m.table()}
        >
          <List className="size-4" />
        </Button>
      </div>
      {view === 'chart' ? (
        <div className="flex h-36 w-full items-end gap-[1px] sm:h-44">
          {points.map((point) => {
            const heightPercent =
              point.averageSpeed > 0
                ? (point.averageSpeed / maxDisplaySpeed) * 100
                : 4;
            return (
              <Tooltip key={`${point.id}-${point.displayIndex}`}>
                <TooltipTrigger asChild>
                  <div
                    className="relative rounded-[3px] bg-primary/70 transition-colors hover:bg-primary"
                    style={{
                      width: `${point.widthPercent}%`,
                      height: `${Math.max(6, heightPercent)}%`,
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" align="center" sideOffset={8}>
                  <div className="flex flex-col gap-1 text-left">
                    <span className="font-semibold">
                      {point.label ?? `${m.split()} ${point.displayIndex}`}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="text-muted-foreground">
                        {speedConfig.speedLabel === 'pace'
                          ? m.pace()
                          : m.speed()}
                        :
                      </span>
                      <span className="font-mono">
                        {formatSpeed(point.averageSpeed, speedConfig.speedUnit)}{' '}
                        {formatSpeedUnit(speedConfig.speedUnit)}
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="text-muted-foreground">
                        {m.distance()}:
                      </span>
                      <span className="font-mono">
                        {formatDistance(point.distance, 'km')} km
                      </span>
                    </span>
                    {point.movingTime && (
                      <span className="flex items-center gap-1">
                        <span className="text-muted-foreground">
                          {m.duration()}:
                        </span>
                        <span className="font-mono">
                          {formatDuration(point.movingTime)}
                        </span>
                      </span>
                    )}
                    {point.averageHeartrate && (
                      <span className="flex items-center gap-1">
                        <span className="text-muted-foreground">
                          {m.average_heart_rate()}:
                        </span>
                        <span className="font-mono">
                          {Math.round(point.averageHeartrate)} {m.bpm()}
                        </span>
                      </span>
                    )}
                    {point.averageWatts && (
                      <span className="flex items-center gap-1">
                        <span className="text-muted-foreground">
                          {m.power()}:
                        </span>
                        <span className="font-mono">
                          {Math.round(point.averageWatts)} {m.watts()}
                        </span>
                      </span>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{m.split()}</TableHead>
                <TableHead className="text-right">
                  {speedConfig.speedLabel === 'pace' ? m.pace() : m.speed()}
                </TableHead>
                <TableHead className="text-right">{m.distance()}</TableHead>
                <TableHead className="text-right">{m.duration()}</TableHead>
                <TableHead className="text-right">
                  {m.average_heart_rate()}
                </TableHead>
                <TableHead className="text-right">{m.power()}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {points.map((point) => (
                <TableRow key={`${point.id}-row`}>
                  <TableCell>
                    {point.label ?? `#${point.displayIndex}`}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatSpeed(point.averageSpeed, speedConfig.speedUnit)}{' '}
                    {formatSpeedUnit(speedConfig.speedUnit)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatDistance(point.distance, 'km')} km
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {point.movingTime
                      ? formatDuration(point.movingTime)
                      : m.na()}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {point.averageHeartrate
                      ? `${Math.round(point.averageHeartrate)} ${m.bpm()}`
                      : m.na()}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {point.averageWatts
                      ? `${Math.round(point.averageWatts)} ${m.watts()}`
                      : m.na()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
