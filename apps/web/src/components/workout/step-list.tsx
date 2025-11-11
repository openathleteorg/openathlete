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
  steps: WorkoutStep[];
  onReorder: (reorderedSteps: WorkoutStep[]) => void;
  onEditStep: (step: WorkoutStep) => void;
  onDeleteStep: (stepId: number) => void;
  onUpdateRepeatBlock?: (step: WorkoutStep) => void;
  onAddChildStep?: (
    parentStepId: number,
    childStep: Omit<WorkoutStep, 'workoutStepId'>,
  ) => void;
  onEditChildStep?: (parentStepId: number, childStep: WorkoutStep) => void;
  onDeleteChildStep?: (parentStepId: number, childStepId: number) => void;
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
      <button
        type="button"
        className="mt-3 cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
      </button>

      <div className="flex-1">
        {step.stepType === 'REPEAT' && step.repeatBlock ? (
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

export function StepList({
  steps,
  onReorder,
  onEditStep,
  onDeleteStep,
  onUpdateRepeatBlock,
  onAddChildStep,
  onEditChildStep,
  onDeleteChildStep,
}: StepListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Ignore drags that involve child steps (they're handled by nested DndContext)
    const isActiveChildStep = !steps.some((s) => s.workoutStepId === active.id);
    const isOverChildStep = over && !steps.some((s) => s.workoutStepId === over.id);
    
    if (isActiveChildStep || isOverChildStep) {
      // This drag is for a child step, let the nested context handle it
      return;
    }

    if (over && active.id !== over.id) {
      const oldIndex = steps.findIndex((s) => s.workoutStepId === active.id);
      const newIndex = steps.findIndex((s) => s.workoutStepId === over.id);

      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      const reorderedSteps = arrayMove(steps, oldIndex, newIndex).map(
        (step, index) => ({
          ...step,
          orderIndex: index,
        }),
      );

      onReorder(reorderedSteps);
    }
  };

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
