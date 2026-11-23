import { useUpdateSupporterWall } from '@/api/subscription';
import {
  FormProvider,
  RHFCheckbox,
  RHFTextField,
} from '@/components/hook-form';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/auth/hooks/use-auth-context';
import { m } from '@/paraglide/messages';
import { transparencyPageUrl } from '@/utils/transparency';
import {
  SettingsPanel,
  SettingsSection,
} from '@/views/dashboard/settings-view/settings-section';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowUpRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  SUPPORTER_WALL_NAME_MAX_LENGTH,
  UpdateSupporterWallDto,
  updateSupporterWallDtoSchema,
} from '@openathlete/shared';

/**
 * Whether a Supporter appears on the wall of the website's transparency
 * page, and under which name. Off until they tick it.
 */
export function SupporterWallSettings({
  show,
  wallName,
}: {
  show: boolean;
  wallName: string | null;
}) {
  const { user } = useAuthContext();
  const update = useUpdateSupporterWall();
  const methods = useForm<UpdateSupporterWallDto>({
    resolver: zodResolver(updateSupporterWallDtoSchema),
    values: { show, name: wallName ?? '' },
  });
  const shown = methods.watch('show');

  const onSubmit = methods.handleSubmit(async (data) => {
    try {
      await update.mutateAsync({ show: data.show, name: data.name ?? '' });
      toast.success(m.subscription_wall_saved());
    } catch {
      toast.error(m.subscription_wall_error());
    }
  });

  return (
    <SettingsSection
      title={m.subscription_wall_title()}
      description={m.subscription_wall_description()}
    >
      <SettingsPanel padded className="space-y-4 divide-y-0">
        <FormProvider methods={methods} onSubmit={onSubmit}>
          <div className="space-y-4">
            <RHFCheckbox name="show" label={m.subscription_wall_show()} />
            {shown && (
              <>
                <RHFTextField
                  name="name"
                  label={m.subscription_wall_name_label()}
                  placeholder={user?.firstName ?? ''}
                  maxLength={SUPPORTER_WALL_NAME_MAX_LENGTH}
                  autoComplete="nickname"
                />
                <p className="text-sm text-muted-foreground">
                  {m.subscription_wall_hint()}
                </p>
              </>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                type="submit"
                className="h-11 w-full sm:w-auto"
                disabled={!methods.formState.isDirty || update.isPending}
              >
                {update.isPending ? m.loading() : m.subscription_wall_save()}
              </Button>
              <a
                href={transparencyPageUrl()}
                target="_blank"
                rel="noopener"
                className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                {m.subscription_transparency_link()}
                <ArrowUpRight className="size-4" />
              </a>
            </div>
          </div>
        </FormProvider>
      </SettingsPanel>
    </SettingsSection>
  );
}
