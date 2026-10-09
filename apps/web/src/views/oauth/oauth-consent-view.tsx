import { useGetMyCoachedAthletesQuery } from '@/api/athlete';
import {
  useOAuthAuthorizeDetailsQuery,
  useOAuthDecisionMutation,
} from '@/api/mcp';
import { useGetMeQuery } from '@/api/user';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { m } from '@/paraglide/messages';
import { Bot, Check, CircleAlert, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import {
  OAuthAuthorizeRequest,
  oauthAuthorizeRequestSchema,
} from '@openathlete/shared';

function Invalid() {
  return (
    <div className="space-y-3 text-center" data-oauth-invalid>
      <CircleAlert className="mx-auto size-10 text-destructive" />
      <h1 className="text-xl font-semibold">
        {m.oauth_consent_invalid_title()}
      </h1>
      <p className="text-sm text-muted-foreground">
        {m.oauth_consent_invalid()}
      </p>
    </div>
  );
}

function Consent({ request }: { request: OAuthAuthorizeRequest }) {
  const {
    data: details,
    isPending,
    isError,
  } = useOAuthAuthorizeDetailsQuery(request);
  const { data: me } = useGetMeQuery();
  // Only worth saying to someone who coaches athletes
  const { data: coached = [] } = useGetMyCoachedAthletesQuery();
  const decide = useOAuthDecisionMutation();
  const [leaving, setLeaving] = useState(false);

  if (isError) return <Invalid />;
  if (isPending || !details) {
    return (
      <div className="space-y-4">
        <Skeleton className="mx-auto size-12 rounded-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const answer = async (approve: boolean) => {
    try {
      const { redirectTo } = await decide.mutateAsync({ request, approve });
      setLeaving(true);
      window.location.assign(redirectTo);
    } catch {
      toast.error(m.oauth_consent_failed());
    }
  };

  const permissions = [
    details.scopes.includes('read') && m.oauth_consent_read(),
    details.scopes.includes('write') && m.oauth_consent_write(),
    coached.length > 0 && m.oauth_consent_coach(),
  ].filter((item) => typeof item === 'string');
  const busy = decide.isPending || leaving;

  return (
    <div className="space-y-6" data-oauth-consent>
      <div className="space-y-3 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
          <Bot className="size-6" />
        </div>
        <h1 className="text-xl font-semibold text-balance">
          {m.oauth_consent_title({ client: details.clientName })}
        </h1>
        {details.clientUri && (
          <p className="text-sm text-muted-foreground break-all">
            {new URL(details.clientUri).host}
          </p>
        )}
        {me?.email && (
          <p className="text-sm text-muted-foreground break-words">
            {m.oauth_consent_signed_in({ email: me.email })}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">{m.oauth_consent_permissions()}</p>
        <ul className="space-y-2" data-oauth-permissions>
          {permissions.map((permission) => (
            <li key={permission} className="flex gap-2 text-sm">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" />
              {permission}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2 rounded-md border bg-muted/50 p-3 text-xs text-muted-foreground">
        {details.alreadyConnected && <p>{m.oauth_consent_already()}</p>}
        <p>{m.oauth_consent_redirect({ host: details.redirectHost })}</p>
        <p className="flex gap-1.5">
          <ShieldCheck className="size-3.5 shrink-0" />
          {m.oauth_consent_trust()}
        </p>
      </div>

      {leaving ? (
        <p className="text-center text-sm text-muted-foreground" role="status">
          {m.oauth_consent_redirecting()}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => answer(false)}
          >
            {m.oauth_consent_deny()}
          </Button>
          <Button disabled={busy} onClick={() => answer(true)}>
            {m.oauth_consent_allow()}
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Where the API sends a user when an AI agent asks for access (OAuth): the
 * request is checked again by the API, which only redirects to URIs the
 * agent registered.
 */
export function OAuthConsentView() {
  const [searchParams] = useSearchParams();
  const request = useMemo(() => {
    const parsed = oauthAuthorizeRequestSchema.safeParse(
      Object.fromEntries(searchParams),
    );
    return parsed.success ? parsed.data : null;
  }, [searchParams]);

  // Never inside another site's frame, where a click could be stolen
  const framed = window.top !== window.self;
  return request && !framed ? <Consent request={request} /> : <Invalid />;
}
