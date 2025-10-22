import { FormProvider, RHFTextField } from '@/components/hook-form';
import { Button } from '@/components/ui/button';
import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import { usePasswordResetMutation } from '@/api/user';
import { cn } from '@/utils/shadcn';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import z from 'zod';

import { passwordResetSchema } from '@openathlete/shared';

export function PasswordResetView({ className }: React.ComponentProps<'form'>) {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const passwordResetMutation = usePasswordResetMutation({
    onSuccess: async () => {
      nav(getPath(['auth', 'login']));
      toast.success(m.password_updated_successfully());
    },
    onError: () => {
      toast.error(m.error_updating_password());
    },
  });
  const methods = useForm<z.infer<typeof passwordResetSchema>>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: { token: '', password: '' },
  });

  const { handleSubmit } = methods;

  const onSubmit = handleSubmit(async (data) =>
    passwordResetMutation.mutate({
      ...data,
      token: token || '',
    }),
  );

  return (
    <FormProvider
      methods={methods}
      onSubmit={onSubmit}
      className={cn('flex flex-col gap-6', className)}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">{m.reset_your_password()}</h1>
        <p className="text-muted-foreground text-sm text-balance">
          {m.enter_new_password()}
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <RHFTextField
            name="password"
            type="password"
            label={m.new_password()}
            required
          />
        </div>
        <Button
          type="submit"
          className="w-full"
          onClick={onSubmit}
          isLoading={passwordResetMutation.isPending}
        >
          {m.update_password()}
        </Button>
      </div>
    </FormProvider>
  );
}
