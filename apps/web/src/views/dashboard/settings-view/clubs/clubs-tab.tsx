import { ClubAPI, useCreateClubMutation, useMyClubsQuery } from '@/api/club';
import { clubRoleLabel } from '@/components/clubs/club-role';
import { NameDialog } from '@/components/clubs/name-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { m } from '@/paraglide/messages';
import { clubJoinPath, clubPath } from '@/routes/paths';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { CLUB_NAME_MAX } from '@openathlete/shared';

import {
  SettingsEmpty,
  SettingsPanel,
  SettingsRow,
  SettingsRowsSkeleton,
  SettingsSection,
} from '../settings-section';
import { ClubDetail } from './club-detail';

/** The clubs the user belongs to, one club at a time with ?club=. */
export function ClubsTab() {
  const [searchParams] = useSearchParams();
  const clubParam = Number.parseInt(searchParams.get('club') ?? '', 10);
  const navigate = useNavigate();
  const { data: clubs, isPending } = useMyClubsQuery();
  const create = useCreateClubMutation();
  const [creating, setCreating] = useState(false);
  const [code, setCode] = useState('');
  const [resolving, setResolving] = useState(false);
  // The code stands for the club's athlete link: its page shows who will
  // see the training before anything is shared
  const joinWithCode = async () => {
    setResolving(true);
    try {
      const { token } = await ClubAPI.resolveCode(code.trim());
      navigate(clubJoinPath(token));
    } catch {
      toast.error(m.club_join_code_unknown());
    } finally {
      setResolving(false);
    }
  };

  if (Number.isInteger(clubParam) && clubParam > 0) {
    return <ClubDetail key={clubParam} clubId={clubParam} />;
  }

  return (
    <div className="space-y-8">
      <SettingsSection
        action={
          <Button size="sm" onClick={() => setCreating(true)}>
            {m.club_create()}
          </Button>
        }
      >
        {isPending ? (
          <SettingsRowsSkeleton />
        ) : !clubs?.length ? (
          <SettingsEmpty>{m.club_none_yet()}</SettingsEmpty>
        ) : (
          <SettingsPanel>
            {clubs.map((club) => (
              <Link
                key={club.clubId}
                to={clubPath(club.clubId)}
                className="block transition-colors hover:bg-accent/60"
                data-club-row={club.name}
              >
                <SettingsRow
                  title={club.name}
                  description={
                    club.memberCount !== null
                      ? `${clubRoleLabel(club.role)} · ${m.club_member_count({ count: club.memberCount })}`
                      : clubRoleLabel(club.role)
                  }
                >
                  <ChevronRight className="size-4 text-muted-foreground" />
                </SettingsRow>
              </Link>
            ))}
          </SettingsPanel>
        )}
      </SettingsSection>
      <SettingsSection
        title={m.club_join_with_code()}
        description={m.club_join_with_code_description()}
      >
        <SettingsPanel padded>
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              joinWithCode();
            }}
          >
            <Input
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              maxLength={8}
              autoCapitalize="characters"
              className="font-mono tracking-widest sm:max-w-48"
              placeholder="ABCD2345"
              aria-label={m.club_join_code_label()}
              data-club-code-input
            />
            <Button
              type="submit"
              variant="outline"
              disabled={code.trim().length !== 8 || resolving}
              isLoading={resolving}
            >
              {m.club_join_with_code_action()}
            </Button>
          </form>
        </SettingsPanel>
      </SettingsSection>
      <NameDialog
        open={creating}
        onClose={() => setCreating(false)}
        title={m.club_create()}
        description={m.club_create_description()}
        label={m.club_name()}
        submitLabel={m.create()}
        maxLength={CLUB_NAME_MAX}
        isLoading={create.isPending}
        onSubmit={(name) =>
          create.mutate(
            { name },
            {
              onSuccess: (club) => {
                setCreating(false);
                toast.success(m.club_created({ club: club.name }));
                navigate(clubPath(club.clubId));
              },
              onError: () => toast.error(m.club_save_failed()),
            },
          )
        }
      />
    </div>
  );
}
