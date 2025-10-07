import { m } from '@/paraglide/messages';
import { useGetEventStreamQuery } from '@/services/event';
import { computeHoverPin } from '@/utils/map-hover';
import { useMemo, useState } from 'react';

import { ActivityEvent } from '@openathlete/shared';

import { HeartrateChart } from '../charts/heartrate-chart';
import { HeartrateDistributionChart } from '../charts/heartrate-distribution-chart';
import { PowerChart } from '../charts/power-chart';
import { RecordsChart } from '../charts/records-chart';
import { SpeedChart } from '../charts/speed-chart';
import { Map } from '../map/map';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ActivityStatistics } from './activity-statistics';

interface P {
  event: ActivityEvent;
}

export function ActivityDetails({ event }: P) {
  const { data: stream } = useGetEventStreamQuery(event.eventId, 3000, [
    'altitude',
    'latlng',
    'heartrate',
    'distance',
    'time',
    'watts',
  ]);
  const [hover, setHover] = useState<
    undefined | { index: number; time: number }
  >();

  const hoverPin = useMemo(
    () => computeHoverPin(stream?.latlng, stream?.time, hover),
    [hover, stream],
  );
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
      {stream?.latlng && (
        <Map
          className="col-span-1 rounded-xl shadow-sm border"
          polyline={stream.latlng}
          pins={hoverPin}
        />
      )}
      {stream?.latlng && stream.time && (
        <>
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>{m.pace()}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <SpeedChart
                latLngStream={stream.latlng}
                timeStream={stream.time}
                onHover={setHover}
              />
            </CardContent>
          </Card>
        </>
      )}
      {stream?.watts && stream.time && (
        <>
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>{m.power()}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <PowerChart
                wattsStream={stream.watts}
                timeStream={stream.time}
                onHover={setHover}
              />
            </CardContent>
          </Card>
        </>
      )}
      {stream?.heartrate && (
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
    </div>
  );
}
