import { useGetMyAthleteQuery } from '@/api/athlete';
import { useGetMyEventsQuery } from '@/api/event';
import { ActivityFeedbackDialog } from '@/components/activity-feedback/activity-feedback-dialog';
import { Calendar } from '@/components/calendar/calendar';
import { AthleteDashboardHeader } from '@/components/dashboard/athlete-dashboard-header';
import { useSpaceContext } from '@/contexts/space';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ActivityEvent,
  ActivityFeedbackQuestion,
  EVENT_TYPE,
} from '@openathlete/shared';

export function CalendarView() {
  const { data: athlete } = useGetMyAthleteQuery();
  const { space } = useSpaceContext();
  const [displayedMonth, setDisplayedMonth] = useState(new Date());
  const [pendingFeedbackEvent, setPendingFeedbackEvent] =
    useState<ActivityEvent | null>(null);
  const [dismissedFeedbackEvents, setDismissedFeedbackEvents] = useState<
    Set<number>
  >(new Set());

  const { startDate, endDate } = useMemo(() => {
    const start = new Date(
      displayedMonth.getFullYear(),
      displayedMonth.getMonth() - 1,
      1,
    );
    const end = new Date(
      displayedMonth.getFullYear(),
      displayedMonth.getMonth() + 2,
      0,
    );
    end.setHours(23, 59, 59, 999);
    return { startDate: start, endDate: end };
  }, [displayedMonth]);

  const { data, refetch, isPending } = useGetMyEventsQuery(
    undefined,
    undefined,
    startDate,
    endDate,
  );

  useEffect(() => {
    refetch();
  }, [startDate, endDate, refetch]);

  useEffect(() => {
    if (space !== 'ATHLETE' || !data || !athlete || isPending) {
      return;
    }

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const unratedActivity = data.find((event) => {
      if (event.type !== EVENT_TYPE.ACTIVITY) return false;

      const activityEvent = event as ActivityEvent;
      if (dismissedFeedbackEvents.has(activityEvent.eventId)) {
        return false;
      }
      if (activityEvent.athleteId !== athlete.athleteId) return false;
      const eventEndDate = new Date(activityEvent.endDate);
      if (eventEndDate < twentyFourHoursAgo || eventEndDate > now) {
        return false;
      }
      const questions = activityEvent.feedbackQuestions ?? [];
      if (questions.length === 0) return false;
      const feedbackSkipped =
        'feedbackSkipped' in activityEvent &&
        (activityEvent as { feedbackSkipped?: boolean }).feedbackSkipped ===
          true;
      if (feedbackSkipped) return false;
      const allUnanswered = questions.every(
        (q: ActivityFeedbackQuestion) => q.answerText === null,
      );

      return allUnanswered;
    });

    if (unratedActivity && !pendingFeedbackEvent) {
      setPendingFeedbackEvent(unratedActivity as ActivityEvent);
    }
  }, [
    data,
    space,
    athlete,
    pendingFeedbackEvent,
    isPending,
    dismissedFeedbackEvents,
  ]);

  const handleMonthChange = useCallback((month: Date) => {
    setDisplayedMonth(month);
  }, []);

  const handleFeedbackDialogClose = () => {
    if (pendingFeedbackEvent) {
      setDismissedFeedbackEvents((prev) => {
        const newSet = new Set(prev);
        newSet.add(pendingFeedbackEvent.eventId);
        return newSet;
      });
    }
    setPendingFeedbackEvent(null);
  };

  return (
    <div className="w-full p-4 md:p-8">
      {space === 'ATHLETE' && (
        <AthleteDashboardHeader events={data} athleteId={athlete?.athleteId} />
      )}
      <Calendar
        events={data}
        athleteId={space === 'ATHLETE' ? athlete?.athleteId : undefined}
        allowCreate={space === 'ATHLETE'}
        onMonthChange={handleMonthChange}
        isLoading={isPending}
      />
      {pendingFeedbackEvent && (
        <ActivityFeedbackDialog
          event={pendingFeedbackEvent}
          open={!!pendingFeedbackEvent}
          onClose={handleFeedbackDialogClose}
        />
      )}
    </div>
  );
}
