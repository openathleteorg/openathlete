import { useGetEventStreamQuery } from '@/api/event';
import { m } from '@/paraglide/messages';
import { computeHoverPin } from '@/utils/map-hover';
import { useMemo, useState } from 'react';

import { ActivityEvent, ActivityStream } from '@openathlete/shared';

import { ActivityStreamsChart } from '../../activity-analysis/activity-streams-chart';
import { AiSummaryCard } from '../../activity-analysis/ai-summary-card';
import { CorrectionsCard } from '../../activity-analysis/corrections-card';
import { DecouplingCard } from '../../activity-analysis/decoupling-card';
import { availableLapSources, climbsOf } from '../../activity-analysis/laps';
import { LapsCard } from '../../activity-analysis/laps-card';
import { useLapOptions } from '../../activity-analysis/laps-options';
import { PlanBanner } from '../../activity-analysis/plan-banner';
import {
  ActivitySection,
  ActivitySectionNav,
  SectionAnchor,
} from '../../activity-analysis/section-nav';
import {
  XAxisKind,
  defaultXAxis,
  routeRange,
  xSeries,
} from '../../activity-analysis/stream-range';
import { ZonesCard } from '../../activity-analysis/zones-card';
import { ActivityRecordsCharts } from '../../records/activity-records-charts';
import { ChartRecord } from '../../records/record-metrics';
import { StrengthLogCard } from '../../strength/strength-log-card';
import { ActivitySupporterNudge } from '../../supporter/activity-supporter-nudge';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { ActivityDetailsMap } from '../activity-details-map';
import { ActivityDetailsSelectionProvider } from '../activity-details-selection-context';
import { ActivityFeedbackDisplayCard } from '../activity-feedback-display-card';
import { ActivityQuickEditCard } from '../activity-quick-edit-card';
import { ActivityStatistics } from '../activity-statistics';
import {
  ACTIVITY_ROUTE_KEYS,
  ACTIVITY_ROUTE_RESOLUTION,
  ACTIVITY_STREAM_RESOLUTION,
} from '../activity-stream-keys';

interface P {
  event: ActivityEvent;
  stream: ActivityStream | undefined;
  isMyActivity: boolean;
  onAnswerFeedback?: () => void;
  onEditFeedback?: () => void;
  onReopenFeedback?: () => void;
}

export function ActivityDetailsOverviewTab({
  event,
  stream,
  isMyActivity,
  onAnswerFeedback,
  onEditFeedback,
  onReopenFeedback,
}: P) {
  const [hover, setHover] = useState<
    undefined | { index: number; time: number }
  >();
  // Until the athlete picks one, the axis follows the data
  const [xAxisChoice, setXAxisChoice] = useState<XAxisKind>();
  const xAxis = xAxisChoice ?? defaultXAxis(stream);

  // Measuring gaps from chart samples can mistake downsampling for a dropout.
  const { data: route } = useGetEventStreamQuery(
    event.eventId,
    ACTIVITY_ROUTE_RESOLUTION,
    ACTIVITY_ROUTE_KEYS,
    (stream?.latlng?.length ?? 0) >= ACTIVITY_STREAM_RESOLUTION,
  );
  const mapStream = route?.latlng?.length ? route : stream;
  const hoverPin = useMemo(
    () => computeHoverPin(mapStream?.latlng, mapStream?.time, hover),
    [hover, mapStream],
  );

  const fullDomain: [number, number] | undefined = useMemo(() => {
    const series = xSeries(stream, xAxis);
    return series?.length ? [series[0], series[series.length - 1]] : undefined;
  }, [stream, xAxis]);

  const lapOptions = useLapOptions(event, stream);
  const climbs = useMemo(() => {
    const climbs = climbsOf(stream);
    if (!stream || !mapStream || mapStream === stream) return climbs;
    return climbs.flatMap((climb) => {
      const range = routeRange(stream, mapStream, climb.start, climb.end);
      return range ? [{ ...climb, start: range[0], end: range[1] }] : [];
    });
  }, [stream, mapStream]);
  const mapPath =
    fullDomain && mapStream?.latlng?.length ? mapStream.latlng : undefined;
  const laps = event.segments?.filter(
    (segment) => segment.segmentType === 'LAP',
  );

  const feedbackCard = isMyActivity ? (
    <ActivityQuickEditCard
      event={event}
      isMyActivity={isMyActivity}
      onAnswerFeedback={onAnswerFeedback}
      onEditFeedback={onEditFeedback}
      onReopenFeedback={onReopenFeedback}
    />
  ) : (
    <ActivityFeedbackDisplayCard event={event} />
  );

  const hasLaps = useMemo(
    () => availableLapSources(lapOptions).length > 0,
    [lapOptions],
  );
  const id = (section: string) => `activity-${event.eventId}-${section}`;
  const sections: ActivitySection[] = [
    { id: id('summary'), label: m.activity_section_summary() },
    ...(stream ? [{ id: id('charts'), label: m.activity_charts_title() }] : []),
    ...(hasLaps ? [{ id: id('laps'), label: m.activity_laps_title() }] : []),
    { id: id('notes'), label: m.activity_section_notes() },
    { id: `event-comments-${event.eventId}`, label: m.event_comments_title() },
  ];

  const content = (
    <>
      <ActivitySectionNav sections={sections} />
      <PlanBanner event={event} options={lapOptions} />
      <AiSummaryCard event={event} />
      <SectionAnchor id={id('summary')} />
      <Card className={mapPath ? 'col-span-2 sm:col-span-1' : 'col-span-2'}>
        <CardHeader>
          <CardTitle>{m.statistics()}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <ActivityStatistics event={event} stream={stream} />
          </div>
        </CardContent>
      </Card>
      {event.strengthLog ? (
        <StrengthLogCard log={event.strengthLog} className="col-span-2" />
      ) : null}
      {mapPath && (
        <ActivityDetailsMap
          className="col-span-2 sm:col-span-1 rounded-xl shadow-sm border w-full min-h-[300px]"
          polyline={mapPath}
          pins={hoverPin}
          distance={mapStream?.distance}
          time={mapStream?.time}
          timerPaused={mapStream?.timerPaused}
          climbs={climbs}
        />
      )}
      {stream && (
        <>
          <SectionAnchor id={id('charts')} />
          <ActivityStreamsChart
            stream={stream}
            sport={event.sport}
            athleteId={event.athleteId ?? undefined}
            laps={laps}
            onHover={setHover}
          />
        </>
      )}
      {hasLaps && <SectionAnchor id={id('laps')} />}
      <LapsCard event={event} options={lapOptions} />
      <SectionAnchor id={id('notes')} />
      {stream && <ZonesCard event={event} stream={stream} />}
      {stream && <DecouplingCard stream={stream} sport={event.sport} />}
      {feedbackCard}
      <ActivitySupporterNudge event={event} isMyActivity={isMyActivity} />
      {!!event.records?.length && (
        <ActivityRecordsCharts
          records={event.records as ChartRecord[]}
          sport={event.sport}
          athleteId={event.athleteId ?? undefined}
          startDate={new Date(event.startDate)}
        />
      )}
      {/* Its athlete or their coaches, the only ones who see it, can fix it */}
      {!!stream?.time?.length && (
        <CorrectionsCard event={event} stream={stream} />
      )}
    </>
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {fullDomain ? (
        <ActivityDetailsSelectionProvider
          fullDomain={fullDomain}
          xAxis={xAxis}
          onXAxisChange={setXAxisChoice}
        >
          {content}
        </ActivityDetailsSelectionProvider>
      ) : (
        content
      )}
    </div>
  );
}
