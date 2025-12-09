import { useGetEventNormalizationQuery } from '@/api/event';
import type { GetEventNormalizationResponseDto } from '@/api/event/event.api';
import { m } from '@/paraglide/messages';
import { computeHoverPin } from '@/utils/map-hover';
import { ZoomOut } from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  ActivityEvent,
  ActivityStream,
  NORMALIZATION_FACTOR,
  formatDuration,
  formatSpeed,
  formatSpeedUnit,
  getSportConfig,
} from '@openathlete/shared';

import { AltitudeChart } from '../../charts/altitude-chart';
import { CadenceChart } from '../../charts/cadence-chart';
import { GapChart } from '../../charts/gap-chart';
import { HeartrateChart } from '../../charts/heartrate-chart';
import { HeartrateDistributionChart } from '../../charts/heartrate-distribution-chart';
import { PowerChart } from '../../charts/power-chart';
import { RecordsChart } from '../../charts/records-chart';
import { SegmentsChart } from '../../charts/segments-chart';
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
import { ActivityFeedbackDisplayCard } from '../activity-feedback-display-card';
import { ActivityQuickEditCard } from '../activity-quick-edit-card';
import { ActivityStatistics } from '../activity-statistics';

interface P {
  event: ActivityEvent;
  stream: ActivityStream | undefined;
  isMyActivity: boolean;
  onEditFeedback?: () => void;
  onReopenFeedback?: () => void;
}

export function ActivityDetailsOverviewTab({
  event,
  stream,
  isMyActivity,
  onEditFeedback,
  onReopenFeedback,
}: P) {
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
  const speedConfig = getSportConfig(event.sport);
  const hasSegments = Boolean(event.segments?.length);

  const normLabel = (factor: NORMALIZATION_FACTOR) => {
    if (factor === NORMALIZATION_FACTOR.SLOPE) return m.slope();
    if (factor === NORMALIZATION_FACTOR.RADIATION) return m.radiation();
    if (factor === NORMALIZATION_FACTOR.TEMPERATURE) return m.temperature();
    if (factor === NORMALIZATION_FACTOR.ALTITUDE) return m.altitude();
    if (factor === NORMALIZATION_FACTOR.WIND) return m.wind();
    if (factor === NORMALIZATION_FACTOR.HUMIDITY) return m.humidity();
    return factor;
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
      {!(stream?.latlng && stream.time && fullDomain) &&
        (isMyActivity ? (
          <ActivityQuickEditCard
            event={event}
            isMyActivity={isMyActivity}
            onEditFeedback={onEditFeedback}
            onReopenFeedback={onReopenFeedback}
          />
        ) : (
          <ActivityFeedbackDisplayCard event={event} />
        ))}
      {stream?.time &&
        (stream.latlng && fullDomain ? (
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
              {isMyActivity ? (
                <ActivityQuickEditCard
                  event={event}
                  isMyActivity={isMyActivity}
                  onEditFeedback={onEditFeedback}
                  onReopenFeedback={onReopenFeedback}
                />
              ) : (
                <ActivityFeedbackDisplayCard event={event} />
              )}
              {stream?.heartrate && (
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
                    {hasSegments && (
                      <Card className="col-span-2">
                        <CardHeader>
                          <CardTitle>{m.segments()}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <SegmentsChart
                            segments={event.segments!}
                            sport={event.sport}
                          />
                        </CardContent>
                      </Card>
                    )}
                    <Card className="col-span-2">
                      <CardHeader className="flex flex-row items-center justify-between gap-2">
                        <CardTitle>
                          {speedConfig.speedLabel === 'pace'
                            ? m.pace()
                            : m.speed()}
                        </CardTitle>
                        <div className="flex-shrink-0">
                          <ZoomResetButton />
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <SpeedChart
                          latLngStream={stream.latlng}
                          timeStream={stream.time}
                          distanceStream={stream.distance}
                          sport={event.sport}
                          onHover={setHover}
                        />
                      </CardContent>
                    </Card>
                    {stream && stream.gap && (
                      <Card className="col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between gap-2">
                          <CardTitle>{m.gap()}</CardTitle>
                          <div className="flex-shrink-0">
                            <ZoomResetButton />
                          </div>
                        </CardHeader>
                        <CardContent className="p-0">
                          <GapChart
                            gapStream={stream.gap as number[]}
                            timeStream={stream.time}
                            distanceStream={stream.distance}
                            sport={event.sport}
                            onHover={setHover}
                          />
                        </CardContent>
                      </Card>
                    )}
                    {stream?.altitude && (
                      <Card className="col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between gap-2">
                          <CardTitle>{m.altitude()}</CardTitle>
                          <div className="flex-shrink-0">
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
                        <CardHeader className="flex flex-row items-center justify-between gap-2">
                          <CardTitle>{m.power()}</CardTitle>
                          <div className="flex-shrink-0">
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
                    {stream?.cadence && (
                      <Card className="col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between gap-2">
                          <CardTitle>{m.cadence()}</CardTitle>
                          <div className="flex-shrink-0">
                            <ZoomResetButton />
                          </div>
                        </CardHeader>
                        <CardContent className="p-0">
                          <CadenceChart
                            cadenceStream={stream.cadence}
                            sport={event.sport}
                            timeStream={stream.time}
                            distanceStream={stream.distance}
                            onHover={setHover}
                          />
                        </CardContent>
                      </Card>
                    )}
                    {stream?.heartrate && (
                      <Card className="col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between gap-2">
                          <CardTitle>{m.heart_rate()}</CardTitle>
                          <div className="flex-shrink-0">
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
        ) : (
          stream.heartrate && (
            <>
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>{m.heart_rate()}</CardTitle>
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
              <Card className="col-span-2">
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
          )
        ))}
      {normalization && !!normalization.factors.length && (
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>{m.normalized()}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {typeof normalization.averageNormalizedSpeed === 'number' && (
              <div className="text-sm">
                <span className="font-medium">{m.normalized_speed()}:</span>{' '}
                {formatSpeed(
                  normalization.averageNormalizedSpeed,
                  speedConfig.speedUnit,
                )}{' '}
                {formatSpeedUnit(speedConfig.speedUnit)}
              </div>
            )}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{m.factor()}</TableHead>
                    <TableHead className="text-right">
                      {m.time_lost()}
                    </TableHead>
                    <TableHead className="text-right">{m.share()}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(
                    normalization.factors as GetEventNormalizationResponseDto['factors']
                  )
                    .filter(
                      (
                        f: GetEventNormalizationResponseDto['factors'][number],
                      ) => (f.timeSeconds ?? 0) > 0,
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
                          <TableCell>{normLabel(f.factor)}</TableCell>
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
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
