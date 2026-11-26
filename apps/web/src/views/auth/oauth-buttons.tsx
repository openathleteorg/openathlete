import { AuthAPI, useLoginWithFirebaseMutation } from '@/api/auth';
import { useInstanceInfoQuery } from '@/api/instance';
import { AppleIcon } from '@/components/icons/apple';
import { GoogleIcon } from '@/components/icons/google';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/auth';
import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import { beginAuthLogin, isAuthLoginCurrent } from '@/utils/auth-attempt';
import { isCapacitor, isIOS } from '@/utils/capacitor';
import { readPendingClubJoinToken } from '@/utils/club-join';
import {
  type OAuthProviderId,
  getFirebaseIdTokenForProvider,
  isFirebaseWebConfigured,
} from '@/utils/firebase-auth';
import { currentLanguage } from '@/utils/language-choice';
import { rememberOidcLoginAttempt } from '@/utils/oidc-login-attempt';
import { takeReturnTo } from '@/utils/return-to';
import { cn } from '@/utils/shadcn';
import { signupRefusal } from '@/utils/signup';
import { KeyRound } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { getDefaultUnitSystem } from '@openathlete/shared';

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
  // A club link opened before: it lets a new account in on an invite-only
  // instance, and the club is joined once signed in
  const clubJoinToken = readPendingClubJoinToken() ?? undefined;
  const posthog = usePostHog();
  const { data: instance } = useInstanceInfoQuery();
  const [pendingProvider, setPendingProvider] =
    useState<OAuthProviderId | null>(null);
  const lastProvider = useRef<OAuthProviderId>('google');

  const loginWithFirebaseMutation = useLoginWithFirebaseMutation({
    onSuccess: async (_, variables, isCurrent) => {
      posthog?.capture(`user_logged_in_with_${lastProvider.current}`, {
        has_invitation: !!variables.invitationToken,
      });
      await initialize({ authenticated: true });
      if (!isCurrent()) return;
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
    const starting = beginAuthLogin();
    try {
      setPendingProvider(providerId);
      lastProvider.current = providerId;
      // Firebase may need to open a popup in the original click gesture.
      const [attempt, idToken] = await Promise.all([
        starting,
        getFirebaseIdTokenForProvider(providerId),
      ]);
      if (!isAuthLoginCurrent(attempt)) {
        setPendingProvider(null);
        return;
      }
      loginWithFirebaseMutation.mutate(
        {
          idToken,
          invitationToken: invitationToken || undefined,
          coachInvitationToken: coachInvitationToken || undefined,
          clubJoinToken,
          // Saved only if this sign-in creates the account
          language: currentLanguage(),
          unitSystem: getDefaultUnitSystem(navigator.language),
        },
        attempt,
      );
    } catch (error) {
      setPendingProvider(null);
      const attempt = await starting.catch(() => null);
      if (!attempt || isAuthLoginCurrent(attempt)) {
        console.error('OAuth sign-in failed:', error);
        toast.error(m.oauth_login_failed());
      }
    }
  };

  const [leavingForSso, setLeavingForSso] = useState(false);
  const isLoading =
    loginWithFirebaseMutation.isPending ||
    pendingProvider !== null ||
    leavingForSso;

  // Both the API and this build need Firebase: offering the button without
  // them ends on "OAuth sign-in failed"
  const firebase = !!instance?.googleSignIn && isFirebaseWebConfigured();
  // The provider brings the user back to the web app, not to a native one
  const oidc = isCapacitor() ? null : (instance?.oidc ?? null);
  if (!firebase && !oidc) return null;

  const handleOidc = async () => {
    setLeavingForSso(true);
    try {
      const attempt = await beginAuthLogin();
      if (!isAuthLoginCurrent(attempt)) {
        setLeavingForSso(false);
        return;
      }
      if (!rememberOidcLoginAttempt(attempt)) {
        setLeavingForSso(false);
        toast.error(m.sso_failed());
        return;
      }
      window.location.assign(
        AuthAPI.oidcSignInUrl({
          attempt: attempt.ticket,
          invitation: invitationToken || undefined,
          coachInvitation: coachInvitationToken || undefined,
          clubJoin: clubJoinToken,
          language: currentLanguage(),
          unitSystem: getDefaultUnitSystem(navigator.language),
        }),
      );
    } catch {
      setLeavingForSso(false);
      toast.error(m.sso_failed());
    }
  };

  return (
    <div className={cn('grid gap-5', className)}>
      <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
        <span className="bg-background text-muted-foreground relative z-10 px-2">
          {m.or_continue_with()}
        </span>
      </div>

      <div className="grid gap-2">
        {oidc && (
          <Button
            type="button"
            variant="outline"
            className="w-full justify-center gap-2"
            onClick={handleOidc}
            disabled={isLoading}
            isLoading={leavingForSso}
            data-oidc-sign-in
          >
            <KeyRound className="h-4 w-4" />
            {m.continue_with_oidc({ name: oidc.name })}
          </Button>
        )}
        {/* App Store guideline 4.8: an app offering Google sign-in must also
            offer Sign in with Apple, at least as prominently */}
        {firebase && isIOS() && (
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
        {firebase && (
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
        )}
      </div>
    </div>
  );
}
