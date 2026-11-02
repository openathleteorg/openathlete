import { useGetMyAthleteQuery } from '@/api/athlete';
import { useCurrentSubscription } from '@/api/subscription';
import { useDeleteAccountMutation, useUpdateAccountMutation } from '@/api/user';
import { ConfirmAction } from '@/components/confirm-action';
import { FormProvider, RHFTextField } from '@/components/hook-form';
import { RHFSelect } from '@/components/hook-form/rhf-select';
import { SessionValidationSettingsCard } from '@/components/session-validation-settings-card';
import { Button } from '@/components/ui/button';
import { SelectItem } from '@/components/ui/select';
import { useAuthContext } from '@/contexts/auth';
import { m } from '@/paraglide/messages';
import { getApiBaseUrl, isCapacitor } from '@/utils/capacitor';
import { revokeAppleSignIn } from '@/utils/firebase-auth';
import { openServerSelection } from '@/utils/mobile-server';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  BillingProvider,
  SubscriptionStatus,
  updateAccountDtoSchema,
} from '@openathlete/shared';

import { PrivacySection } from './privacy-section';
import {
  SettingsPanel,
  SettingsRow,
  SettingsSection,
} from './settings-section';
import { TrainingRemindersSection } from './training-reminders-section';

export function ProfileTab() {
  const { user, logout } = useAuthContext();
  const { data: athlete } = useGetMyAthleteQuery();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const updateAccountMutation = useUpdateAccountMutation({
    onSuccess: async () => {
      toast.success(m.account_updated_successfully());
    },
  });
  const { data: subscription } = useCurrentSubscription();
  // Deleting the account cannot stop Apple from billing
  const appStoreRenews =
    subscription?.provider === BillingProvider.APPLE &&
    subscription.status === SubscriptionStatus.ACTIVE &&
    !subscription.cancelAtPeriodEnd;
  const deleteAccountMutation = useDeleteAccountMutation({
    onSuccess: async () => {
      toast.success(m.account_deleted_successfully());
      await revokeAppleSignIn().catch((error: unknown) =>
        console.error('Revoking Sign in with Apple failed:', error),
      );
      logout();
    },
    onError: () => {
      toast.error(m.failed_to_delete_account());
    },
  });
  const methods = useForm<z.infer<typeof updateAccountDtoSchema>>({
    resolver: zodResolver(updateAccountDtoSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      gender: user?.gender || undefined,
    },
  });

  const { handleSubmit } = methods;

  const onSubmit = handleSubmit(async (data) =>
    updateAccountMutation.mutate(data),
  );
  return (
    <div className="space-y-8">
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <SettingsPanel padded className="divide-y-0">
          <div className="grid gap-4 sm:grid-cols-2">
            <RHFTextField
              name="firstName"
              type="text"
              placeholder={m.first_name_placeholder()}
              label={m.first_name()}
              required
            />
            <RHFTextField
              name="lastName"
              type="text"
              placeholder={m.last_name_placeholder()}
              label={m.last_name()}
              required
            />
            <RHFSelect
              name="gender"
              label={m.gender()}
              placeholder={m.gender_placeholder()}
            >
              <SelectItem value="MALE">{m.gender_male()}</SelectItem>
              <SelectItem value="FEMALE">{m.gender_female()}</SelectItem>
              <SelectItem value="OTHER">{m.gender_other()}</SelectItem>
            </RHFSelect>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              type="submit"
              className="w-full sm:w-fit"
              isLoading={updateAccountMutation.isPending}
            >
              {m.update()}
            </Button>
          </div>
        </SettingsPanel>
      </FormProvider>
      {athlete?.athleteId && (
        <SessionValidationSettingsCard athleteId={athlete.athleteId} />
      )}
      {athlete?.athleteId && <TrainingRemindersSection />}
      <PrivacySection />
      {isCapacitor() && (
        <SettingsSection title={m.mobile_server_title()}>
          <SettingsPanel>
            <SettingsRow
              stacked
              title={<span className="break-all">{getApiBaseUrl()}</span>}
              description={m.mobile_server_switch_warning()}
            >
              <Button variant="outline" onClick={openServerSelection}>
                {m.mobile_server_change()}
              </Button>
            </SettingsRow>
          </SettingsPanel>
        </SettingsSection>
      )}
      <SettingsPanel>
        <SettingsRow
          stacked
          title={m.delete_account()}
          description={m.delete_account_description()}
        >
          <Button
            variant="outline"
            className="text-destructive-foreground"
            onClick={() => setDeleteDialogOpen(true)}
          >
            {m.delete_account()}
          </Button>
        </SettingsRow>
      </SettingsPanel>
      <ConfirmAction
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={() => {
          deleteAccountMutation.mutate();
        }}
        title={m.delete_account()}
        message={
          appStoreRenews
            ? `${m.confirm_delete_account()} ${m.delete_account_app_store_warning()}`
            : m.confirm_delete_account()
        }
        confirmText={m.delete_account()}
        isLoading={deleteAccountMutation.isPending}
      />
    </div>
  );
}
