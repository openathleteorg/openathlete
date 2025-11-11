import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import * as m from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { getStepTypeColor, getStepTypeLabel } from '@/utils/workout';
import { Edit2, MoreVertical, Trash2 } from 'lucide-react';

import type {
  WorkoutStepDto as WorkoutStep,
  WorkoutStepTarget,
} from '@openathlete/shared';

import { DurationDisplay } from './duration-display';
import { TargetBadge } from './target-badge';
import { TypeIcon } from './type-icon';

interface StepCardProps {
  step: WorkoutStep;
  index: number;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  isDragging?: boolean;
  isReadOnly?: boolean;
  variant?: 'default' | 'compact' | 'inRepeat';
  className?: string;
}

export function StepCard({
  step,
  index,
  onEdit,
  onDelete,
  onDuplicate,
  isDragging = false,
  isReadOnly = false,
  variant = 'default',
  className,
}: StepCardProps) {
  const colors = getStepTypeColor(step.stepType);
  const label = getStepTypeLabel(step.stepType);

  const hasNotes = step.notes && step.notes.trim().length > 0;
  const hasTargets = step.targets && step.targets.length > 0;

  const isCompact = variant === 'compact';
  const isInRepeat = variant === 'inRepeat';

  return (
    <div
      className={cn(
        'relative rounded-lg border bg-card transition-all',
        isDragging && 'opacity-50 shadow-lg',
        isInRepeat ? 'ml-4 border-l-4' : 'border-l-4',
        colors.border,
        className,
      )}
    >
      <div className="flex items-center gap-3 p-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
          {index}
        </div>

        <TypeIcon stepType={step.stepType} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              {label}
            </span>
            {step.name && (
              <span className="text-sm font-semibold truncate">
                {step.name}
              </span>
            )}
            {step.exerciseName && (
              <span className="text-sm font-medium text-primary truncate">
                · {step.exerciseName}
              </span>
            )}
          </div>

          {!isCompact && (
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">
                <DurationDisplay
                  durationType={step.durationType}
                  durationValue={step.durationValue}
                />
              </span>

              {hasTargets && (
                <>
                  <span className="text-xs text-muted-foreground">·</span>
                  <div className="flex gap-1 flex-wrap">
                    {step.targets.map(
                      (target: WorkoutStepTarget, idx: number) => (
                        <TargetBadge key={idx} target={target} />
                      ),
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {!isReadOnly && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  {m.workout_step_edit()}
                </DropdownMenuItem>
              )}
              {onDuplicate && (
                <DropdownMenuItem onClick={onDuplicate}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  {m.workout_step_duplicate()}
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {m.workout_step_delete()}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {!isCompact && hasNotes && (
        <div className="border-t px-3 py-2">
          <p className="text-xs text-muted-foreground whitespace-pre-wrap">
            {step.notes}
          </p>
        </div>
      )}
    </div>
  );
}
