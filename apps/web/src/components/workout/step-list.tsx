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
import { GripVertical } from 'lucide-react';

import type { WorkoutStepDto as WorkoutStep } from '@openathlete/shared';

import { RepeatBlockInline } from './repeat-block-inline';
import { StepCard } from './step-card';

interface StepListProps {
  /**
   * Array of workout steps (including repeat blocks)
   */
  steps: WorkoutStep[];

  /**
   * Callback when steps are reordered
   */
  onReorder: (reorderedSteps: WorkoutStep[]) => void;

  /**
   * Callback to edit a step
   */
  onEditStep: (step: WorkoutStep) => void;

  /**
   * Callback to delete a step
   */
  onDeleteStep: (stepId: number) => void;

  /**
   * Callback to update a repeat block (e.g., change repetitions)
   */
  onUpdateRepeatBlock?: (step: WorkoutStep) => void;

  /**
   * Callback to add a child step to a repeat block
   */
  onAddChildStep?: (
    parentStepId: number,
    childStep: Omit<WorkoutStep, 'workoutStepId'>,
  ) => void;

  /**
   * Callback to edit a child step in a repeat block
   */
  onEditChildStep?: (parentStepId: number, childStep: WorkoutStep) => void;

  /**
   * Callback to delete a child step from a repeat block
   */
  onDeleteChildStep?: (parentStepId: number, childStepId: number) => void;

  /**
   * Whether the list is in a loading state
   */
  isLoading?: boolean;
}

interface SortableStepItemProps {
  step: WorkoutStep;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateRepeatBlock?: (step: WorkoutStep) => void;
  onAddChildStep?: (
    parentStepId: number,
    childStep: Omit<WorkoutStep, 'workoutStepId'>,
  ) => void;
  onEditChildStep?: (parentStepId: number, childStep: WorkoutStep) => void;
  onDeleteChildStep?: (parentStepId: number, childStepId: number) => void;
}

/**
 * Individual sortable step item with drag handle
 */
function SortableStepItem({
  step,
  index,
  onEdit,
  onDelete,
  onUpdateRepeatBlock,
  onAddChildStep,
  onEditChildStep,
  onDeleteChildStep,
}: SortableStepItemProps) {
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
    transform: CSS.Translate.toString(transform),
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
        {step.stepType === 'REPEAT' && step.repeatBlock ? (
          // Repeat block - use RepeatBlockInline component
          <RepeatBlockInline
            step={
              step as WorkoutStep & {
                repeatBlock: NonNullable<WorkoutStep['repeatBlock']>;
              }
            }
            onUpdate={onUpdateRepeatBlock || (() => {})}
            onDelete={onDelete}
            onAddChildStep={onAddChildStep || (() => {})}
            onEditChildStep={onEditChildStep || (() => {})}
            onDeleteChildStep={onDeleteChildStep || (() => {})}
          />
        ) : (
          // Regular step
          <StepCard
            step={step}
            index={index}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )}
      </div>
    </div>
  );
}

/**
 * StepList - Sortable list of workout steps with drag & drop
 *
 * Displays workout steps with drag handles for reordering.
 * Supports both regular steps and repeat blocks with nested child steps.
 */
export function StepList({
  steps,
  onReorder,
  onEditStep,
  onDeleteStep,
  onUpdateRepeatBlock,
  onAddChildStep,
  onEditChildStep,
  onDeleteChildStep,
  isLoading = false,
}: StepListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = steps.findIndex((s) => s.workoutStepId === active.id);
      const newIndex = steps.findIndex((s) => s.workoutStepId === over.id);

      const reorderedSteps = arrayMove(steps, oldIndex, newIndex).map(
        (step, index) => ({
          ...step,
          orderIndex: index,
        }),
      );

      onReorder(reorderedSteps);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <p className="text-sm text-muted-foreground">
          No steps added yet. Add your first step to get started.
        </p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={steps.map((s) => s.workoutStepId!)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {steps.map((step, index) => (
            <SortableStepItem
              key={step.workoutStepId}
              step={step}
              index={index + 1}
              onEdit={() => onEditStep(step)}
              onDelete={() => onDeleteStep(step.workoutStepId!)}
              onUpdateRepeatBlock={onUpdateRepeatBlock}
              onAddChildStep={onAddChildStep}
              onEditChildStep={onEditChildStep}
              onDeleteChildStep={onDeleteChildStep}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
