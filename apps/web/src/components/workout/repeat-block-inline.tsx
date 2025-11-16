import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import * as m from '@/paraglide/messages';
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { type WorkoutStepDto as WorkoutStep } from '@openathlete/shared';

import { StepCard } from './step-card';
import { StepForm } from './step-form';

interface RepeatBlockInlineProps {
  step: WorkoutStep & { repeatBlock: NonNullable<WorkoutStep['repeatBlock']> };
  onUpdate: (step: WorkoutStep) => void;
  onDelete: (stepId: number) => void;
  onAddChildStep: (
    parentStepId: number,
    childStep: Omit<WorkoutStep, 'workoutStepId'>,
  ) => void;
  onEditChildStep: (parentStepId: number, childStep: WorkoutStep) => void;
  onDeleteChildStep: (parentStepId: number, childStepId: number) => void;
}

interface SortableChildStepProps {
  step: WorkoutStep;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}

function SortableChildStep({
  step,
  index,
  onEdit,
  onDelete,
}: SortableChildStepProps) {
  // Ensure step has a valid ID - this should never be undefined at this point
  const stepId = step.workoutStepId;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: stepId,
    disabled: false,
  });

  if (!stepId) {
    console.error('SortableChildStep: step.workoutStepId is undefined', step);
    return null;
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-2">
      <button
        type="button"
        className="mt-3 cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
      </button>
      <div className="flex-1">
        <StepCard
          step={step}
          index={index}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}

