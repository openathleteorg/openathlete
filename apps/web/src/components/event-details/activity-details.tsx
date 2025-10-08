import { m } from '@/paraglide/messages';
import { useGetEventStreamQuery } from '@/services/event';
import { useMemo } from 'react';

import { ActivityEvent } from '@openathlete/shared';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ActivityDetailsOverviewTab } from './tabs/activity-details-overview-tab';
import { ActivityDetailsSplitsTab } from './tabs/activity-details-splits-tab';

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
    'gap',
  ]);
  const hasSplits = useMemo(() => {
    const d = stream?.distance;
    if (!d?.length) return false;
    const lastDistance = d[d.length - 1] ?? 0;
    return Math.floor(lastDistance / 1000) > 0;
  }, [stream?.distance]);

  return (
    <Tabs defaultValue="overview" className="flex flex-col gap-4">
      <TabsList>
        <TabsTrigger value="overview">{m.overview()}</TabsTrigger>
        {hasSplits && <TabsTrigger value="splits">{m.splits()}</TabsTrigger>}
      </TabsList>
      <TabsContent value="overview">
        <ActivityDetailsOverviewTab event={event} stream={stream} />
      </TabsContent>
      {hasSplits && (
        <TabsContent value="splits">
          <ActivityDetailsSplitsTab stream={stream} />
        </TabsContent>
      )}
    </Tabs>
  );
}
