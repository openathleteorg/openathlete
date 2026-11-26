import { useExchangeOidcCodeMutation } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { useAuthContext } from '@/contexts/auth';
import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import { takeOidcLoginAttempt } from '@/utils/oidc-login-attempt';
import { takeReturnTo } from '@/utils/return-to';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { OIDC_ERRORS, OidcError } from '@openathlete/shared';

const ERROR_MESSAGES: Record<OidcError, () => string> = {
  signup_closed: () => m.signup_closed_message(),
  signup_invite_only: () => m.signup_invite_only_message(),
  email_unverified: () => m.sso_email_unverified(),
  failed: () => m.sso_failed(),
};

/**
 * Back from the instance's OpenID Connect provider: the API put a one-time
 * code, or why it failed, in the fragment.
 */
export function SsoView() {
  const nav = useNavigate();
  const { initialize } = useAuthContext();
  const started = useRef(false);
  const committed = useRef(false);
  const [error, setError] = useState<OidcError | null>(null);
  const exchange = useExchangeOidcCodeMutation({
    onSuccess: async (_, __, isCurrent) => {
      committed.current = true;
      await initialize({ authenticated: true });
      if (!isCurrent()) {
        setError('failed');
        return;
      }
      nav(takeReturnTo(getPath(['dashboard'])), { replace: true });
    },
    onSettled: () => {
      if (!committed.current) setError('failed');
    },
  });

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const params = new URLSearchParams(window.location.hash.slice(1));
    // The code must not stay in the address bar or the history
    window.history.replaceState(null, '', window.location.pathname);
    const code = params.get('code');
    const failure = params.get('error');
    const attempt = takeOidcLoginAttempt(params.get('attempt'));
    if (code && attempt) {
      exchange.mutate({ code }, attempt);
    } else {
      setError(
        OIDC_ERRORS.includes(failure as OidcError)
          ? (failure as OidcError)
          : 'failed',
      );
    }
  }, [exchange]);

  if (!error) {
    return (
      <div className="flex flex-col items-center gap-3 py-8" data-sso-pending>
        <Loader />
        <p className="text-sm text-muted-foreground">{m.sso_signing_in()}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 text-center" data-sso-error={error}>
      <h1 className="text-xl font-semibold">{m.sso_failed_title()}</h1>
      <p className="text-sm text-muted-foreground">{ERROR_MESSAGES[error]()}</p>
      <Button asChild>
        <Link to={getPath(['auth', 'login'])}>{m.sso_back_to_login()}</Link>
      </Button>
    </div>
  );
}
