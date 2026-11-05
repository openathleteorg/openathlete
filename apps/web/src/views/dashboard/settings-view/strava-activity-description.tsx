import {
  ConnectedProvider,
  useActivityDescriptionPreviewQuery,
  useUpdateProviderPreferencesMutation,
} from '@/api/provider';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { m } from '@/paraglide/messages';
import { toEmailLanguage } from '@/utils/language-choice';
import { SUPPORTED_LOCALES, getLocaleName } from '@/utils/locales';
import { ENABLE_DESCRIPTION_AFTER_OAUTH_KEY } from '@/utils/oauth';
import { toast } from 'sonner';

import { EmailLanguage } from '@openathlete/shared';

import { SettingsRow } from './settings-section';

const APP_LANGUAGE = 'APP';

type Props = {
  account: ConnectedProvider;
  /** Sends the user through Strava's consent page to allow editing */
  onAuthorize: () => void;
};

/**
 * OpenAthlete's analysis in the description of new Strava activities: on by
 * default for new connections, off for accounts connected before, which
 * must allow editing activities on Strava first.
 */
export function StravaActivityDescriptionRows({ account, onAuthorize }: Props) {
  const update = useUpdateProviderPreferencesMutation({
    onError: (error) =>
      toast.error(error.message || m.activity_description_update_failed()),
  });
  const language = account.activityDescriptionLanguage;
  const preview = useActivityDescriptionPreviewQuery(
    language ? { language } : {},
  );

  const handleToggle = (enabled: boolean) => {
    if (enabled && !account.activityDescriptionAuthorized) {
      try {
        localStorage.setItem(ENABLE_DESCRIPTION_AFTER_OAUTH_KEY, '1');
      } catch {
        // Without storage the user turns it on again after connecting
      }
      onAuthorize();
      return;
    }
    update.mutate({
      provider: 'STRAVA',
      payload: { activityDescriptionEnabled: enabled },
    });
  };

  return (
    <>
      <SettingsRow
        title={
          <Label htmlFor="strava-activity-description">
            {m.activity_description_toggle_label()}
          </Label>
        }
        description={
          <>
            {m.activity_description_toggle_description()}
            {!account.activityDescriptionAuthorized &&
              ` ${m.activity_description_authorize_hint()}`}
          </>
        }
      >
        <Switch
          id="strava-activity-description"
          checked={account.activityDescriptionEnabled}
          onCheckedChange={handleToggle}
          disabled={update.isPending}
        />
      </SettingsRow>
      <SettingsRow
        stacked
        title={
          <Label htmlFor="strava-activity-description-language">
            {m.activity_description_language_label()}
          </Label>
        }
      >
        <Select
          value={language ?? APP_LANGUAGE}
          onValueChange={(value) =>
            update.mutate({
              provider: 'STRAVA',
              payload: {
                activityDescriptionLanguage:
                  value === APP_LANGUAGE ? null : (value as EmailLanguage),
              },
            })
          }
          disabled={update.isPending}
        >
          <SelectTrigger
            id="strava-activity-description-language"
            className="w-full sm:w-64"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={APP_LANGUAGE}>
              {m.activity_description_language_app()}
            </SelectItem>
            {SUPPORTED_LOCALES.map((locale) => (
              <SelectItem key={locale} value={toEmailLanguage(locale)}>
                {getLocaleName(locale)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingsRow>
      <SettingsRow
        stacked
        title={m.activity_description_preview_title()}
        description={m.activity_description_preview_description()}
      >
        {preview.isPending ? (
          <Skeleton className="h-40 w-full rounded-xl" />
        ) : preview.data?.description ? (
          <p
            className="w-full whitespace-pre-wrap break-words rounded-xl border bg-background p-3 text-sm leading-relaxed"
            data-testid="activity-description-preview"
          >
            {preview.data.description}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {m.activity_description_preview_empty()}
          </p>
        )}
      </SettingsRow>
    </>
  );
}
