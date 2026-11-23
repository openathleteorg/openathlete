import { useGetMyAthleteQuery } from '@/api/athlete';
import {
  useGetEventNormalizationQuery,
  useGetEventStreamQuery,
  useGetEventWeatherQuery,
} from '@/api/event';
import { m } from '@/paraglide/messages';
import { useState } from 'react';

import { ActivityEvent } from '@openathlete/shared';

import { ActivityFeedbackOverlay } from '../activity-feedback/activity-feedback-overlay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ActivityDownloadButtons } from './activity-download-buttons';
import { ActivityNormalizationCard } from './activity-normalization-card';
import {
  ACTIVITY_STREAM_KEYS,
  ACTIVITY_STREAM_RESOLUTION,
} from './activity-stream-keys';
import { ActivityDetailsOverviewTab } from './tabs/activity-details-overview-tab';
import { ActivityDetailsWeatherTab } from './tabs/activity-details-weather-tab';

interface P {
  event: ActivityEvent;
}

export function ActivityDetails({ event }: P) {
  const { data: athlete } = useGetMyAthleteQuery();
  // The post-activity questions open on request, never in front of the data
  const [feedbackMode, setFeedbackMode] = useState<'answer' | 'edit' | null>(
    null,
  );
  const isMyActivity = athlete?.athleteId === event.athleteId;
  const { data: stream } = useGetEventStreamQuery(
    event.eventId,
    ACTIVITY_STREAM_RESOLUTION,
    ACTIVITY_STREAM_KEYS,
  );
  const { data: weather } = useGetEventWeatherQuery(event.eventId, {
    retry: 1,
  });
  const { data: normalization } = useGetEventNormalizationQuery(event.eventId);
  // What slowed the athlete down, or helped: weather and normalisation
  const hasConditions = !!weather || !!normalization?.factors.length;

  return (
    <>
      {isMyActivity && feedbackMode && (
        <ActivityFeedbackOverlay
          event={event}
          onSkip={() => setFeedbackMode(null)}
          isEditMode={feedbackMode === 'edit'}
          skipIntroScreen
        />
      )}

      {!(isMyActivity && feedbackMode) && (
        <Tabs defaultValue="overview" className="flex flex-col gap-4">
          {/* The track's download sits here, not in the title: both the
            calendar dialog and the activity page show these details */}
          <div className="flex items-center justify-between gap-2 empty:hidden">
            {hasConditions && (
              <TabsList>
                <TabsTrigger value="overview">{m.overview()}</TabsTrigger>
                <TabsTrigger value="conditions">
                  {m.activity_conditions()}
                </TabsTrigger>
              </TabsList>
            )}
            <ActivityDownloadButtons
              event={event}
              className="ml-auto shrink-0"
            />
          </div>
          <TabsContent value="overview">
            <ActivityDetailsOverviewTab
              event={event}
              stream={stream}
              isMyActivity={athlete?.athleteId === event.athleteId}
              onAnswerFeedback={() => setFeedbackMode('answer')}
              onEditFeedback={() => setFeedbackMode('edit')}
              onReopenFeedback={() => setFeedbackMode('edit')}
            />
          </TabsContent>
          {hasConditions && (
            <TabsContent value="conditions" className="space-y-4">
              <ActivityNormalizationCard event={event} />
              {weather && (
                <ActivityDetailsWeatherTab data={weather} stream={stream} />
              )}
            </TabsContent>
          )}
        </Tabs>
      )}
    </>
  );
}
