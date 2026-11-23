import { useGetMeQuery, useUpdateAccountMutation } from '@/api/user';
import { userKeys } from '@/api/user/user.keys';
import { useFeature } from '@/hooks/use-feature';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import {
  SettingsPanel,
  SettingsSection,
} from '@/views/dashboard/settings-view/settings-section';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Lock } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { ACCENT_THEMES, AccentTheme, Feature, User } from '@openathlete/shared';

import { useFeaturePaywall } from './feature-paywall';

/**
 * Puts the user's accent colour on <html> while they may use it: a theme
 * chosen as a Supporter waits, unused, if the subscription ends.
 */
export function AccentThemeSync() {
  const { data: me } = useGetMeQuery();
  const { available } = useFeature(Feature.THEMES);
  const accent = available ? (me?.accentTheme ?? null) : null;

  useEffect(() => {
    const root = document.documentElement;
    if (accent) root.dataset.accent = accent;
    else delete root.dataset.accent;
    return () => {
      delete root.dataset.accent;
    };
  }, [accent]);

  return null;
}

const LABELS: Record<AccentTheme | 'default', () => string> = {
  default: m.accent_default,
  ocean: m.accent_ocean,
  forest: m.accent_forest,
  sunset: m.accent_sunset,
  berry: m.accent_berry,
  rose: m.accent_rose,
};

/** The accent colours, in the settings: a Supporter perk */
export function AccentThemeSettings() {
  const queryClient = useQueryClient();
  const { data: me } = useGetMeQuery();
  const perk = useFeature(Feature.THEMES);
  const paywall = useFeaturePaywall();
  const { mutate: save } = useUpdateAccountMutation({
    onError: () => {
      queryClient.invalidateQueries({ queryKey: [userKeys.getMe] });
      toast.error(m.accent_save_failed());
    },
  });
  if (perk.hidden) return null;

  const current = perk.available ? (me?.accentTheme ?? null) : null;
  const choose = (accent: AccentTheme | null) => {
    if (accent && !perk.available) {
      paywall.open(Feature.THEMES, 'settings_accent');
      return;
    }
    queryClient.setQueryData<User>([userKeys.getMe], (old) =>
      old ? { ...old, accentTheme: accent } : old,
    );
    save({ accentTheme: accent });
  };

  const choices: (AccentTheme | null)[] = [null, ...ACCENT_THEMES];
  return (
    <SettingsSection
      title={m.accent_title()}
      description={m.accent_description()}
    >
      <SettingsPanel padded>
        <div
          role="radiogroup"
          aria-label={m.accent_title()}
          className="flex flex-wrap gap-3"
          data-accent-picker
        >
          {choices.map((accent) => {
            const key = accent ?? 'default';
            const selected = current === accent;
            const locked = accent !== null && perk.locked;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={LABELS[key]()}
                title={LABELS[key]()}
                onClick={() => choose(accent)}
                className={cn(
                  'relative flex size-11 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition-shadow',
                  selected
                    ? 'ring-2 ring-foreground'
                    : 'hover:ring-2 hover:ring-border',
                )}
                data-accent-choice={key}
              >
                {selected && (
                  <Check className="size-4 text-primary-foreground" />
                )}
                {locked && (
                  <Lock
                    aria-hidden
                    data-supporter-lock
                    className="size-3.5 text-primary-foreground/90"
                  />
                )}
              </button>
            );
          })}
        </div>
        {perk.locked && (
          <p className="mt-3 text-xs text-muted-foreground">
            {m.feature_themes_body()}
          </p>
        )}
      </SettingsPanel>
    </SettingsSection>
  );
}
