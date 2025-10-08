import { m } from '@/paraglide/messages';
import { useGetEventNormalizationQuery } from '@/services/event';
import type { GetEventNormalizationResponseDto } from '@/services/event/event.service';
import { computeHoverPin } from '@/utils/map-hover';
import { ZoomOut } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  ActivityEvent,
  ActivityStream,
  formatDuration,
  formatSpeed,
} from '@openathlete/shared';

import { AltitudeChart } from '../../charts/altitude-chart';
import { GapChart } from '../../charts/gap-chart';
import { HeartrateChart } from '../../charts/heartrate-chart';
import { HeartrateDistributionChart } from '../../charts/heartrate-distribution-chart';
import { PowerChart } from '../../charts/power-chart';
import { RecordsChart } from '../../charts/records-chart';
import { SpeedChart } from '../../charts/speed-chart';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table';
import { ActivityDetailsMap } from '../activity-details-map';
import {
  ActivityDetailsSelectionProvider,
  useActivityDetailsSelection,
} from '../activity-details-selection-context';
import { ActivityStatistics } from '../activity-statistics';

interface P {
  event: ActivityEvent;
  stream: ActivityStream | undefined;
}

export function ActivityDetailsOverviewTab({ event, stream }: P) {
  const [hover, setHover] = useState<
    undefined | { index: number; time: number }
  >();

  const hoverPin = useMemo(
    () => computeHoverPin(stream?.latlng, stream?.time, hover),
    [hover, stream],
  );

  const fullDomain: [number, number] | undefined = useMemo(() => {
    const d = stream?.distance;
    if (d?.length) return [d[0], d[d.length - 1]];
    const t = stream?.time;
    if (t?.length) return [t[0], t[t.length - 1]];
    return undefined;
  }, [stream?.distance, stream?.time]);

  const { data: normalization } = useGetEventNormalizationQuery(event.eventId);

  const normLabel = (factor: string) => {
    const key = `normalization_${factor.toLowerCase()}` as keyof typeof m;
    const fn = (m as any)[key];
    return typeof fn === 'function' ? fn() : factor;
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>{m.statistics()}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ActivityStatistics event={event} stream={stream} />
          </div>
        </CardContent>
      </Card>
      {stream?.latlng && stream.time && fullDomain && (
        <>
          <ActivityDetailsSelectionProvider fullDomain={fullDomain}>
            {stream?.latlng && (
              <ActivityDetailsMap
                className="col-span-1 rounded-xl shadow-sm border"
                polyline={stream.latlng}
                pins={hoverPin}
                distance={stream.distance}
                time={stream.time}
              />
            )}
            {(() => {
              function ZoomResetButton() {
                const { reset, domain } = useActivityDetailsSelection();
                if (!domain) return null;
                return (
                  <Button
                    size="icon"
                    variant="ghost"
                    title={m.reset_zoom()}
                    onClick={reset}
                  >
                    <ZoomOut className="size-4" />
                  </Button>
                );
              }
              return (
                <>
                  <Card className="col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>{m.pace()}</CardTitle>
                      <div className="absolute right-10">
                        <ZoomResetButton />
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <SpeedChart
                        latLngStream={stream.latlng}
                        timeStream={stream.time}
                        distanceStream={stream.distance}
                        onHover={setHover}
                      />
                    </CardContent>
                  </Card>
                  {stream && stream.gap && (
                    <Card className="col-span-2">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>{m.gap()}</CardTitle>
                        <div className="absolute right-10">
                          <ZoomResetButton />
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <GapChart
                          gapStream={stream.gap as number[]}
                          timeStream={stream.time}
                          distanceStream={stream.distance}
                          onHover={setHover}
                        />
                      </CardContent>
                    </Card>
                  )}
                  {stream?.altitude && (
                    <Card className="col-span-2">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>{m.altitude()}</CardTitle>
                        <div className="absolute right-10">
                          <ZoomResetButton />
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <AltitudeChart
                          altitudeStream={stream.altitude}
                          timeStream={stream.time}
                          distanceStream={stream.distance}
                          onHover={setHover}
                        />
                      </CardContent>
                    </Card>
                  )}
                  {stream?.watts && (
                    <Card className="col-span-2">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>{m.power()}</CardTitle>
                        <div className="absolute right-10">
                          <ZoomResetButton />
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <PowerChart
                          wattsStream={stream.watts}
                          timeStream={stream.time}
                          distanceStream={stream.distance}
                          onHover={setHover}
                        />
                      </CardContent>
                    </Card>
                  )}
                  {stream?.heartrate && (
                    <>
                      <Card className="col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between">
                          <CardTitle>{m.heart_rate()}</CardTitle>
                          <div className="absolute right-10">
                            <ZoomResetButton />
                          </div>
                        </CardHeader>
                        <CardContent className="p-0">
                          <HeartrateChart
                            heartrateStream={stream.heartrate}
                            sport={event.sport}
                            timeStream={stream.time}
                            distanceStream={stream.distance}
                            onHover={setHover}
                          />
                        </CardContent>
                      </Card>
                      <Card className="col-span-1">
                        <CardHeader>
                          <CardTitle>{m.heart_rate_distribution()}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <HeartrateDistributionChart
                            heartrateStream={stream.heartrate}
                            sport={event.sport}
                            duration={event.movingTime}
                          />
                        </CardContent>
                      </Card>
                    </>
                  )}
                  {event.records && !!event.records.length && (
                    <>
                      <Card className="col-span-2">
                        <CardHeader>
                          <CardTitle>{m.records()}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <RecordsChart records={event.records} />
                        </CardContent>
                      </Card>
                    </>
                  )}
                </>
              );
            })()}
          </ActivityDetailsSelectionProvider>
        </>
      )}
      {normalization && (
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>{m.normalized()}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {typeof normalization.averageNormalizedSpeed === 'number' && (
              <div className="text-sm">
                <span className="font-medium">{m.normalized_speed()}:</span>{' '}
                {formatSpeed(normalization.averageNormalizedSpeed)} {m.per_km()}
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{m.factor()}</TableHead>
                  <TableHead className="text-right">{m.time_lost()}</TableHead>
                  <TableHead className="text-right">{m.share()}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(
                  normalization.factors as GetEventNormalizationResponseDto['factors']
                )
                  .filter(
                    (f: GetEventNormalizationResponseDto['factors'][number]) =>
                      (f.timeSeconds ?? 0) > 0,
                  )
                  .sort(
                    (
                      a: GetEventNormalizationResponseDto['factors'][number],
                      b: GetEventNormalizationResponseDto['factors'][number],
                    ) => (b.timeSeconds ?? 0) - (a.timeSeconds ?? 0),
                  )
                  .map(
                    (
                      f: GetEventNormalizationResponseDto['factors'][number],
                    ) => (
                      <TableRow key={f.factor}>
                        <TableCell>{normLabel(String(f.factor))}</TableCell>
                        <TableCell className="text-right">
                          {formatDuration(
                            Math.max(0, Math.round(f.timeSeconds)),
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {Math.round(Math.max(0, f.percent) * 100)}
                          {m.percent_symbol()}
                        </TableCell>
                      </TableRow>
                    ),
                  )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
