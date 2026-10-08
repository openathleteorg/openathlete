import { useGetMyAthleteQuery } from '@/api/athlete';
import { useDeleteAccountMutation, useUpdateAccountMutation } from '@/api/user';
import { ConfirmAction } from '@/components/confirm-action';
import { FormProvider, RHFTextField } from '@/components/hook-form';
import { RHFSelect } from '@/components/hook-form/rhf-select';
import { SessionValidationSettingsCard } from '@/components/session-validation-settings-card';
import { Button } from '@/components/ui/button';
import { SelectItem } from '@/components/ui/select';
import { useAuthContext } from '@/contexts/auth';
import { m } from '@/paraglide/messages';
import { revokeAppleSignIn } from '@/utils/firebase-auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { updateAccountDtoSchema } from '@openathlete/shared';

import { PrivacySection } from './privacy-section';
import { SettingsSection } from './settings-section';

export function ProfileTab() {
  const { user, logout } = useAuthContext();
  const { data: athlete } = useGetMyAthleteQuery();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const updateAccountMutation = useUpdateAccountMutation({
    onSuccess: async () => {
      toast.success(m.account_updated_successfully());
    },
  });
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
    <div className="space-y-6">
      <SettingsSection
        title={m.profile()}
        description={m.update_profile_information()}
      >
        <FormProvider methods={methods} onSubmit={onSubmit}>
          <div className="flex w-full max-w-md flex-col gap-4">
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
            <Button
              type="submit"
              className="w-fit"
              isLoading={updateAccountMutation.isPending}
            >
              {m.update()}
            </Button>
          </div>
        </FormProvider>
      </SettingsSection>
      {athlete?.athleteId && (
        <SessionValidationSettingsCard athleteId={athlete.athleteId} />
      )}
      <PrivacySection />
      <SettingsSection
        title={m.delete_account()}
        description={m.delete_account_description()}
      >
        <div className="flex w-full max-w-md flex-col gap-4">
          <Button
            variant="destructive"
            className="w-fit"
            onClick={() => setDeleteDialogOpen(true)}
          >
            {m.delete_account()}
          </Button>
        </div>
      </SettingsSection>
      <ConfirmAction
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={() => {
          deleteAccountMutation.mutate();
        }}
        title={m.delete_account()}
        message={m.confirm_delete_account()}
        confirmText={m.delete_account()}
        isLoading={deleteAccountMutation.isPending}
      />
    </div>
  );
}
