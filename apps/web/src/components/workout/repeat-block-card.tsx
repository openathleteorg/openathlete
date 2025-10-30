import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/utils/shadcn';
import { calculateWorkoutDuration, formatDuration } from '@/utils/workout';
import { Edit2, MoreVertical, Repeat, Trash2 } from 'lucide-react';

import type {
  WorkoutDto,
  WorkoutRepeat,
  WorkoutStepDto,
} from '@openathlete/shared';

import { StepCard } from './step-card';

interface RepeatBlockCardProps {
  repeatBlock: WorkoutRepeat;
  baseIndex: number;
  onEdit?: () => void;
  onDelete?: () => void;
  onEditStep?: (stepId: number) => void;
  onDeleteStep?: (stepId: number) => void;
  isReadOnly?: boolean;
  className?: string;
}

/**
 * Card component that displays a repeat block with its child steps
 * Shows repeat count, exercise name, child steps, and calculated total duration
 */
export function RepeatBlockCard({
  repeatBlock,
  baseIndex,
  onEdit,
  onDelete,
  onEditStep,
  onDeleteStep,
  isReadOnly = false,
  className,
}: RepeatBlockCardProps) {
  const childSteps = repeatBlock.childSteps || [];
  const hasSteps = childSteps.length > 0;

  // Calculate total duration for one iteration
  const mockWorkout: WorkoutDto = {
    eventTrainingId: 0,
    steps: childSteps as WorkoutStepDto[],
  } as WorkoutDto;

  const singleIterationDuration = calculateWorkoutDuration(mockWorkout);
  const totalDuration = singleIterationDuration
    ? singleIterationDuration * repeatBlock.repetitions
    : null;

  return (
    <div
      className={cn(
        'relative rounded-lg border-2 border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-violet-200 dark:border-violet-800 bg-violet-100/50 dark:bg-violet-950/30 p-3 rounded-t-lg">
        {/* Icon */}
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-200 dark:bg-violet-900">
          <Repeat className="h-5 w-5 text-violet-700 dark:text-violet-300" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-violet-900 dark:text-violet-100">
              Repeat {repeatBlock.repetitions}×
            </span>
          </div>

          {totalDuration !== null && (
            <div className="mt-1 text-xs text-violet-600 dark:text-violet-400">
              {formatDuration('TIME', singleIterationDuration!)} per iteration ·{' '}
              {formatDuration('TIME', totalDuration)} total
            </div>
          )}
        </div>

        {/* Actions */}
        {!isReadOnly && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-violet-700 dark:text-violet-300 hover:text-violet-900 dark:hover:text-violet-100"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Child Steps */}
      <div className="p-3 space-y-2">
        {hasSteps ? (
          childSteps.map((step: WorkoutStepDto, idx: number) => (
            <StepCard
              key={step.workoutStepId || idx}
              step={step}
              index={baseIndex + idx + 1}
              onEdit={
                onEditStep ? () => onEditStep(step.workoutStepId!) : undefined
              }
              onDelete={
                onDeleteStep
                  ? () => onDeleteStep(step.workoutStepId!)
                  : undefined
              }
              isReadOnly={isReadOnly}
              variant="inRepeat"
            />
          ))
        ) : (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No steps in this repeat block
          </div>
        )}
      </div>
    </div>
  );
}
