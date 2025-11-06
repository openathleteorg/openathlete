import { m } from '@/paraglide/messages';
import { getConnectorProviderActivityLink } from '@/utils/connector-provider';
import {
  connectorProviderLabelMap,
  eventTypeLabelMap,
} from '@/utils/label-map/core';
import { cn } from '@/utils/shadcn';

import { EVENT_TYPE, Event } from '@openathlete/shared';

import { ActivityValidationAlert } from '../activity-validation-alert';
import { EventDetails } from '../event-details/event-details';
import { SportIcon } from '../sport-icon/sport-icon';
import { Badge } from '../ui/badge';
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

  return (
    <Dialog onOpenChange={(o) => !o && onClose()} open={open}>
      <DialogContent
        className={cn(
          'sm:max-w-4xl',
          event?.type === EVENT_TYPE.ACTIVITY && 'sm:max-w-6xl',
        )}
      >
        <DialogHeader>
          <DialogTitle className="flex items-start justify-center gap-2">
            <div className="flex items-center gap-2 grow">
              {event?.type !== EVENT_TYPE.NOTE && event?.sport && (
                <SportIcon sport={event.sport} />
              )}
              {event?.name}{' '}
              {event && <Badge>{eventTypeLabelMap[event.type]}</Badge>}
              {event &&
                event.type === EVENT_TYPE.ACTIVITY &&
                event.externalId &&
                event.provider &&
                getConnectorProviderActivityLink(
                  event.provider,
                  event.externalId,
                ) && (
                  <Badge
                    variant="outline"
                    className="cursor-pointer hover:underline"
                    onClick={() => {
                      const link = getConnectorProviderActivityLink(
                        event.provider!,
                        event.externalId,
                      );
                      if (!link) return;
                      window.open(link, '_blank');
                    }}
                  >
                    {m.imported_from({
                      provider: connectorProviderLabelMap[event.provider],
                    })}
                  </Badge>
                )}
            </div>
            <div className="flex items-center gap-2 pr-4 -translate-y-4">
              <Button onClick={onEditEvent} variant="outline" size="sm">
                {m.edit()}
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        {event && event.type === EVENT_TYPE.ACTIVITY && (
          <ActivityValidationAlert event={event} athleteId={athleteId} />
        )}
        {event && <EventDetails eventId={event.eventId} />}
      </DialogContent>
    </Dialog>
  );
}
