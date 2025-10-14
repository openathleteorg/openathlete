import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import type { WorkoutRepeat, WorkoutStepDto } from '@openathlete/shared';

import { StepCard } from './step-card';
import { StepForm } from './step-form';

// Zod schema for repeat block form
const repeatBlockFormSchema = z.object({
  repetitions: z.number().min(1).max(99),
});

type RepeatBlockFormValues = z.infer<typeof repeatBlockFormSchema>;

// Step with temp ID for UI
type StepWithId = WorkoutStepDto & {
  tempId: string;
};

interface RepeatBlockFormProps {
  initialValues?: Partial<WorkoutRepeat>;
  onSubmit: (
    values: RepeatBlockFormValues & { childSteps: StepWithId[] },
  ) => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
}

/**
 * Form for creating or editing a repeat block
 * Manages child steps with add/edit/delete functionality
 */
export function RepeatBlockForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = 'Save Repeat Block',
  cancelLabel = 'Cancel',
}: RepeatBlockFormProps) {
  const [childSteps, setChildSteps] = useState<StepWithId[]>(
    initialValues?.childSteps?.map((step: WorkoutStepDto, idx: number) => ({
      ...step,
      tempId: `existing-${idx}`,
    })) || [],
  );
  const [isStepDialogOpen, setIsStepDialogOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<StepWithId | null>(null);

  const form = useForm<RepeatBlockFormValues>({
    resolver: zodResolver(repeatBlockFormSchema),
    defaultValues: {
      repetitions: initialValues?.repetitions || 1,
    },
  });

  // Add new step
  const handleAddStep = (stepValues: any) => {
    const newStep: StepWithId = {
      ...stepValues,
      tempId: `temp-${Date.now()}`,
      workoutStepId: undefined,
      orderIndex: childSteps.length,
      repeatBlock: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setChildSteps([...childSteps, newStep]);
    setIsStepDialogOpen(false);
  };

  // Update existing step
  const handleUpdateStep = (stepValues: any) => {
    if (!editingStep) return;

    setChildSteps(
      childSteps.map((s) =>
        s.tempId === editingStep.tempId
          ? { ...s, ...stepValues, updatedAt: new Date() }
          : s,
      ),
    );
    setEditingStep(null);
    setIsStepDialogOpen(false);
  };

  // Delete step
  const handleDeleteStep = (tempId: string) => {
    setChildSteps(childSteps.filter((s) => s.tempId !== tempId));
  };

  // Open edit dialog
  const handleEditStep = (tempId: string) => {
    const step = childSteps.find((s) => s.tempId === tempId);
    if (step) {
      setEditingStep(step);
      setIsStepDialogOpen(true);
    }
  };

  // Cancel step dialog
  const handleCancelStepDialog = () => {
    setEditingStep(null);
    setIsStepDialogOpen(false);
  };

  // Submit form with child steps
  const handleSubmit = (values: RepeatBlockFormValues) => {
    onSubmit({
      ...values,
      childSteps,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Repetitions */}
        <FormField
          control={form.control}
          name="repetitions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Repetitions</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type="number"
                    min="1"
                    max="99"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === '' ? 1 : Number(value));
                    }}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                    times
                  </span>
                </div>
              </FormControl>
              <FormDescription>
                How many times to repeat this block (1-99)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Child Steps Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <FormLabel>Child Steps</FormLabel>
              <p className="text-sm text-muted-foreground">
                Steps to repeat in this block
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingStep(null);
                setIsStepDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Step
            </Button>
          </div>

          {/* Step Dialog - Separate from the button to avoid nested forms */}
          <Dialog
            open={isStepDialogOpen}
            onOpenChange={(open) => {
              setIsStepDialogOpen(open);
              if (!open) {
                setEditingStep(null);
              }
            }}
          >
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingStep ? 'Edit Step' : 'Add Step'}
                </DialogTitle>
                <DialogDescription>
                  {editingStep
                    ? 'Update the step details'
                    : 'Create a new step for this repeat block'}
                </DialogDescription>
              </DialogHeader>
              <StepForm
                initialValues={editingStep || undefined}
                onSubmit={editingStep ? handleUpdateStep : handleAddStep}
                onCancel={handleCancelStepDialog}
                submitLabel={editingStep ? 'Update' : 'Add'}
              />
            </DialogContent>
          </Dialog>

          <div className="space-y-2">
            {/* Steps list moved below dialog */}
            {childSteps.length > 0 ? (
              <>
                {childSteps.map((step, idx) => (
                  <StepCard
                    key={step.tempId}
                    step={step}
                    index={idx + 1}
                    onEdit={() => handleEditStep(step.tempId)}
                    onDelete={() => handleDeleteStep(step.tempId)}
                    variant="default"
                  />
                ))}
              </>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  No steps added yet
                </p>
                <p className="text-xs text-muted-foreground">
                  Click "Add Step" to create steps for this repeat block
                </p>
              </div>
            )}
          </div>

          {/* Summary */}
          {childSteps.length > 0 && (
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Total Steps:</span>
                <span>{childSteps.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="font-medium">Will be repeated:</span>
                <span className="text-violet-600 dark:text-violet-400 font-semibold">
                  {form.watch('repetitions')}×
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Validation Warning */}
        {childSteps.length === 0 && (
          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ A repeat block must have at least one step
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              {cancelLabel}
            </Button>
          )}
          <Button type="submit" disabled={childSteps.length === 0}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
