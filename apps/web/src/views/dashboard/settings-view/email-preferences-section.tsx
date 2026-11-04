import { useInstanceInfoQuery } from '@/api/instance';
import { useGetMeQuery, useUpdateAccountMutation } from '@/api/user';
import { userKeys } from '@/api/user/user.keys';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { m } from '@/paraglide/messages';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { UpdateAccountDto } from '@openathlete/shared';

import {
  SettingsPanel,
  SettingsRow,
  SettingsSection,
} from './settings-section';

/**
 * Which of the emails sent on their own the user wants: onboarding tips and
 * alerts, the monthly recap, news. Only on instances that send them.
 */
export function EmailPreferencesSection() {
  const queryClient = useQueryClient();
  const { data: instance } = useInstanceInfoQuery();
  const { data: me } = useGetMeQuery();
  const updateMutation = useUpdateAccountMutation({
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [userKeys.getMe] }),
    onError: () => toast.error(m.email_preferences_update_failed()),
  });
  if (!instance?.personalEmails) return null;

  const rows: {
    id: string;
    title: string;
    description: string;
    checked: boolean;
    update: (checked: boolean) => UpdateAccountDto;
  }[] = [
    {
      id: 'email-tips',
      title: m.email_tips(),
      description: m.email_tips_description(),
      checked: me?.emailTips ?? true,
      update: (emailTips) => ({ emailTips }),
    },
    {
      id: 'email-recap',
      title: m.email_recap(),
      description: m.email_recap_description(),
      checked: me?.emailRecap ?? true,
      update: (emailRecap) => ({ emailRecap }),
    },
    {
      id: 'email-news',
      title: m.email_news(),
      description: m.email_news_description(),
      checked: Boolean(me?.emailNewsConsentAt),
      update: (emailNews) => ({ emailNews }),
    },
  ];

  return (
    <SettingsSection title={m.email_preferences()}>
      <SettingsPanel>
        {rows.map((row) => (
          <SettingsRow
            key={row.id}
            title={<Label htmlFor={row.id}>{row.title}</Label>}
            description={row.description}
          >
            <Switch
              id={row.id}
              checked={row.checked}
              onCheckedChange={(checked) =>
                updateMutation.mutate(row.update(checked))
              }
              disabled={!me || updateMutation.isPending}
            />
          </SettingsRow>
        ))}
      </SettingsPanel>
    </SettingsSection>
  );
}
