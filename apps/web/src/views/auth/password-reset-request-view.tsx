import { FormProvider, RHFTextField } from '@/components/hook-form';
import { Button } from '@/components/ui/button';
import { m } from '@/paraglide/messages';
import { usePasswordResetRequestMutation } from '@/api/user';
import { cn } from '@/utils/shadcn';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import z from 'zod';

import { passwordResetRequestSchema } from '@openathlete/shared';

export function PasswordResetRequestView({
  className,
}: React.ComponentProps<'form'>) {
  const passwordResetRequestMutation = usePasswordResetRequestMutation({
    onSuccess: async () => {
      toast.success(m.password_reset_email_sent());
    },
    onError: () => {
      toast.error(m.error_sending_password_reset_email());
    },
  });
  const methods = useForm<z.infer<typeof passwordResetRequestSchema>>({
    resolver: zodResolver(passwordResetRequestSchema),
    defaultValues: { email: '' },
  });

  const { handleSubmit } = methods;

  const onSubmit = handleSubmit(async (data) =>
    passwordResetRequestMutation.mutate(data),
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
          {m.enter_email_to_reset_password()}
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <RHFTextField
            name="email"
            type="email"
            placeholder={m.email_placeholder()}
            label={m.email()}
            required
          />
        </div>
        <Button
          type="submit"
          className="w-full"
          onClick={onSubmit}
          isLoading={passwordResetRequestMutation.isPending}
        >
          {m.send_password_reset_email()}
        </Button>
      </div>
      <div className="text-center text-sm">
        {m.remembered_your_password()}{' '}
        <Link to="/auth/login" className="underline underline-offset-4">
          {m.log_in()}
        </Link>
      </div>
    </FormProvider>
  );
}
