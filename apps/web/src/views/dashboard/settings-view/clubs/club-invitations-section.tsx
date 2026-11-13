import {
  useClubInvitationsQuery,
  useInviteToClubMutation,
  useResendClubInvitationMutation,
  useRevokeClubInvitationMutation,
} from '@/api/club';
import { clubRoleLabel } from '@/components/clubs/club-role';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { m } from '@/paraglide/messages';
import { parseMemberList } from '@/utils/member-list';
import { MoreHorizontal } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { CLUB_INVITATIONS_MAX } from '@openathlete/shared';

import {
  SettingsEmpty,
  SettingsPanel,
  SettingsRow,
  SettingsSection,
} from '../settings-section';

/** Paste a list, or open the CSV a spreadsheet exports, then check it */
function ImportDialog({
  clubId,
  open,
  onClose,
}: {
  clubId: number;
  open: boolean;
  onClose: () => void;
}) {
  const invite = useInviteToClubMutation(clubId);
  const [text, setText] = useState('');
  const [role, setRole] = useState<'ATHLETE' | 'COACH'>('ATHLETE');
  useEffect(() => {
    if (open) {
      setText('');
      setRole('ATHLETE');
    }
  }, [open]);
  const parsed = useMemo(() => parseMemberList(text), [text]);
  const tooMany = parsed.people.length > CLUB_INVITATIONS_MAX;

  const readFile = async (file: File | undefined) => {
    if (file) setText(await file.text());
  };

  const send = () =>
    invite.mutate(
      { people: parsed.people, role },
      {
        onSuccess: (result) => {
          onClose();
          toast.success(
            m.club_invitations_sent({
              invited: result.invited,
              skipped: result.skipped.length,
            }),
          );
        },
        onError: () => toast.error(m.club_save_failed()),
      },
    );

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-2xl" mobileFullscreen data-club-import>
        <DialogHeader>
          <DialogTitle>{m.club_invitations_import()}</DialogTitle>
          <DialogDescription>
            {m.club_invitations_import_description()}
          </DialogDescription>
        </DialogHeader>
        <div className="flex min-h-0 flex-col gap-3 overflow-y-auto">
          <Textarea
            value={text}
            rows={6}
            className="font-mono text-xs"
            placeholder={
              'Prénom;Nom;Email;Groupe\nAna;Martin;ana@example.com;Juniors'
            }
            aria-label={m.club_invitations_list()}
            onChange={(event) => setText(event.target.value)}
          />
          <div className="flex flex-wrap items-center gap-3">
            <label className="cursor-pointer text-sm text-primary underline-offset-4 hover:underline">
              {m.club_invitations_open_file()}
              <input
                type="file"
                accept=".csv,.txt,text/csv,text/plain"
                className="sr-only"
                onChange={(event) => readFile(event.target.files?.[0])}
              />
            </label>
            <div className="ml-auto flex items-center gap-2">
              <Label className="text-sm">{m.club_invitations_as()}</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as 'ATHLETE' | 'COACH')}
              >
                <SelectTrigger
                  className="w-36"
                  aria-label={m.club_invitations_as()}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ATHLETE">
                    {clubRoleLabel('ATHLETE')}
                  </SelectItem>
                  <SelectItem value="COACH">
                    {clubRoleLabel('COACH')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {parsed.people.length > 0 && (
            <div className="space-y-2" data-club-import-preview>
              <p className="text-sm font-medium">
                {m.club_invitations_found({ count: parsed.people.length })}
              </p>
              {/* Columns on a computer, stacked lines on a phone */}
              <ul className="max-h-56 divide-y overflow-y-auto rounded-xl border text-sm">
                {parsed.people.map((person, index) => (
                  <li
                    key={`${person.email}-${index}`}
                    className="grid gap-x-4 px-3 py-1.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)]"
                  >
                    <span className="truncate">
                      {[person.firstName, person.lastName]
                        .filter(Boolean)
                        .join(' ') || '–'}
                    </span>
                    <span className="truncate text-muted-foreground">
                      {person.email}
                    </span>
                    <span className="truncate text-muted-foreground">
                      {role === 'ATHLETE' ? (person.group ?? '') : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {parsed.invalidLines.length > 0 && (
            <p role="alert" className="text-sm text-destructive">
              {m.club_invitations_invalid({
                lines: parsed.invalidLines.slice(0, 10).join(', '),
              })}
            </p>
          )}
          {tooMany && (
            <p role="alert" className="text-sm text-destructive">
              {m.club_invitations_too_many({ max: CLUB_INVITATIONS_MAX })}
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            {m.cancel()}
          </Button>
          <Button
            onClick={send}
            isLoading={invite.isPending}
            disabled={invite.isPending || parsed.people.length === 0 || tooMany}
          >
            {m.club_invitations_send({ count: parsed.people.length })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Personal invitations: import a list, then follow who has not joined */
export function ClubInvitationsSection({ clubId }: { clubId: number }) {
  const { data: invitations } = useClubInvitationsQuery(clubId, true);
  const resend = useResendClubInvitationMutation(clubId);
  const revoke = useRevokeClubInvitationMutation(clubId);
  const [importing, setImporting] = useState(false);

  return (
    <SettingsSection
      title={m.club_invitations_title()}
      description={m.club_invitations_description()}
      action={
        <Button
          size="sm"
          onClick={() => setImporting(true)}
          data-club-import-button
        >
          {m.club_invitations_import()}
        </Button>
      }
    >
      {!invitations?.length ? (
        <SettingsEmpty>{m.club_invitations_none()}</SettingsEmpty>
      ) : (
        <SettingsPanel data-club-invitations>
          {invitations.map((invitation) => (
            <SettingsRow
              key={invitation.clubInvitationId}
              title={
                [invitation.firstName, invitation.lastName]
                  .filter(Boolean)
                  .join(' ') || invitation.email
              }
              description={[
                invitation.email,
                clubRoleLabel(invitation.role),
                invitation.groupName,
                m.club_invitations_sent_on({
                  date: new Date(invitation.sentAt).toLocaleDateString(),
                }),
              ]
                .filter(Boolean)
                .join(' · ')}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="max-md:w-11"
                    aria-label={`${m.actions()} ${invitation.email}`}
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() =>
                      resend.mutate(invitation.clubInvitationId, {
                        onSuccess: () =>
                          toast.success(m.club_invitations_resent()),
                        onError: () => toast.error(m.club_save_failed()),
                      })
                    }
                  >
                    {m.club_invitations_resend()}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() =>
                      revoke.mutate(invitation.clubInvitationId, {
                        onError: () => toast.error(m.club_save_failed()),
                      })
                    }
                  >
                    {m.club_invitations_revoke()}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SettingsRow>
          ))}
        </SettingsPanel>
      )}
      <ImportDialog
        clubId={clubId}
        open={importing}
        onClose={() => setImporting(false)}
      />
    </SettingsSection>
  );
}
