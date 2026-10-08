import { useLoginWithFirebaseMutation } from '@/api/auth';
import { useInstanceInfoQuery } from '@/api/instance';
import { AppleIcon } from '@/components/icons/apple';
import { GoogleIcon } from '@/components/icons/google';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/auth';
import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import { isIOS } from '@/utils/capacitor';
import {
  type OAuthProviderId,
  getFirebaseIdTokenForProvider,
  isFirebaseWebConfigured,
} from '@/utils/firebase-auth';
import { takeReturnTo } from '@/utils/return-to';
import { cn } from '@/utils/shadcn';
import { signupRefusal } from '@/utils/signup';
import { usePostHog } from 'posthog-js/react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type Props = {
  className?: string;
  invitationToken?: string | null;
  coachInvitationToken?: string | null;
  redirectTo?: string;
};

export function OAuthButtons({
  className,
  invitationToken,
  coachInvitationToken,
  redirectTo,
}: Props) {
  const nav = useNavigate();
  const { initialize } = useAuthContext();
  const posthog = usePostHog();
  const { data: instance } = useInstanceInfoQuery();
  const [pendingProvider, setPendingProvider] =
    useState<OAuthProviderId | null>(null);
  const lastProvider = useRef<OAuthProviderId>('google');

  const loginWithFirebaseMutation = useLoginWithFirebaseMutation({
    onSuccess: async (_, variables) => {
      posthog?.capture(`user_logged_in_with_${lastProvider.current}`, {
        has_invitation: !!variables.invitationToken,
      });
      await initialize();
      nav(takeReturnTo(redirectTo || getPath(['dashboard'])));
    },
    onError: (error) => {
      // Signing in with a provider creates the account of a new user
      toast.error(signupRefusal(error) ?? m.oauth_login_failed());
    },
    onSettled: () => {
      setPendingProvider(null);
    },
  });

  const handleProvider = async (providerId: OAuthProviderId) => {
    try {
      setPendingProvider(providerId);
      lastProvider.current = providerId;
      const idToken = await getFirebaseIdTokenForProvider(providerId);
      loginWithFirebaseMutation.mutate({
        idToken,
        invitationToken: invitationToken || undefined,
        coachInvitationToken: coachInvitationToken || undefined,
      });
    } catch (error) {
      console.error('OAuth sign-in failed:', error);
      toast.error(m.oauth_login_failed());
      setPendingProvider(null);
    }
  };

  const isLoading =
    loginWithFirebaseMutation.isPending || pendingProvider !== null;

  // Both the API and this build need Firebase: offering the button without
  // them ends on "OAuth sign-in failed"
  if (!instance?.googleSignIn || !isFirebaseWebConfigured()) return null;

  return (
    <div className={cn('grid gap-5', className)}>
      <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
        <span className="bg-background text-muted-foreground relative z-10 px-2">
          {m.or_continue_with()}
        </span>
      </div>

      <div className="grid gap-2">
        {/* App Store guideline 4.8: an app offering Google sign-in must also
            offer Sign in with Apple, at least as prominently */}
        {isIOS() && (
          <Button
            type="button"
            className="w-full justify-center gap-2 bg-black text-white hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/85"
            onClick={() => handleProvider('apple')}
            disabled={isLoading}
            isLoading={pendingProvider === 'apple'}
          >
            <AppleIcon className="h-4 w-4" />
            {m.continue_with_apple()}
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          className="w-full justify-center gap-2"
          onClick={() => handleProvider('google')}
          disabled={isLoading}
          isLoading={pendingProvider === 'google'}
        >
          <GoogleIcon className="h-4 w-4" />
          {m.continue_with_google()}
        </Button>
      </div>
    </div>
  );
}
