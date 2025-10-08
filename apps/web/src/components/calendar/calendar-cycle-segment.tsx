import { m } from '@/paraglide/messages';
import { useDeleteCycleMutation } from '@/services/cycle';
import { cn } from '@/utils/shadcn';
import { Edit2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { ConfirmAction } from '../confirm-action';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '../ui/context-menu';
import { useCalendarContext } from './hooks/use-calendar-context';
import { CycleDaySegment } from './utils/cycle-day-layout';

interface P {
  segment: CycleDaySegment;
}

export function CalendarCycleSegment({ segment }: P) {
  const { cycleResize, setCycleResize, viewCycle, editCycle } =
    useCalendarContext();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const deleteCycleMutation = useDeleteCycleMutation({
    onSuccess: () => {
      toast.success(m.cycle_deleted_successfully());
      setDeleteDialogOpen(false);
    },
    onError: () => {
      toast.error(m.failed_to_delete_cycle());
    },
  });

  // Determine border radius and margins based on position in cycle
  let roundedClass = '';
  let leftOffset = '0px';
  let rightOffset = '0px';

  if (segment.isStart && segment.isEnd) {
    // Single day cycle - has margins on both sides
    roundedClass = 'rounded-md';
    leftOffset = '4px';
    rightOffset = '4px';
  } else if (segment.isStart) {
    // First day - rounded left, margin left only
    roundedClass = 'rounded-l-md';
    leftOffset = '4px';
  } else if (segment.isEnd) {
    // Last day - rounded right, margin right only
    roundedClass = 'rounded-r-md';
    rightOffset = '4px';
  }
  // Middle days: no rounded corners, no margins (spans full width)

  // Calculate vertical positioning based on row index
  const topOffset = segment.rowIndex * 22; // 20px height + 2px gap

  const handleStartResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    const originalStart = new Date(segment.cycle.startDate);
    const originalEnd = new Date(segment.cycle.endDate);
    setCycleResize({
      cycleId: segment.cycle.cycleId,
      edge: 'start',
      originalStart,
      originalEnd,
      currentStart: originalStart,
      currentEnd: originalEnd,
    });
  };

  const handleEndResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    const originalStart = new Date(segment.cycle.startDate);
    const originalEnd = new Date(segment.cycle.endDate);
    setCycleResize({
      cycleId: segment.cycle.cycleId,
      edge: 'end',
      originalStart,
      originalEnd,
      currentStart: originalStart,
      currentEnd: originalEnd,
    });
  };

  const isResizing = cycleResize?.cycleId === segment.cycle.cycleId;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          data-cycle-segment="true"
          className={cn(
            'absolute h-5 text-xs font-semibold text-white flex items-center px-1.5 overflow-hidden cursor-pointer select-none group',
            'hover:brightness-110 transition-all',
            roundedClass,
          )}
          style={{
            backgroundColor: segment.cycle.color || '#3b82f6',
            top: `${topOffset}px`,
            left: leftOffset,
            right: rightOffset,
          }}
          title={`${segment.cycle.name}${segment.cycle.description ? `\n${segment.cycle.description}` : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            viewCycle(segment.cycle.cycleId);
          }}
        >
          {/* Left resize handle */}
          {segment.isStart && (
            <div
              className={cn(
                'absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-10',
                'hover:bg-white/30 transition-colors',
                isResizing && cycleResize.edge === 'start' ? 'bg-white/30' : '',
              )}
              onMouseDown={handleStartResize}
              onClick={(e) => e.stopPropagation()}
            />
          )}

          {/* Cycle name */}
          {segment.isStart && (
            <span className="truncate pointer-events-none">
              {segment.cycle.name}
            </span>
          )}

          {/* Right resize handle */}
          {segment.isEnd && (
            <div
              className={cn(
                'absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize z-10',
                'hover:bg-white/30 transition-colors',
                isResizing && cycleResize.edge === 'end' ? 'bg-white/30' : '',
              )}
              onMouseDown={handleEndResize}
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onClick={(e) => {
            e.stopPropagation();
            editCycle(segment.cycle.cycleId);
          }}
        >
          <Edit2 className="w-4 h-4 mr-2" />
          {m.edit()}
        </ContextMenuItem>
        <ContextMenuItem
          onClick={(e) => {
            e.stopPropagation();
            setDeleteDialogOpen(true);
          }}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {m.delete_()}
        </ContextMenuItem>
      </ContextMenuContent>

      <ConfirmAction
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={() => {
          deleteCycleMutation.mutate(segment.cycle.cycleId);
        }}
        title={m.delete_cycle()}
        message={m.confirm_delete_cycle({ cycleName: segment.cycle.name })}
        isLoading={deleteCycleMutation.isPending}
      />
    </ContextMenu>
  );
}
