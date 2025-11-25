import { useGetMyAthleteQuery } from '@/api/athlete';
import { useUpdateAccountMutation } from '@/api/user';
import { FormProvider, RHFTextField } from '@/components/hook-form';
import { RHFSelect } from '@/components/hook-form/rhf-select';
import { SessionValidationSettingsCard } from '@/components/session-validation-settings-card';
import { Button } from '@/components/ui/button';
import { SelectItem } from '@/components/ui/select';
import { useAuthContext } from '@/contexts/auth';
import { m } from '@/paraglide/messages';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { updateAccountDtoSchema } from '@openathlete/shared';

import { SettingsSection } from './settings-section';

export function ProfileTab() {
  const { user } = useAuthContext();
  const { data: athlete } = useGetMyAthleteQuery();
  const updateAccountMutation = useUpdateAccountMutation({
    onSuccess: async () => {
      toast.success(m.account_updated_successfully());
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
    </div>
  );
}
