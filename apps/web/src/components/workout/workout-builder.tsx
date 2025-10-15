import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import * as m from '@/paraglide/messages';
import { Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { SPORT_TYPE } from '@openathlete/shared';

import { StepForm } from './step-form';
import { StepList } from './step-list';

interface WorkoutBuilderProps {
  trainingId: number;
  workout?: any | null;
  sport: SPORT_TYPE;
  isLoading?: boolean;
  onSuccess?: (workout: any) => void;
  onCancel?: () => void;
  hideMetadataForm?: boolean;
  hideActions?: boolean;
  onStepsChange?: (steps: any[]) => void;
}

type DialogState = { type: 'none' } | { type: 'step'; editing?: any };

export function WorkoutBuilder({
  trainingId: _trainingId,
  workout,
  isLoading = false,
  sport,
  onStepsChange,
}: WorkoutBuilderProps) {
  const [steps, setSteps] = useState<any[]>(workout?.steps || []);

  const [dialogState, setDialogState] = useState<DialogState>({ type: 'none' });

  const [idCounter, setIdCounter] = useState<number>(0);

  const generateTempId = () => {
    const newId = -(Date.now() + idCounter);
    setIdCounter((prev) => prev + 1);
    return newId;
  };

  const prepareStepsForSave = useCallback((stepsToClean: any[]) => {
    return stepsToClean.map((step, index) => {
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

  const handleAddStep = () => {
    setDialogState({ type: 'step' });
  };

  const handleAddRepeatBlock = () => {
    const newRepeatStep: any = {
      orderIndex: steps.length,
      stepType: 'REPEAT',
      durationType: 'OPEN',
      workoutStepId: generateTempId(),
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
      const newStep: any = {
        ...step,
        workoutStepId: generateTempId(),
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

  const handleUpdateRepeatBlock = (updatedStep: any) => {
    setSteps((prev) =>
      prev.map((s) =>
        s.workoutStepId === updatedStep.workoutStepId ? updatedStep : s,
      ),
    );
  };

  const handleAddChildStep = (
    parentStepId: number,
    childStep: Omit<any, 'workoutStepId'>,
  ) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.workoutStepId === parentStepId && s.repeatBlock) {
          const newChildStep: any = {
            ...childStep,
            workoutStepId: generateTempId(),
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
