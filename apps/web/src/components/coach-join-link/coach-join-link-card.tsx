import {
  useMyCoachJoinLinkQuery,
  useRotateCoachJoinLinkMutation,
} from '@/api/coach-join-link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { Copy, RefreshCw, Share2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

/** Clipboard API, then the legacy copy command for webviews without it */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const copied = document.execCommand('copy');
      area.remove();
      return copied;
    } catch {
      return false;
    }
  }
}

const canShare = () =>
  typeof navigator !== 'undefined' && typeof navigator.share === 'function';

type Props = {
  /**
   * Draws its own frame. Off inside a settings panel, which is the frame
   * already.
   */
  framed?: boolean;
  /** Shows the title and description; off when the host page has them */
  withHeader?: boolean;
  className?: string;
};

/**
 * The coach's shareable join link: one URL for a whole club group, which
 * links whoever opens it to the coach. Copy, native share, and a reset that
 * revokes the previous link after an in-place confirmation.
 */
export function CoachJoinLinkCard({
  framed = true,
  withHeader = true,
  className,
}: Props) {
  const { data: link, isLoading, isError, refetch } = useMyCoachJoinLinkQuery();
  const rotate = useRotateCoachJoinLinkMutation();
  const [confirmingReset, setConfirmingReset] = useState(false);

  const copy = async () => {
    if (!link) return;
    if (await copyToClipboard(link.url)) toast.success(m.join_link_copied());
    else toast.error(m.join_link_copy_failed());
  };

  const share = async () => {
    if (!link) return;
    try {
      await navigator.share({
        title: m.join_link_share_title(),
        text: m.join_link_share_text(),
        url: link.url,
      });
    } catch (error) {
      // Closing the share sheet is not a failure
      if (error instanceof DOMException && error.name === 'AbortError') return;
      await copy();
    }
  };

  const reset = () =>
    rotate.mutate(undefined, {
      onSuccess: () => {
        setConfirmingReset(false);
        toast.success(m.join_link_reset_done());
      },
      onError: () => toast.error(m.join_link_reset_failed()),
    });

  return (
    <div
      data-coach-join-link
      className={cn(
        'space-y-3',
        framed && 'rounded-2xl border border-border bg-card p-4',
        className,
      )}
    >
      {withHeader && (
        <div className="space-y-1">
          <h3 className="text-base font-semibold">{m.join_link_title()}</h3>
          <p className="text-sm text-muted-foreground">
            {m.join_link_description()}
          </p>
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-11 w-full rounded-md" />
      ) : isError || !link ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p role="alert" className="text-sm text-destructive">
            {m.join_link_load_failed()}
          </p>
          <Button variant="outline" className="h-11" onClick={() => refetch()}>
            {m.join_link_retry()}
          </Button>
        </div>
      ) : (
        <>
          <div
            className="min-w-0 rounded-md bg-muted px-3 py-2.5 font-mono text-sm break-all text-muted-foreground select-all"
            data-coach-join-link-url
          >
            {link.url}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="h-11 sm:flex-1" onClick={copy}>
              <Copy className="size-4" />
              {m.join_link_copy()}
            </Button>
            {canShare() && (
              <Button
                variant="outline"
                className="h-11 sm:flex-1"
                onClick={share}
              >
                <Share2 className="size-4" />
                {m.join_link_share()}
              </Button>
            )}
          </div>

          {confirmingReset ? (
            <div
              role="alertdialog"
              aria-labelledby="coach-join-link-reset"
              className="space-y-3 rounded-md bg-muted p-3"
            >
              <p id="coach-join-link-reset" className="text-sm">
                {m.join_link_reset_confirm()}
              </p>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  className="h-11"
                  onClick={() => setConfirmingReset(false)}
                  disabled={rotate.isPending}
                >
                  {m.cancel()}
                </Button>
                <Button
                  variant="destructive"
                  className="h-11"
                  onClick={reset}
                  isLoading={rotate.isPending}
                  disabled={rotate.isPending}
                >
                  {m.join_link_reset_confirm_action()}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                className="h-11"
                onClick={() => setConfirmingReset(true)}
              >
                <RefreshCw className="size-4" />
                {m.join_link_reset()}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
