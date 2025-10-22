import { FormProvider, RHFTextField } from '@/components/hook-form';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/auth';
import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import { useLoginMutation } from '@/api/auth';
import { useCreateAccountMutation } from '@/api/user';
import { cn } from '@/utils/shadcn';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import z from 'zod';

import { createAccountDtoSchema } from '@openathlete/shared';

export function CreateAccountView({ className }: React.ComponentProps<'form'>) {
  const { initialize } = useAuthContext();
  const navigate = useNavigate();
  const loginMutation = useLoginMutation({
    onSuccess: async () => {
      await initialize();
      navigate(getPath(['dashboard']));
    },
  });
  const createAccountMutation = useCreateAccountMutation({
    onSuccess: async (_, variables) => {
      loginMutation.mutate(variables);
    },
  });
  const methods = useForm<z.infer<typeof createAccountDtoSchema>>({
    resolver: zodResolver(createAccountDtoSchema),
    defaultValues: { email: '', password: '', firstName: '', lastName: '' },
  });

  const { handleSubmit } = methods;

  const onSubmit = handleSubmit(async (data) =>
    createAccountMutation.mutate(data),
  );

  return (
    <FormProvider
      methods={methods}
      onSubmit={onSubmit}
      className={cn('flex flex-col gap-6', className)}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">{m.create_an_account()}</h1>
        <p className="text-muted-foreground text-sm text-balance">
          {m.enter_details_to_create_account()}
        </p>
      </div>
      <div className="grid gap-6">
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
        <RHFTextField
          name="email"
          type="email"
          placeholder={m.email_placeholder()}
          label={m.email()}
          required
        />
        <RHFTextField
          name="password"
          type="password"
          required
          label={m.password()}
        />
        <Button
          type="submit"
          className="w-full"
          onClick={onSubmit}
          isLoading={createAccountMutation.isPending}
        >
          {m.create_account()}
        </Button>
      </div>
      <div className="text-center text-sm">
        {m.already_have_account()}{' '}
        <Link to="/auth/login" className="underline underline-offset-4">
          {m.login()}
        </Link>
      </div>
    </FormProvider>
  );
}
