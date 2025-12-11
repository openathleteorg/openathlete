import { useSkipFeedbackMutation } from '@/api/activity-feedback';
import { useGetEventStreamQuery } from '@/api/event';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader } from '@/components/ui/loader';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { getDateLocale } from '@/utils/locales';
import { useState } from 'react';

import { ActivityEvent } from '@openathlete/shared';

import { ActivityDetailsMap } from '../event-details/activity-details-map';
import { ActivityFeedbackOverlay } from './activity-feedback-overlay';

interface P {
  event: ActivityEvent;
  open: boolean;
  onClose: () => void;
}

export function ActivityFeedbackDialog({ event, open, onClose }: P) {
  const [showFeedback, setShowFeedback] = useState(false);
  const skipMutation = useSkipFeedbackMutation(event.eventId);

  // Fetch stream for map display
  const { data: stream, isLoading: isLoadingStream } = useGetEventStreamQuery(
    event.eventId,
    1000, // resolution
    ['latlng', 'distance', 'time'],
    open && !showFeedback,
  );

  const handleStartFeedback = () => {
    setShowFeedback(true);
  };

  const handleFeedbackComplete = () => {
    setShowFeedback(false);
    onClose();
  };

  const handleSkip = async () => {
    try {
      await skipMutation.mutateAsync();
      onClose();
    } catch (error) {
      console.error('Failed to skip feedback:', error);
      // Still close the dialog even if skip fails
      onClose();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(getDateLocale(getLocale()), {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(getDateLocale(getLocale()), {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (showFeedback) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && handleFeedbackComplete()}>
        <DialogContent className="sm:max-w-4xl p-0" mobileFullscreen>
          <div className="relative w-full h-full min-h-[calc(100vh-140px)]">
            <ActivityFeedbackOverlay
              event={event}
              onSkip={handleFeedbackComplete}
              skipIntroScreen={true}
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl" mobileFullscreen>
        <DialogHeader>
          <DialogTitle>{m.activity_feedback_context_title()}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">{event.name}</h3>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {formatDate(event.startDate)}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatTime(event.startDate)}
              {event.endDate && ` - ${formatTime(event.endDate)}`}
            </p>
          </div>
          {isLoadingStream ? (
            <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
              <Loader />
            </div>
          ) : stream?.latlng && stream.latlng.length > 0 ? (
            <div className="h-64">
              <ActivityDetailsMap
                polyline={stream.latlng}
                distance={stream.distance}
                time={stream.time}
                className="w-full h-full rounded-xl shadow-sm border"
              />
            </div>
          ) : null}
          <div className="flex flex-col gap-3 pt-4">
            <Button onClick={handleStartFeedback} size="lg">
              {m.activity_feedback_start()}
            </Button>
            <Button
              onClick={handleSkip}
              variant="outline"
              size="lg"
              disabled={skipMutation.isPending}
            >
              {skipMutation.isPending
                ? m.activity_feedback_skipping()
                : m.activity_feedback_skip()}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
