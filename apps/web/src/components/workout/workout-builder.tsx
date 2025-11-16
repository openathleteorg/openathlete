import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import * as m from '@/paraglide/messages';
import { Plus } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  WorkoutDto,
  WorkoutDurationType,
  WorkoutStepDto,
  WorkoutStepType,
} from '@openathlete/shared';
import {
  SPORT_TYPE,
  WORKOUT_DURATION_TYPE,
  WORKOUT_STEP_TYPE,
  normalizeWorkoutForCreate,
} from '@openathlete/shared';

import { StepForm } from './step-form';
import { StepList } from './step-list';

interface WorkoutBuilderProps {
  workout?: WorkoutDto | null;
  sport: SPORT_TYPE;
  hideMetadataForm?: boolean;
  hideActions?: boolean;
  onStepsChange?: (steps: WorkoutStepDto[]) => void;
}

type DialogState =
  | { type: 'none' }
  | { type: 'step'; editing?: Partial<WorkoutStepDto> };

export function WorkoutBuilder({
  workout,
  sport,
  onStepsChange,
}: WorkoutBuilderProps) {
  const [steps, setSteps] = useState<WorkoutStepDto[]>(workout?.steps || []);
  const [dialogState, setDialogState] = useState<DialogState>({ type: 'none' });
  const [idCounter, setIdCounter] = useState<number>(0);
  const prevWorkoutRef = useRef<WorkoutDto | null | undefined>(workout);

  const generateTempId = () => {
    const newId = -(Date.now() + idCounter);
    setIdCounter((prev) => prev + 1);
    return newId;
  };

  const ensureIdsAndOrder = useCallback(
    (input: WorkoutStepDto[]): WorkoutStepDto[] => {
      const assign = (arr: WorkoutStepDto[]): WorkoutStepDto[] =>
        arr.map((s, idx) => {
          const withId: WorkoutStepDto = {
            ...s,
            workoutStepId: s.workoutStepId ?? generateTempId(),
            orderIndex: idx,
          } as WorkoutStepDto;
          if (
            withId.stepType === WORKOUT_STEP_TYPE.REPEAT &&
            withId.repeatBlock
          ) {
            const childSteps = withId.repeatBlock.childSteps || [];
            const withChildIds = assign(childSteps);
            return {
              ...withId,
              repeatBlock: {
                ...withId.repeatBlock,
                childSteps: withChildIds,
              },
            } as WorkoutStepDto;
          }
          return withId;
        });
      return assign(input || []);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [idCounter],
  );

  // Update steps when workout prop changes (only if workout actually changed)
  useEffect(() => {
    const prevWorkout = prevWorkoutRef.current;
    const workoutStepsIds =
      workout?.steps
        ?.map((s) => s.workoutStepId)
        .sort()
        .join(',') || '';
    const prevWorkoutStepsIds =
      prevWorkout?.steps
        ?.map((s) => s.workoutStepId)
        .sort()
        .join(',') || '';

    // Only update if workout reference changed or step IDs changed
    if (prevWorkout !== workout || workoutStepsIds !== prevWorkoutStepsIds) {
      if (workout?.steps && workout.steps.length > 0) {
        setSteps(
          ensureIdsAndOrder(workout.steps as unknown as WorkoutStepDto[]),
        );
      } else if (!workout?.steps || workout.steps.length === 0) {
        setSteps([]);
      }
      prevWorkoutRef.current = workout;
    }
  }, [workout, ensureIdsAndOrder]);

  const prepareStepsForSave = useCallback((stepsToClean: WorkoutStepDto[]) => {
    const normalized = normalizeWorkoutForCreate({ steps: stepsToClean });
    return normalized.steps as unknown as WorkoutStepDto[];
  }, []);

  useEffect(() => {
    if (onStepsChange) {
      const cleanedSteps = prepareStepsForSave(steps);
      onStepsChange(cleanedSteps);
    }
  }, [steps, onStepsChange, prepareStepsForSave]);

  const handleAddStep = () => {
    setDialogState({ type: 'step' });
  };

  const handleAddRepeatBlock = () => {
    const newRepeatStep: WorkoutStepDto = {
      orderIndex: steps.length,
      stepType: WORKOUT_STEP_TYPE.REPEAT as WorkoutStepType,
      durationType: WORKOUT_DURATION_TYPE.OPEN as WorkoutDurationType,
      workoutStepId: generateTempId(),
      repeatBlock: {
        repetitions: 1,
        childSteps: [],
      },
    };
    setSteps((prev) => [...prev, newRepeatStep]);
  };

  const handleEditStep = (step: WorkoutStepDto) => {
    setDialogState({ type: 'step', editing: step });
  };

  const handleStepSubmit = (step: Omit<WorkoutStepDto, 'workoutStepId'>) => {
    if (dialogState.type === 'step' && dialogState.editing) {
      setSteps((prev) =>
        prev.map((s) => {
          if (
            'workoutStepId' in s &&
            s.workoutStepId === dialogState.editing?.workoutStepId
          ) {
            return {
              ...step,
              workoutStepId: s.workoutStepId,
            } as WorkoutStepDto;
          }
          return s as WorkoutStepDto;
        }),
      );
    } else {
      const newStep: WorkoutStepDto = {
        ...step,
        workoutStepId: generateTempId(),
        orderIndex: steps.length,
      } as WorkoutStepDto;
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

  const handleUpdateRepeatBlock = (updatedStep: WorkoutStepDto) => {
    // Ensure child steps have ids and coherent order after update
    const normalized =
      updatedStep.stepType === WORKOUT_STEP_TYPE.REPEAT &&
      updatedStep.repeatBlock
        ? ({
            ...updatedStep,
            repeatBlock: {
              ...updatedStep.repeatBlock,
              childSteps: ensureIdsAndOrder(
                updatedStep.repeatBlock
                  .childSteps as unknown as WorkoutStepDto[],
              ),
            },
          } as WorkoutStepDto)
        : updatedStep;
    setSteps((prev) =>
      prev.map((s) =>
        s.workoutStepId === normalized.workoutStepId ? normalized : s,
      ),
    );
  };

  const handleAddChildStep = (
    parentStepId: number,
    childStep: Omit<WorkoutStepDto, 'workoutStepId'>,
  ) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.workoutStepId === parentStepId && s.repeatBlock) {
          const newChildStep: WorkoutStepDto = {
            ...childStep,
            workoutStepId: generateTempId(),
            orderIndex: s.repeatBlock.childSteps.length,
          } as WorkoutStepDto;
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

  const handleEditChildStep = (
    parentStepId: number,
    updatedChildStep: WorkoutStepDto,
  ) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.workoutStepId === parentStepId && s.repeatBlock) {
          const childStepId = updatedChildStep.workoutStepId;
          // Strict validation: childStepId must be defined
          if (childStepId == null || childStepId === undefined) {
            console.error(
              'handleEditChildStep: updatedChildStep.workoutStepId is invalid',
              updatedChildStep,
            );
            return s;
          }

          // Find the index of the step to update
          const childIndex = s.repeatBlock.childSteps.findIndex(
            (child: WorkoutStepDto) => child.workoutStepId === childStepId,
          );

          // If step not found, don't modify (should not happen)
          if (childIndex === -1) {
            console.error(
              'handleEditChildStep: child step not found',
              childStepId,
              s.repeatBlock.childSteps,
            );
            return s;
          }

          // Update only the specific step at its current position
          const updatedChildren = [...s.repeatBlock.childSteps];
          updatedChildren[childIndex] = {
            ...updatedChildStep,
            workoutStepId: childStepId,
            orderIndex: childIndex, // Preserve position
          } as WorkoutStepDto;

          return {
            ...s,
            repeatBlock: {
              ...s.repeatBlock,
              childSteps: updatedChildren,
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
                (child: WorkoutStepDto) => child.workoutStepId !== childStepId,
              ),
            },
          };
        }
        return s;
      }),
    );
  };

  return (
    <div className="space-y-6">
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
            sport={sport}
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
