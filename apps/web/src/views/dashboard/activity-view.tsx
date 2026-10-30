import { useGetMyAthleteQuery } from '@/api/athlete';
import { useGetEventQuery } from '@/api/event';
import { ActivityValidationAlert } from '@/components/activity-validation-alert';
import { EventDetails } from '@/components/event-details/event-details';
import { EventHeading } from '@/components/event-details/event-heading';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/loader';
import { useAppBar } from '@/hooks/use-app-bar';
import { useIsMobile } from '@/hooks/use-mobile';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { getPath } from '@/routes/paths';
import { isCapacitor } from '@/utils/capacitor';
import { ArrowLeft, Link as LinkIcon } from 'lucide-react';
import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { EVENT_TYPE } from '@openathlete/shared';

interface P {
  eventId: number;
}

/** One activity on its own page: what a shared link or a notification opens */
export function ActivityView({ eventId }: P) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: athlete } = useGetMyAthleteQuery();
  const {
    data: event,
    isPending,
    isError,
  } = useGetEventQuery(eventId, { retry: false });

  // Opened straight from a link, there is no page to go back to
  const goBack = () =>
    location.key === 'default'
      ? navigate(getPath(['dashboard', 'calendar']))
      : navigate(-1);

  const isMobile = useIsMobile();
  const eventName = event?.name;
  const appBar = useMemo(() => ({ title: eventName, back: true }), [eventName]);
  useAppBar(appBar);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(m.activity_link_copied());
    } catch {
      toast.error(m.activity_link_copy_failed());
    }
  };

  if (isPending) return <PageLoader />;

  const found = !isError && event?.type === EVENT_TYPE.ACTIVITY;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 p-4" data-activity-page>
      {event && found && <title>{event.name}</title>}
      <div className="flex items-start gap-2">
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="size-11 shrink-0"
            onClick={goBack}
            aria-label={m.ui_back()}
          >
            <ArrowLeft className="size-5" />
          </Button>
        )}
        {event && found && (
          <>
            <div className="min-w-0 flex-1 space-y-1 md:pt-2">
              <h1 className="font-semibold">
                <EventHeading event={event} hideName={isMobile} />
              </h1>
              <p className="text-sm text-muted-foreground">
                {new Date(event.startDate).toLocaleString(getLocale(), {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            {/* A native app's own URL means nothing outside of it */}
            {!isCapacitor() && (
              <Button
                variant="outline"
                size="icon"
                className="size-11 shrink-0"
                onClick={copyLink}
                aria-label={m.activity_copy_link()}
                title={m.activity_copy_link()}
              >
                <LinkIcon className="size-4" />
              </Button>
            )}
          </>
        )}
      </div>
      {event && found ? (
        <>
          {event.athleteId === athlete?.athleteId && (
            <ActivityValidationAlert
              event={event}
              athleteId={athlete?.athleteId}
            />
          )}
          <EventDetails eventId={event.eventId} />
        </>
      ) : (
        <p className="text-muted-foreground" data-activity-not-found>
          {m.activity_not_found()}
        </p>
      )}
    </div>
  );
}
