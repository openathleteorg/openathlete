import { useAcceptClubJoinMutation, useClubJoinInfoQuery } from '@/api/club';
import { clubRoleLabel } from '@/components/clubs/club-role';
import { LoadingScreen } from '@/components/loading-screen';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/auth';
import {
  clubJoinErrorMessage,
  toastClubJoined,
} from '@/hooks/use-pending-club-join';
import { m } from '@/paraglide/messages';
import { clubPath, getPath } from '@/routes/paths';
import { rememberClubJoinToken } from '@/utils/club-join';
import { isAxiosError } from 'axios';
import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import {
  ClubJoinLinkInfoDto,
  clubJoinTokenParamsSchema,
} from '@openathlete/shared';

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
      <div className="space-y-3" data-club-join-invalid>
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

/** What joining means: the staff who will see an athlete's training */
function Summary({ info }: { info: ClubJoinLinkInfoDto }) {
  const asAthlete = info.role === 'ATHLETE';
  return (
    <div className="w-full space-y-4">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          {m.club_join_title({ club: info.clubName })}
        </h1>
        <p className="text-base text-muted-foreground">
          {asAthlete
            ? m.club_join_athlete_description()
            : m.club_join_staff_description()}
        </p>
      </div>
      {asAthlete && info.staff.length > 0 && (
        <ul className="divide-y rounded-2xl border bg-card text-left">
          {info.staff.map((person, index) => (
            <li
              key={`${person.name}-${index}`}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <span className="font-medium">{person.name}</span>
              <span className="text-muted-foreground">
                {clubRoleLabel(person.role)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Signed in: joining shares training with the staff, so it takes a tap */
function ConfirmJoin({ token }: { token: string }) {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useClubJoinInfoQuery(token);
  const accept = useAcceptClubJoinMutation();

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
        toastClubJoined(result);
        navigate(clubPath(result.clubId), { replace: true });
      },
      onError: (error) => {
        if (isAxiosError(error) && error.response?.status === 404) return;
        toast.error(clubJoinErrorMessage(error) ?? m.club_join_failed());
      },
    });

  return (
    <Shell>
      <div data-club-join-confirm className="w-full">
        <Summary info={data} />
      </div>
      <div className="flex w-full flex-col gap-2">
        <Button
          className="h-11 w-full"
          onClick={join}
          isLoading={accept.isPending}
          disabled={accept.isPending}
        >
          {m.club_join_accept({ club: data.clubName })}
        </Button>
        <Button asChild variant="ghost" className="h-11 w-full">
          <Link to={getPath(['dashboard'])}>{m.join_link_decline()}</Link>
        </Button>
      </div>
    </Shell>
  );
}

/** Signed out: the club, its staff, and the way to an account */
function Invitation({ token }: { token: string }) {
  const { data, isLoading, isError } = useClubJoinInfoQuery(token);

  // Kept through sign-up or login, then spent by the dashboard
  useEffect(() => {
    if (data) rememberClubJoinToken(token);
  }, [data, token]);

  if (isLoading) return <LoadingScreen />;
  if (isError || !data) return <InvalidLink />;

  return (
    <Shell>
      <div data-club-join-invitation className="w-full">
        <Summary info={data} />
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

/** Where a club's join link leads, signed in or not. */
export function ClubJoinView() {
  const { token } = useParams<{ token: string }>();
  const { authenticated, loading } = useAuthContext();

  if (!token || !clubJoinTokenParamsSchema.safeParse({ token }).success) {
    return <InvalidLink />;
  }
  if (loading) return <LoadingScreen />;
  return authenticated ? (
    <ConfirmJoin token={token} />
  ) : (
    <Invitation token={token} />
  );
}
