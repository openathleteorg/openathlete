import { m } from '@/paraglide/messages';

import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

export type SeriesScope = 'single' | 'following';

/**
 * Asks whether a change to a repeated session applies to this occurrence or
 * to the following ones too.
 */
export function SeriesScopeDialog({
  open,
  action,
  onChoose,
  onCancel,
  isLoading = false,
}: {
  open: boolean;
  action: 'edit' | 'delete';
  onChoose: (scope: SeriesScope) => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  const destructive = action === 'delete';
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="sm:max-w-md" data-series-scope>
        <DialogHeader>
          <DialogTitle>{m.series_scope_title()}</DialogTitle>
          <DialogDescription>
            {destructive
              ? m.series_scope_delete_description()
              : m.series_scope_edit_description()}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Button
            variant="outline"
            className="justify-start"
            disabled={isLoading}
            onClick={() => onChoose('single')}
          >
            {m.series_scope_single()}
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'outline'}
            className="justify-start"
            disabled={isLoading}
            onClick={() => onChoose('following')}
          >
            {m.series_scope_following()}
          </Button>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
            {m.cancel()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
