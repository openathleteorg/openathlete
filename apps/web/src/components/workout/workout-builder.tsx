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
import { useCallback, useEffect, useState } from 'react';

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
  trainingId: number;
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
  trainingId: _trainingId,
  workout,
  sport,
  onStepsChange,
}: WorkoutBuilderProps) {
  const [steps, setSteps] = useState<WorkoutStepDto[]>(workout?.steps || []);
  const [dialogState, setDialogState] = useState<DialogState>({ type: 'none' });
  const [idCounter, setIdCounter] = useState<number>(0);

  const generateTempId = () => {
    const newId = -(Date.now() + idCounter);
    setIdCounter((prev) => prev + 1);
    return newId;
  };

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
    setSteps((prev) =>
      prev.map((s) =>
        s.workoutStepId === updatedStep.workoutStepId ? updatedStep : s,
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
          return {
            ...s,
            repeatBlock: {
              ...s.repeatBlock,
              childSteps: s.repeatBlock.childSteps.map(
                (child: WorkoutStepDto) =>
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
