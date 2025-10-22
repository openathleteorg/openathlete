import { StravaIcon } from '@/assets/icons';
import { Button } from '@/components/ui/button';
import { API_BASE_URL } from '@/config';
import { m } from '@/paraglide/messages';
import { useGetOAuthUriMutation } from '@/api/connector';
import { useGetMyIcalCalendarSecretQuery } from '@/api/event';

interface P {}

export function ConnectorsTab({}: P) {
  const getStravaUriMutation = useGetOAuthUriMutation({
    onSuccess: (uri) => {
      window.open(uri, '_self')?.focus();
    },
  });
  const { data: icalSecret } = useGetMyIcalCalendarSecretQuery();

  return (
    <div className="flex flex-col gap-4 items-start">
      <Button
        onClick={() => getStravaUriMutation.mutate('STRAVA')}
        className="mt-4"
        variant="outline"
        isLoading={getStravaUriMutation.isPending}
      >
        <StravaIcon />
        {m.connect_with_strava()}
      </Button>
      {icalSecret && (
        <>
          <div className="text-sm font-semibold">
            {m.icalendar_url_description()}
          </div>
          <div className="text-sm text-muted-foreground font-mono p-2 border-1 break-all rounded-sm">
            {`${API_BASE_URL}/event/ical?calendar=${icalSecret}`}
          </div>
        </>
      )}
    </div>
  );
}
