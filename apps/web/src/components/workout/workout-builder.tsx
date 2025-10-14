import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import * as m from '@/paraglide/messages';
import { Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

// import {
//   useUpdateEventMutation,
// } from '@/services/event';

import {
  SPORT_TYPE,
  // type CreateanyDto,
  // type UpdateanyDto,
  // type anyEntity,
  // type anyEntity,
} from '@openathlete/shared';

import { StepForm } from './step-form';
import { StepList } from './step-list';
import { WorkoutForm } from './workout-form';

interface anyBuilderProps {
  /**
   * ID of the training event this workout belongs to
   */
  trainingId: number;

  /**
   * Existing workout to edit (if any)
   */
  workout?: any | null;

  /**
   * any metadata from parent (training event)
   * If provided, anyForm is hidden and metadata is inherited
   */
  workoutMetadata?: {
    name: string;
    description?: string | null;
    sport: SPORT_TYPE;
  };

  /**
   * Loading state for initial data fetch
   */
  isLoading?: boolean;

  /**
   * Callback when workout is successfully created or updated
   */
  onSuccess?: (workout: any) => void;

  /**
   * Callback when user cancels
   */
  onCancel?: () => void;

  /**
   * Hide the metadata form (name, sport, description)
   * Used when metadata comes from parent training
   */
  hideMetadataForm?: boolean;

  /**
   * Hide action buttons (Save/Cancel)
   * Used when workout is managed by parent form
   */
  hideActions?: boolean;

  /**
   * Callback to expose workout steps to parent
   * Used in controlled mode when hideActions is true
   */
  onStepsChange?: (steps: any[]) => void;
}

type DialogState = { type: 'none' } | { type: 'step'; editing?: any };

/**
 * anyBuilder - Main container for workout creation/editing
 *
 * Orchestrates all workout forms and manages global state.
 * Handles creation, editing, and deletion of steps and repeat blocks.
 */
export function WorkoutBuilder({
  trainingId: _trainingId,
  workout,
  workoutMetadata,
  isLoading = false,
  onSuccess,
  onCancel,
  hideMetadataForm = false,
  hideActions = false,
  onStepsChange,
}: anyBuilderProps) {
  // Local state for workout metadata
  // Use provided metadata or workout data or defaults
  const [workoutData, setanyData] = useState<{
    name: string;
    description: string | null;
    sport: SPORT_TYPE;
  }>({
    name: workoutMetadata?.name || workout?.name || '',
    description: workoutMetadata?.description || workout?.description || null,
    sport: workoutMetadata?.sport || workout?.sport || SPORT_TYPE.RUNNING,
  });

  // Local state for steps
  const [steps, setSteps] = useState<any[]>(workout?.steps || []);

  // Dialog state management
  const [dialogState, setDialogState] = useState<DialogState>({ type: 'none' });

  // Counter for generating unique temporary IDs
  const [idCounter, setIdCounter] = useState<number>(0);

  // Generate unique temporary ID
  const generateTempId = () => {
    const newId = -(Date.now() + idCounter); // Negative to distinguish from real DB IDs
    setIdCounter((prev) => prev + 1);
    return newId;
  };

  // Helper function to prepare steps for saving (clean IDs and metadata)
  const prepareStepsForSave = useCallback((stepsToClean: any[]) => {
    return stepsToClean.map((step, index) => {
      // Clean a single step by removing DB-specific fields
      const cleanedStep: any = {
        orderIndex: index,
        stepType: step.stepType,
        name: step.name || null,
        exerciseName: step.exerciseName || null,
        notes: step.notes || null,
        durationType: step.durationType,
        durationValue: step.durationValue ?? null,
        durationTarget: step.durationTarget ?? null,
        repeatParentId: step.repeatParentId ?? null,
        targets:
          step.targets?.map((t: any['targets'][0]) => ({
            targetType: t.targetType,
            targetZone: t.targetZone ?? null,
            targetMin: t.targetMin ?? null,
            targetMax: t.targetMax ?? null,
            targetValue: t.targetValue ?? null,
            unit: t.unit ?? null,
          })) || [],
      };

      // Handle repeat block if present
      if (step.repeatBlock) {
        cleanedStep.repeatBlock = {
          repetitions: step.repeatBlock.repetitions,
          childSteps: step.repeatBlock.childSteps.map(
            (child: any, childIndex: number) => ({
              orderIndex: childIndex,
              stepType: child.stepType,
              name: child.name || null,
              exerciseName: child.exerciseName || null,
              notes: child.notes || null,
              durationType: child.durationType,
              durationValue: child.durationValue ?? null,
              durationTarget: child.durationTarget ?? null,
              repeatParentId: child.repeatParentId ?? null,
              targets:
                child.targets?.map((t: any['targets'][0]) => ({
                  targetType: t.targetType,
                  targetZone: t.targetZone ?? null,
                  targetMin: t.targetMin ?? null,
                  targetMax: t.targetMax ?? null,
                  targetValue: t.targetValue ?? null,
                  unit: t.unit ?? null,
                })) || [],
            }),
          ),
        };
      }

      return cleanedStep;
    });
  }, []);

  // Notify parent when steps change (controlled mode)
  useEffect(() => {
    if (onStepsChange) {
      const cleanedSteps = prepareStepsForSave(steps);
      console.log(
        '[anyBuilder] Steps changed, notifying parent:',
        cleanedSteps,
      );
      onStepsChange(cleanedSteps);
    }
  }, [steps, onStepsChange, prepareStepsForSave]);

  // Mutations (temporarily disabled for new system)
  // const createanyMutation = useCreateanyMutation({
  //   onSuccess: (data) => {
  //     onSuccess?.(data);
  //   },
  // });

  // const updateanyMutation = useUpdateanyMutation({
  //   onSuccess: (data) => {
  //     onSuccess?.(data);
  //   },
  // });

  const isSaving = false; // createanyMutation.isPending || updateanyMutation.isPending;

  // === Handlers ===

  const handleanyMetadataChange = (data: {
    name: string;
    description?: string | null;
    sport: SPORT_TYPE;
  }) => {
    setanyData({
      name: data.name,
      description: data.description || null,
      sport: data.sport,
    });
  };

  const handleAddStep = () => {
    setDialogState({ type: 'step' });
  };

  const handleAddRepeatBlock = () => {
    // Add empty repeat block inline (no dialog)
    const newRepeatStep: any = {
      orderIndex: steps.length,
      stepType: 'REPEAT',
      durationType: 'OPEN',
      workoutStepId: generateTempId(), // Unique temporary ID
      repeatBlock: {
        repetitions: 1,
        childSteps: [],
      },
    };
    setSteps((prev) => [...prev, newRepeatStep]);
  };

  const handleEditStep = (step: any) => {
    setDialogState({ type: 'step', editing: step });
  };

  const handleStepSubmit = (step: Omit<any, 'workoutStepId'>) => {
    if (dialogState.type === 'step' && dialogState.editing) {
      // Edit existing step
      setSteps((prev) =>
        prev.map((s) => {
          if (
            'workoutStepId' in s &&
            s.workoutStepId === dialogState.editing?.workoutStepId
          ) {
            return { ...step, workoutStepId: s.workoutStepId };
          }
          return s;
        }),
      );
    } else {
      // Add new step with temporary ID
      const newStep: any = {
        ...step,
        workoutStepId: generateTempId(), // Unique temporary ID
        orderIndex: steps.length,
      };
      setSteps((prev) => [...prev, newStep]);
    }
    setDialogState({ type: 'none' });
  };

  const handleDeleteStep = (stepId: number) => {
    setSteps((prev) =>
      prev.filter((s) => {
        if ('workoutStepId' in s) {
          return s.workoutStepId !== stepId;
        }
        return true;
      }),
    );
  };

  // Repeat block handlers (inline, no dialog)
  const handleUpdateRepeatBlock = (updatedStep: any) => {
    setSteps((prev) =>
      prev.map((s) =>
        s.workoutStepId === updatedStep.workoutStepId ? updatedStep : s,
      ),
    );
  };

  // TODO: Implement repeat block deletion
  // const handleDeleteRepeatBlock = (_stepId: number) => {
  //   setSteps((prev) => prev.filter((s) => s.workoutStepId !== stepId));
  // };

  const handleAddChildStep = (
    parentStepId: number,
    childStep: Omit<any, 'workoutStepId'>,
  ) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.workoutStepId === parentStepId && s.repeatBlock) {
          const newChildStep: any = {
            ...childStep,
            workoutStepId: generateTempId(), // Unique temporary ID
            orderIndex: s.repeatBlock.childSteps.length,
          };
          return {
            ...s,
            repeatBlock: {
              ...s.repeatBlock,
              childSteps: [...s.repeatBlock.childSteps, newChildStep],
            },
          };
        }
        return s;
      }),
    );
  };

  const handleEditChildStep = (parentStepId: number, updatedChildStep: any) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.workoutStepId === parentStepId && s.repeatBlock) {
          return {
            ...s,
            repeatBlock: {
              ...s.repeatBlock,
              childSteps: s.repeatBlock.childSteps.map((child: any) =>
                child.workoutStepId === updatedChildStep.workoutStepId
                  ? updatedChildStep
                  : child,
              ),
            },
          };
        }
        return s;
      }),
    );
  };

  const handleDeleteChildStep = (parentStepId: number, childStepId: number) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.workoutStepId === parentStepId && s.repeatBlock) {
          return {
            ...s,
            repeatBlock: {
              ...s.repeatBlock,
              childSteps: s.repeatBlock.childSteps.filter(
                (child: any) => child.workoutStepId !== childStepId,
              ),
            },
          };
        }
        return s;
      }),
    );
  };

  const handleSave = () => {
    const stepsPayload = prepareStepsForSave(steps);

    // Temporarily disabled - workouts are now managed via events
    console.log('Would save workout:', { workoutData, stepsPayload });
    onSuccess?.(workout);
  };

  const handleCancel = () => {
    onCancel?.();
  };

  // === Render ===

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* any Metadata Form - Only shown if not hidden */}
      {!hideMetadataForm && (
        <>
          <WorkoutForm
            initialValues={workoutData}
            onSubmit={handleanyMetadataChange}
            onCancel={handleCancel}
            submitLabel="" // Hidden submit button (handled by save button below)
            cancelLabel=""
          />

          <Separator />
        </>
      )}

      {/* Steps List */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">
            {m.workout_structured_training()}
          </h3>
          <div className="flex-1" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddStep}
          >
            <Plus className="h-4 w-4 mr-2" />
            {m.workout_add_step()}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddRepeatBlock}
          >
            <Plus className="h-4 w-4 mr-2" />
            {m.workout_add_repeat_block()}
          </Button>
        </div>

        {steps.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <p className="text-sm text-muted-foreground">
              {m.workout_no_steps()}
            </p>
          </div>
        ) : (
          <StepList
            steps={steps}
            onReorder={setSteps}
            onEditStep={handleEditStep}
            onDeleteStep={handleDeleteStep}
            onUpdateRepeatBlock={handleUpdateRepeatBlock}
            onAddChildStep={handleAddChildStep}
            onEditChildStep={handleEditChildStep}
            onDeleteChildStep={handleDeleteChildStep}
          />
        )}
      </div>

      {!hideActions && (
        <>
          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !workoutData.name || steps.length === 0}
            >
              {isSaving ? 'Saving...' : workout ? 'Update any' : 'Create any'}
            </Button>
          </div>
        </>
      )}

      {/* Step Dialog */}
      <Dialog
        open={dialogState.type === 'step'}
        onOpenChange={(open) => {
          if (!open) setDialogState({ type: 'none' });
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogState.type === 'step' && dialogState.editing
                ? m.workout_edit_step()
                : m.workout_add_step()}
            </DialogTitle>
            <DialogDescription>
              {dialogState.type === 'step' && dialogState.editing
                ? m.repeat_form_edit_step_description()
                : m.repeat_form_add_step_description()}
            </DialogDescription>
          </DialogHeader>
          <StepForm
            initialValues={
              dialogState.type === 'step' && dialogState.editing
                ? dialogState.editing
                : undefined
            }
            sport={workoutData.sport}
            onSubmit={handleStepSubmit}
            onCancel={() => setDialogState({ type: 'none' })}
            submitLabel={
              dialogState.type === 'step' && dialogState.editing
                ? m.workout_update_step()
                : m.workout_add_step()
            }
            cancelLabel={m.cancel()}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
