import {
  useAcceptCoachJoinLinkMutation,
  useCoachJoinLinkInfoQuery,
} from '@/api/coach-join-link';
import { LoadingScreen } from '@/components/loading-screen';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/auth';
import {
  coachJoinErrorMessage,
  toastCoachJoined,
} from '@/hooks/use-pending-coach-join';
import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import { rememberCoachJoinToken } from '@/utils/coach-join';
import { isAxiosError } from 'axios';
import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { coachJoinTokenSchema } from '@openathlete/shared';

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 pt-[calc(var(--safe-top)+4rem)] pb-[calc(var(--safe-bottom)+4rem)]">
      <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
        {children}
      </div>
    </section>
  );
}

function InvalidLink() {
  return (
    <Shell>
      <div className="space-y-3" data-coach-join-invalid>
        <h1 className="text-2xl font-semibold tracking-tight">
          {m.join_link_invalid_title()}
        </h1>
        <p className="text-base text-muted-foreground">
          {m.join_link_invalid_description()}
        </p>
      </div>
      <Button asChild variant="outline" className="h-11">
        <Link to="/">{m.join_link_open_app()}</Link>
      </Button>
    </Shell>
  );
}

/**
 * Signed in: the coach will see the athlete's data, so joining takes a tap,
 * never just opening a link
 */
function ConfirmJoin({ token }: { token: string }) {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useCoachJoinLinkInfoQuery(token);
  const accept = useAcceptCoachJoinLinkMutation();

  if (isLoading) return <LoadingScreen />;
  if (
    isError ||
    !data ||
    (isAxiosError(accept.error) && accept.error.response?.status === 404)
  ) {
    return <InvalidLink />;
  }

  const join = () =>
    accept.mutate(token, {
      onSuccess: (result) => {
        toastCoachJoined(result);
        navigate(getPath(['dashboard']), { replace: true });
      },
      onError: (error) => {
        if (isAxiosError(error) && error.response?.status === 404) return;
        toast.error(
          coachJoinErrorMessage(error) ?? m.join_link_accept_failed(),
        );
      },
    });

  return (
    <Shell>
      <div className="space-y-3" data-coach-join-confirm>
        <h1 className="text-2xl font-semibold tracking-tight">
          {m.join_link_page_title({ coach: data.coachName })}
        </h1>
        <p className="text-base text-muted-foreground">
          {m.join_link_confirm_description({ coach: data.coachName })}
        </p>
      </div>
      <div className="flex w-full flex-col gap-2">
        <Button
          className="h-11 w-full"
          onClick={join}
          isLoading={accept.isPending}
          disabled={accept.isPending}
        >
          {m.join_link_accept({ coach: data.coachName })}
        </Button>
        <Button asChild variant="ghost" className="h-11 w-full">
          <Link to={getPath(['dashboard'])}>{m.join_link_decline()}</Link>
        </Button>
      </div>
    </Shell>
  );
}

/** Signed out: who invites, and the way to an account */
function Invitation({ token }: { token: string }) {
  const { data, isLoading, isError } = useCoachJoinLinkInfoQuery(token);

  // Kept through sign-up or login, then spent by the dashboard
  useEffect(() => {
    if (data) rememberCoachJoinToken(token);
  }, [data, token]);

  if (isLoading) return <LoadingScreen />;
  if (isError || !data) return <InvalidLink />;

  return (
    <Shell>
      <div className="space-y-3" data-coach-join-invitation>
        <h1 className="text-2xl font-semibold tracking-tight">
          {m.join_link_page_title({ coach: data.coachName })}
        </h1>
        <p className="text-base text-muted-foreground">
          {m.join_link_page_description()}
        </p>
      </div>
      <div className="flex w-full flex-col gap-2">
        <Button asChild className="h-11 w-full">
          <Link to={getPath(['auth', 'createAccount'])}>
            {m.join_link_create_account()}
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-11 w-full">
          <Link to={getPath(['auth', 'login'])}>{m.join_link_log_in()}</Link>
        </Button>
      </div>
    </Shell>
  );
}

/** Where a coach's join link leads, signed in or not. */
export function CoachJoinView() {
  const { token } = useParams<{ token: string }>();
  const { authenticated, loading } = useAuthContext();

  if (!token || !coachJoinTokenSchema.safeParse(token).success) {
    return <InvalidLink />;
  }
  if (loading) return <LoadingScreen />;
  return authenticated ? (
    <ConfirmJoin token={token} />
  ) : (
    <Invitation token={token} />
  );
}
