import { useGetMyAthleteQuery } from '@/api/athlete';
import { m } from '@/paraglide/messages';
import { activityPath } from '@/routes/paths';
import { cn } from '@/utils/shadcn';
import { Maximize2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import { EVENT_TYPE, Event } from '@openathlete/shared';

import { ActivityValidationAlert } from '../activity-validation-alert';
import { EventDetails } from '../event-details/event-details';
import { EventHeading } from '../event-details/event-heading';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useCalendarContext } from './hooks/use-calendar-context';

interface P {
  open: boolean;
  onClose: () => void;
  event?: Event;
  onEditEvent: () => void;
}

export function CalendarEventDetailsDialog({
  open,
  onClose,
  event,
  onEditEvent,
}: P) {
  const { athleteId } = useCalendarContext();
  const { data: athlete } = useGetMyAthleteQuery();

  return (
    <Dialog onOpenChange={(o) => !o && onClose()} open={open}>
      <DialogContent
        mobileFullscreen
        data-event-details
        className={cn(
          'sm:max-w-4xl',
          event?.type === EVENT_TYPE.ACTIVITY && 'sm:max-w-6xl',
        )}
      >
        <DialogHeader>
          <DialogTitle className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 md:gap-2">
            {event && <EventHeading event={event} />}
            <div className="flex items-center gap-2 md:pr-4 md:-translate-y-4 w-full md:w-auto mt-2 md:mt-0">
              {event?.type === EVENT_TYPE.ACTIVITY && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full md:w-auto text-xs md:text-sm"
                >
                  <Link to={activityPath(event.eventId)}>
                    <Maximize2 className="size-4" />
                    {m.activity_open_page()}
                  </Link>
                </Button>
              )}
              <Button
                onClick={onEditEvent}
                variant="outline"
                size="sm"
                className="w-full md:w-auto text-xs md:text-sm"
              >
                {m.edit()}
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        {event &&
          event.type === EVENT_TYPE.ACTIVITY &&
          athleteId === athlete?.athleteId && (
            <ActivityValidationAlert event={event} athleteId={athleteId} />
          )}
        {event && <EventDetails eventId={event.eventId} />}
      </DialogContent>
    </Dialog>
  );
}
