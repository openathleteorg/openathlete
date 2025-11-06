import { useGetAthleteSettingsQuery } from '@/api/athlete';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { m } from '@/paraglide/messages';
import { AlertCircle } from 'lucide-react';

import { EVENT_TYPE, Event } from '@openathlete/shared';

interface P {
  event: Event;
  athleteId?: number;
}

export function ActivityValidationAlert({ event, athleteId }: P) {
  const { data: settings } = useGetAthleteSettingsQuery(
    athleteId || 0,
    !!athleteId && event.type === EVENT_TYPE.ACTIVITY,
  );

  // Only show for ACTIVITY events
  if (event.type !== EVENT_TYPE.ACTIVITY || !athleteId || !settings) {
    return null;
  }

  // If no requirements, don't show alert
  if (!settings.requireRpe && !settings.requireComment) {
    return null;
  }

  const hasRpe = event.rpe !== null && event.rpe !== undefined;
  const hasComment =
    event.description !== null &&
    event.description !== undefined &&
    event.description.trim() !== '';

  // Check if validation is needed
  const needsRpe = settings.requireRpe && !hasRpe;
  const needsComment = settings.requireComment && !hasComment;

  if (!needsRpe && !needsComment) {
    return null; // Already validated
  }

  // Determine message based on what's missing
  let message = '';
  if (needsRpe && needsComment) {
    message = m.session_validation_required_both();
  } else if (needsRpe) {
    message = m.session_validation_required_rpe();
  } else if (needsComment) {
    message = m.session_validation_required_comment();
  }

  return (
    <Alert variant="default">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{m.session_validation_required()}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
