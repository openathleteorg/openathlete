import { m } from '@/paraglide/messages';
import { useDeleteCycleMutation } from '@/services/cycle';
import { format } from 'date-fns';
import { Calendar, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Cycle } from '@openathlete/shared';

import { ConfirmAction } from '../confirm-action';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Separator } from '../ui/separator';

interface P {
  open: boolean;
  onClose: () => void;
  cycle?: Cycle;
  onEditCycle: (cycleId: Cycle['cycleId']) => void;
}

export function CycleDetailsDialog({ open, onClose, cycle, onEditCycle }: P) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const deleteCycleMutation = useDeleteCycleMutation({
    onSuccess: () => {
      toast.success(m.cycle_deleted_successfully());
      setDeleteDialogOpen(false);
      onClose();
    },
    onError: () => {
      toast.error(m.failed_to_delete_cycle());
    },
  });

  if (!cycle) return null;

  const startDate = new Date(cycle.startDate);
  const endDate = new Date(cycle.endDate);
  const duration =
    Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    ) + 1;

  return (
    <Dialog onOpenChange={(o) => !o && onClose()} open={open}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: cycle.color || '#3b82f6' }}
              />
              <span className="text-xl font-semibold">{cycle.name}</span>
            </div>
            <div className="flex items-center gap-2 pr-4 -translate-y-4">
              <Button
                onClick={() => onEditCycle(cycle.cycleId)}
                variant="outline"
                size="sm"
              >
                {m.edit()}
              </Button>
              <Button
                onClick={() => setDeleteDialogOpen(true)}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-500" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {format(startDate, 'MMM d, yyyy')} -{' '}
                {format(endDate, 'MMM d, yyyy')}
              </span>
              <span className="text-xs text-gray-500">
                {duration} {duration === 1 ? m.day() : m.days()}
              </span>
            </div>
          </div>

          <Separator />

          {/* Description */}
          {cycle.description && (
            <>
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {m.description()}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {cycle.description}
                </p>
              </div>
            </>
          )}

          {!cycle.description && (
            <div className="text-sm text-gray-400 italic">
              {m.no_description_provided()}
            </div>
          )}
        </div>
      </DialogContent>

      <ConfirmAction
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={() => {
          deleteCycleMutation.mutate(cycle.cycleId);
          setDeleteDialogOpen(false);
        }}
        title={m.delete_cycle()}
        message={m.confirm_delete_cycle({ cycleName: cycle.name })}
        isLoading={deleteCycleMutation.isPending}
      />
    </Dialog>
  );
}
