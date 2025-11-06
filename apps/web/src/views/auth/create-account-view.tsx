import { FormProvider, RHFTextField } from '@/components/hook-form';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/auth';
import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import { useLoginMutation } from '@/api/auth';
import { AuthAPI } from '@/api/auth/auth.api';
import { useCreateAccountMutation } from '@/api/user';
import { cn } from '@/utils/shadcn';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import z from 'zod';

import { createAccountDtoSchema } from '@openathlete/shared';

export function CreateAccountView({ className }: React.ComponentProps<'form'>) {
  const { initialize } = useAuthContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get('invitation');
  const [invitationEmail, setInvitationEmail] = useState<string | null>(null);
  const [isVerifyingInvitation, setIsVerifyingInvitation] = useState(false);
  const methods = useForm<z.infer<typeof createAccountDtoSchema>>({
    resolver: zodResolver(createAccountDtoSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      invitationToken: invitationToken || undefined,
    },
  });

  useEffect(() => {
    if (invitationToken) {
      setIsVerifyingInvitation(true);
      AuthAPI.verifyInvitation(invitationToken)
        .then((result) => {
          if (result.valid && result.email) {
            setInvitationEmail(result.email);
            methods.setValue('email', result.email);
          }
        })
        .finally(() => {
          setIsVerifyingInvitation(false);
        });
    }
  }, [invitationToken, methods]);

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

  const { handleSubmit } = methods;

  const onSubmit = handleSubmit(async (data) => {
    const submitData = {
      ...data,
      invitationToken: invitationToken || undefined,
    };
    createAccountMutation.mutate(submitData);
  });

  return (
    <FormProvider
      methods={methods}
      onSubmit={onSubmit}
      className={cn('flex flex-col gap-6', className)}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">{m.create_an_account()}</h1>
        <p className="text-muted-foreground text-sm text-balance">
          {invitationEmail
            ? m.create_account_from_invitation()
            : m.enter_details_to_create_account()}
        </p>
      </div>
      {isVerifyingInvitation && (
        <p className="text-sm text-muted-foreground text-center">
          {m.verifying_invitation()}
        </p>
      )}
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
          disabled={!!invitationEmail}
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
          isLoading={createAccountMutation.isPending || isVerifyingInvitation}
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
