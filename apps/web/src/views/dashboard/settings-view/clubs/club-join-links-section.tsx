import {
  useClubJoinLinksQuery,
  useRotateClubJoinLinkMutation,
} from '@/api/club';
import { ConfirmAction } from '@/components/confirm-action';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { m } from '@/paraglide/messages';
import { copyToClipboard } from '@/utils/clipboard';
import { Copy, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { ClubJoinLinkKind } from '@openathlete/shared';

import { SettingsPanel, SettingsSection } from '../settings-section';

/** The club's two links: one for athletes, one for coaches. Admins only. */
export function ClubJoinLinksSection({ clubId }: { clubId: number }) {
  const {
    data: links,
    isLoading,
    isError,
  } = useClubJoinLinksQuery(clubId, true);
  const rotate = useRotateClubJoinLinkMutation(clubId);
  const [resetting, setResetting] = useState<ClubJoinLinkKind | null>(null);

  const copy = async (url: string) => {
    if (await copyToClipboard(url)) toast.success(m.join_link_copied());
    else toast.error(m.join_link_copy_failed());
  };

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
        {kinds.map(({ kind, title, text }) => (
          <div key={kind} className="space-y-3 p-4" data-club-join-link={kind}>
            <div className="space-y-0.5">
              <p className="text-sm font-medium">{title}</p>
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
            {isLoading ? (
              <Skeleton className="h-11 w-full rounded-md" />
            ) : isError || !links ? (
              <p role="alert" className="text-sm text-destructive">
                {m.join_link_load_failed()}
              </p>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div
                  className="min-w-0 flex-1 rounded-md bg-muted px-3 py-2.5 font-mono text-sm break-all text-muted-foreground select-all"
                  data-club-join-link-url
                >
                  {links[kind].url}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="max-sm:flex-1"
                    onClick={() => copy(links[kind].url)}
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
            )}
          </div>
        ))}
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