export function RepeatBlockInline({
  step,
  onUpdate,
  onDelete,
  onAddChildStep,
  onEditChildStep,
  onDeleteChildStep,
}: RepeatBlockInlineProps) {
  const [isStepDialogOpen, setIsStepDialogOpen] = useState(false);
  const [editingChildStep, setEditingChildStep] = useState<WorkoutStep | null>(
    null,
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Ensure all child steps have valid IDs - normalize on the fly if needed
  // Use a stable reference to avoid regenerating IDs on every render
  const normalizedChildSteps = useMemo(() => {
    if (!step.repeatBlock?.childSteps) return [];

    // Check if any child step is missing an ID
    const needsNormalization = step.repeatBlock.childSteps.some(
      (s: WorkoutStep) => s.workoutStepId == null,
    );

    if (!needsNormalization) {
      // All steps already have IDs, return as-is
      return step.repeatBlock.childSteps as WorkoutStep[];
    }

    // Normalize steps that are missing IDs
    let idCounter = 0;
    const generateTempId = () => -(Date.now() + idCounter++);

    return step.repeatBlock.childSteps.map(
      (childStep: WorkoutStep, idx: number) => ({
        ...childStep,
        workoutStepId: childStep.workoutStepId ?? generateTempId(),
        orderIndex: childStep.orderIndex ?? idx,
      }),
    ) as WorkoutStep[];
  }, [step.repeatBlock?.childSteps]);

  // Sync normalized child steps back to parent if they were normalized
  useEffect(() => {
    if (normalizedChildSteps.length > 0) {
      const needsSync = normalizedChildSteps.some(
        (normalized: WorkoutStep, idx: number) => {
          const original = step.repeatBlock?.childSteps?.[idx];
          return (
            original &&
            (original.workoutStepId !== normalized.workoutStepId ||
              original.orderIndex !== normalized.orderIndex)
          );
        },
      );

      if (needsSync) {
        // Update parent with normalized child steps to persist IDs
        onUpdate({
          ...step,
          repeatBlock: {
            ...step.repeatBlock,
            childSteps: normalizedChildSteps,
          },
        });
      }
    }
  }, [normalizedChildSteps, step, onUpdate]);

  const handleRepetitionsChange = (value: string) => {
    const repetitions = parseInt(value, 10);
    if (isNaN(repetitions) || repetitions < 1) return;

    // Ensure we update with normalized child steps
    onUpdate({
      ...step,
      repeatBlock: {
        ...step.repeatBlock,
        repetitions,
        childSteps: normalizedChildSteps,
      },
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = normalizedChildSteps.findIndex(
        (s: WorkoutStep) => s.workoutStepId === active.id,
      );
      const newIndex = normalizedChildSteps.findIndex(
        (s: WorkoutStep) => s.workoutStepId === over.id,
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedChildSteps = arrayMove(
          normalizedChildSteps,
          oldIndex,
          newIndex,
        ).map(
          (child, idx) =>
            ({ ...(child as WorkoutStep), orderIndex: idx }) as WorkoutStep,
        );

        onUpdate({
          ...step,
          repeatBlock: {
            ...step.repeatBlock,
            childSteps: reorderedChildSteps,
          },
        });
      }
    }
  };

  const handleAddChildStep = () => {
    setEditingChildStep(null);
    setIsStepDialogOpen(true);
  };

  const handleEditChildStep = (childStep: WorkoutStep) => {
    setEditingChildStep(childStep);
    setIsStepDialogOpen(true);
  };

  const handleStepSubmit = (childStep: Omit<WorkoutStep, 'workoutStepId'>) => {
    // Strict check: we're editing if editingChildStep exists AND has a valid ID
    const isEditing =
      editingChildStep != null &&
      editingChildStep.workoutStepId != null &&
      editingChildStep.workoutStepId !== undefined;

    if (isEditing) {
      // EDIT MODE: Update existing step
      onEditChildStep(step.workoutStepId!, {
        ...childStep,
        workoutStepId: editingChildStep.workoutStepId!,
        orderIndex: editingChildStep.orderIndex ?? 0,
      } as WorkoutStep);
    } else {
      // ADD MODE: Create new step
      onAddChildStep(step.workoutStepId!, childStep);
    }
    setIsStepDialogOpen(false);
    setEditingChildStep(null);
  };

  return (
    <>
      <Card className="border-l-4 border-primary/40 p-2">
        <div className="p-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-primary">
                {m.workout_step_repeat()}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-muted-foreground">×</span>
                <Input
                  id={`repetitions-${step.workoutStepId}`}
                  type="number"
                  min="1"
                  value={step.repeatBlock.repetitions}
                  onChange={(e) => handleRepetitionsChange(e.target.value)}
                  className="w-16 h-8 text-sm"
                />
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onDelete(step.workoutStepId!)}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="ml-2 space-y-1.5 border-l-2 border-border pl-3">
            {normalizedChildSteps.length === 0 ? (
              <div className="text-sm text-muted-foreground py-2 text-center italic">
                {m.repeat_form_no_steps_description()}
              </div>
            ) : (
              <DndContext
                id={`repeat-block-${step.workoutStepId}`}
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={normalizedChildSteps.map(
                    (s: WorkoutStep) => s.workoutStepId!,
                  )}
                  strategy={verticalListSortingStrategy}
                >
                  {normalizedChildSteps.map(
                    (childStep: WorkoutStep, childIndex: number) => (
                      <SortableChildStep
                        key={childStep.workoutStepId}
                        step={childStep}
                        index={childIndex + 1}
                        onEdit={() => handleEditChildStep(childStep)}
                        onDelete={() =>
                          onDeleteChildStep(
                            step.workoutStepId!,
                            childStep.workoutStepId!,
                          )
                        }
                      />
                    ),
                  )}
                </SortableContext>
              </DndContext>
            )}
          </div>
          <div className="ml-6 pl-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddChildStep}
              className="w-full h-8 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              {m.workout_add_step_to_repeat()}
            </Button>
          </div>
        </div>
      </Card>

      <Dialog
        open={isStepDialogOpen}
        onOpenChange={(open) => {
          setIsStepDialogOpen(open);
          if (!open) {
            // Reset editing state when dialog closes
            setEditingChildStep(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingChildStep ? 'Edit Step' : 'Add Step'}
            </DialogTitle>
            <DialogDescription>
              {editingChildStep
                ? 'Modify the step inside the repeat block'
                : 'Add a new step inside the repeat block'}
            </DialogDescription>
          </DialogHeader>
          <StepForm
            onSubmit={handleStepSubmit}
            onCancel={() => {
              setIsStepDialogOpen(false);
              setEditingChildStep(null);
            }}
            initialValues={editingChildStep || undefined}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
