import {
  useAthleteGroupsQuery,
  useClubJoinLinksQuery,
  useRotateClubJoinLinkMutation,
  useUpdateClubJoinLinksMutation,
} from '@/api/club';
import { ConfirmAction } from '@/components/confirm-action';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { m } from '@/paraglide/messages';
import { copyToClipboard } from '@/utils/clipboard';
import { format } from 'date-fns';
import { Copy, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { ClubJoinLinkKind } from '@openathlete/shared';

import { SettingsPanel, SettingsSection } from '../settings-section';

/** A date input's value: the expiry day, the link working until its end */
const toDay = (date: Date | string | null) =>
  date ? format(new Date(new Date(date).getTime() - 1), 'yyyy-MM-dd') : '';
const endOfDay = (day: string) =>
  day ? new Date(`${day}T23:59:59.999`) : null;

/**
 * The club's two links, one for athletes (with a short code to type) and
 * one for coaches, with when they expire and where athletes land. Admins
 * only.
 */
export function ClubJoinLinksSection({ clubId }: { clubId: number }) {
  const {
    data: links,
    isLoading,
    isError,
  } = useClubJoinLinksQuery(clubId, true);
  const { data: groups } = useAthleteGroupsQuery(clubId);
  const rotate = useRotateClubJoinLinkMutation(clubId);
  const update = useUpdateClubJoinLinksMutation(clubId);
  const [resetting, setResetting] = useState<ClubJoinLinkKind | null>(null);

  const copy = async (text: string) => {
    if (await copyToClipboard(text)) toast.success(m.join_link_copied());
    else toast.error(m.join_link_copy_failed());
  };
  const save = (body: Parameters<typeof update.mutate>[0]) =>
    update.mutate(body, {
      onSuccess: () => toast.success(m.club_links_saved()),
      onError: () => toast.error(m.club_save_failed()),
    });

  const kinds: { kind: ClubJoinLinkKind; title: string; text: string }[] = [
    {
      kind: 'athlete',
      title: m.club_link_athletes_title(),
      text: m.club_link_athletes_description(),
    },
    {
      kind: 'staff',
      title: m.club_link_staff_title(),
      text: m.club_link_staff_description(),
    },
  ];

  return (
    <SettingsSection
      title={m.club_links_title()}
      description={m.club_links_description()}
    >
      <SettingsPanel>
        {kinds.map(({ kind, title, text }) => {
          const link = links?.[kind];
          return (
            <div
              key={kind}
              className="space-y-3 p-4"
              data-club-join-link={kind}
            >
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{title}</p>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
              {isLoading ? (
                <Skeleton className="h-11 w-full rounded-md" />
              ) : isError || !links || !link ? (
                <p role="alert" className="text-sm text-destructive">
                  {m.join_link_load_failed()}
                </p>
              ) : (
                <>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div
                      className="min-w-0 flex-1 rounded-md bg-muted px-3 py-2.5 font-mono text-sm break-all text-muted-foreground select-all"
                      data-club-join-link-url
                    >
                      {link.url}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="max-sm:flex-1"
                        onClick={() => copy(link.url)}
                      >
                        <Copy className="size-4" />
                        {m.copy()}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="max-md:w-11"
                        aria-label={m.join_link_reset()}
                        onClick={() => setResetting(kind)}
                      >
                        <RefreshCw className="size-4" />
                      </Button>
                    </div>
                  </div>
                  {kind === 'athlete' && (
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="text-muted-foreground">
                        {m.club_join_code_label()}
                      </span>
                      <button
                        type="button"
                        className="rounded-md bg-muted px-2 py-1 font-mono text-base tracking-widest"
                        onClick={() => copy(links.athlete.code)}
                        data-club-join-code
                      >
                        {links.athlete.code}
                      </button>
                    </div>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="grid gap-1.5">
                      <Label htmlFor={`club-link-expiry-${kind}`}>
                        {m.club_link_expires()}
                      </Label>
                      <Input
                        id={`club-link-expiry-${kind}`}
                        type="date"
                        value={toDay(link.expiresAt)}
                        onChange={(event) =>
                          save(
                            kind === 'athlete'
                              ? {
                                  athleteExpiresAt: endOfDay(
                                    event.target.value,
                                  ),
                                }
                              : {
                                  staffExpiresAt: endOfDay(event.target.value),
                                },
                          )
                        }
                      />
                    </div>
                    {kind === 'athlete' && (
                      <div className="grid gap-1.5">
                        <Label>{m.club_link_arrival_group()}</Label>
                        <Select
                          value={String(links.athlete.groupId ?? 'none')}
                          onValueChange={(value) =>
                            save({
                              athleteGroupId:
                                value === 'none' ? null : Number(value),
                            })
                          }
                        >
                          <SelectTrigger
                            aria-label={m.club_link_arrival_group()}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">
                              {m.club_link_no_group()}
                            </SelectItem>
                            {(groups ?? []).map((group) => (
                              <SelectItem
                                key={group.athleteGroupId}
                                value={String(group.athleteGroupId)}
                              >
                                {group.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </SettingsPanel>
      <ConfirmAction
        open={resetting !== null}
        onClose={() => setResetting(null)}
        title={m.join_link_reset()}
        message={m.join_link_reset_confirm()}
        confirmText={m.join_link_reset_confirm_action()}
        isLoading={rotate.isPending}
        onConfirm={() =>
          resetting &&
          rotate.mutate(resetting, {
            onSuccess: () => {
              setResetting(null);
              toast.success(m.join_link_reset_done());
            },
            onError: () => toast.error(m.join_link_reset_failed()),
          })
        }
      />
    </SettingsSection>
  );
}
