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
import { useState } from 'react';

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

/**
 * SortableChildStep - A draggable child step within a repeat block
 */
function SortableChildStep({
  step,
  index,
  onEdit,
  onDelete,
}: SortableChildStepProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: step.workoutStepId!,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-2">
      {/* Drag Handle */}
      <button
        type="button"
        className="mt-3 cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
      </button>

      {/* Step Content */}
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

/**
 * RepeatBlockInline - Inline repeat block component
 *
 * Displays a repeat block with:
 * - Editable repetition count
 * - List of child steps with drag & drop reordering
 * - Button to add new child steps
 * - Delete button
 *
 * No nested dialogs - everything inline except for step editing
 */
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

  const handleRepetitionsChange = (value: string) => {
    const repetitions = parseInt(value, 10);
    if (isNaN(repetitions) || repetitions < 1) return;

    onUpdate({
      ...step,
      repeatBlock: {
        ...step.repeatBlock,
        repetitions,
      },
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const childSteps = step.repeatBlock.childSteps;
      const oldIndex = childSteps.findIndex(
        (s: WorkoutStep) => s.workoutStepId === active.id,
      );
      const newIndex = childSteps.findIndex(
        (s: WorkoutStep) => s.workoutStepId === over.id,
      );

      const reorderedChildSteps = arrayMove(childSteps, oldIndex, newIndex);

      onUpdate({
        ...step,
        repeatBlock: {
          ...step.repeatBlock,
          childSteps: reorderedChildSteps,
        },
      });
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
    if (editingChildStep) {
      // Edit existing child step
      onEditChildStep(step.workoutStepId!, {
        ...childStep,
        workoutStepId: editingChildStep.workoutStepId,
      } as WorkoutStep);
    } else {
      // Add new child step
      onAddChildStep(step.workoutStepId!, childStep);
    }
    setIsStepDialogOpen(false);
    setEditingChildStep(null);
  };

  return (
    <>
      <Card className="border-l-4 border-primary/40">
        <div className="p-2 space-y-1.5">
          {/* Header with repetitions input and delete button */}
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

          {/* Child steps with drag & drop */}
          <div className="ml-6 space-y-1.5 border-l-2 border-border pl-3">
            {step.repeatBlock.childSteps.length === 0 ? (
              <div className="text-sm text-muted-foreground py-2 text-center italic">
                {m.repeat_form_no_steps_description()}
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={step.repeatBlock.childSteps.map(
                    (s: WorkoutStep) => s.workoutStepId!,
                  )}
                  strategy={verticalListSortingStrategy}
                >
                  {step.repeatBlock.childSteps.map(
                    (childStep: WorkoutStep, childIndex: number) => (
                      <SortableChildStep
                        key={childStep.workoutStepId || childIndex}
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

          {/* Add step button */}
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

      {/* Step Dialog */}
      <Dialog open={isStepDialogOpen} onOpenChange={setIsStepDialogOpen}>
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
