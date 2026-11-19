import { m } from '@/paraglide/messages';
import { getConnectorProviderActivityLink } from '@/utils/connector-provider';
import {
  connectorProviderLabelMap,
  eventTypeLabelMap,
} from '@/utils/label-map/core';
import { cn } from '@/utils/shadcn';
import { Trophy } from 'lucide-react';

import { EVENT_TYPE, Event } from '@openathlete/shared';

import { garminActivityLabel } from '../garmin-attribution/garmin-source';
import { SportIcon } from '../sport-icon/sport-icon';
import { Badge } from '../ui/badge';

/** The sport, name and badges of an event, as its dialog and page title */
export function EventHeading({
  event,
  hideName,
}: {
  event: Event;
  /** When the app bar already shows it */
  hideName?: boolean;
}) {
  // Garmin requires "Garmin [device model]" beside its activities' title
  const garminLabel = garminActivityLabel(event);
  const providerLink =
    event.type === EVENT_TYPE.ACTIVITY && event.provider && event.externalId
      ? getConnectorProviderActivityLink(event.provider, event.externalId)
      : undefined;
  return (
    <div className="flex flex-wrap items-center gap-2 grow text-sm md:text-base">
      {'sport' in event && event.sport && <SportIcon sport={event.sport} />}
      {!hideName && <span className="break-words">{event.name}</span>}
      <Badge className="text-xs">{eventTypeLabelMap[event.type]}</Badge>
      {event.type === EVENT_TYPE.ACTIVITY && event.isRace && (
        <Badge variant="outline" className="text-xs" data-race-badge>
          <Trophy className="h-3 w-3" />
          {m.activity_race_badge()}
        </Badge>
      )}
      {event.type === EVENT_TYPE.ACTIVITY &&
        !event.provider &&
        event.externalId?.startsWith('fit-manual:') && (
          <Badge variant="outline">{m.fit_import_source()}</Badge>
        )}
      {event.type === EVENT_TYPE.ACTIVITY &&
        !event.provider &&
        event.externalId?.startsWith('gpx-manual:') && (
          <Badge variant="outline">{m.gpx_import_source()}</Badge>
        )}
      {event.type === EVENT_TYPE.ACTIVITY &&
        !event.provider &&
        event.externalId?.startsWith('tcx-manual:') && (
          <Badge variant="outline">{m.tcx_import_source()}</Badge>
        )}
      {garminLabel ? (
        <Badge
          variant="outline"
          className={cn(
            'text-xs font-normal text-muted-foreground',
            providerLink && 'cursor-pointer hover:underline',
          )}
          data-garmin-attribution="activity"
          onClick={
            providerLink ? () => window.open(providerLink, '_blank') : undefined
          }
        >
          {garminLabel}
        </Badge>
      ) : (
        event.type === EVENT_TYPE.ACTIVITY &&
        event.provider &&
        providerLink && (
          <Badge
            variant="outline"
            className="cursor-pointer hover:underline text-xs"
            onClick={() => window.open(providerLink, '_blank')}
          >
            {m.imported_from({
              provider: connectorProviderLabelMap[event.provider],
            })}
          </Badge>
        )
      )}
    </div>
  );
}
