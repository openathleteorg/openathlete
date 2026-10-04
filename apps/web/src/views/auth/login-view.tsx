import { useLoginMutation } from '@/api/auth';
import { FormProvider, RHFTextField } from '@/components/hook-form';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuthContext } from '@/contexts/auth';
import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import { cn } from '@/utils/shadcn';
import { OAuthButtons } from '@/views/auth/oauth-buttons';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { usePostHog } from 'posthog-js/react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import z from 'zod';

import { loginDtoSchema } from '@openathlete/shared';

const PLAN_TOKEN_STORAGE_KEY = 'pendingPlanToken';

function loginErrorMessage(error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined;
  if (status === 401) return m.login_invalid_credentials();
  if (status === 429) return m.login_too_many_attempts();
  return m.login_failed();
}

export function LoginView({ className }: React.ComponentProps<'form'>) {
  const { initialize } = useAuthContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planToken = searchParams.get('planToken');
  const posthog = usePostHog();

  // Store planToken in sessionStorage if present
  useEffect(() => {
    if (planToken) {
      sessionStorage.setItem(PLAN_TOKEN_STORAGE_KEY, planToken);
    }
  }, [planToken]);

  const loginMutation = useLoginMutation({
    onSuccess: async () => {
      posthog?.capture('user_logged_in');
      await initialize();
      navigate(getPath(['dashboard']));
    },
    onError: (error) => toast.error(loginErrorMessage(error)),
  });
  const methods = useForm<z.infer<typeof loginDtoSchema>>({
    resolver: zodResolver(loginDtoSchema),
    defaultValues: { email: '', password: '' },
  });

  const { handleSubmit } = methods;

  const onSubmit = handleSubmit(async (data) => loginMutation.mutate(data));

  return (
    <FormProvider
      methods={methods}
      onSubmit={onSubmit}
      className={cn('flex flex-col gap-6', className)}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">{m.login_to_your_account()}</h1>
        <p className="text-muted-foreground text-sm text-balance">
          {m.enter_email_to_login()}
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
        <div className="grid gap-3">
          <div className="flex items-center">
            <Label htmlFor="password">{m.password()}</Label>
            <Link
              to="/auth/password-reset-request"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              {m.forgot_your_password()}
            </Link>
          </div>
          <RHFTextField name="password" type="password" required />
        </div>
        <Button
          type="submit"
          className="w-full"
          onClick={onSubmit}
          isLoading={loginMutation.isPending}
        >
          {m.login()}
        </Button>
        <OAuthButtons />
      </div>
      <div className="text-center text-sm">
        {m.dont_have_account()}{' '}
        <Link
          to="/auth/create-account"
          className="underline underline-offset-4"
        >
          {m.sign_up()}
        </Link>
      </div>
    </FormProvider>
  );
}
