import { Button } from '@/components/ui/button';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { SPORT_TYPE } from '@openathlete/shared';

// Available sports
const SPORTS = [
  { value: SPORT_TYPE.RUNNING, label: 'Running' },
  { value: SPORT_TYPE.TRAIL_RUNNING, label: 'Trail Running' },
  { value: SPORT_TYPE.CYCLING, label: 'Cycling' },
  { value: SPORT_TYPE.SWIMMING, label: 'Swimming' },
  { value: SPORT_TYPE.ROCK_CLIMBING, label: 'Rock Climbing' },
  { value: SPORT_TYPE.HIKING, label: 'Hiking' },
  { value: SPORT_TYPE.STRENGTH, label: 'Strength Training' },
  { value: SPORT_TYPE.CROSSFIT, label: 'CrossFit' },
  { value: SPORT_TYPE.YOGA, label: 'Yoga' },
  { value: SPORT_TYPE.OTHER, label: 'Other' },
] as const;

// Zod schema for workout form
const workoutFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().nullable().optional(),
  sport: z.nativeEnum(SPORT_TYPE),
});

type WorkoutFormValues = z.infer<typeof workoutFormSchema>;

interface WorkoutFormProps {
  initialValues?: Partial<WorkoutFormValues>;
  onSubmit: (values: WorkoutFormValues) => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
}

/**
 * Form for creating or editing workout metadata
 * Top-level form for workout name, description, and sport
 */
export function WorkoutForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = 'Save Workout',
  cancelLabel = 'Cancel',
}: WorkoutFormProps) {
  const form = useForm<WorkoutFormValues>({
    resolver: zodResolver(workoutFormSchema),
    defaultValues: {
      name: initialValues?.name || '',
      description: initialValues?.description || null,
      sport: initialValues?.sport || SPORT_TYPE.RUNNING,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Workout Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Tempo Run, Interval Training, Long Ride"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Give your workout a descriptive name
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Sport */}
        <FormField
          control={form.control}
          name="sport"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sport</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sport" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SPORTS.map((sport) => (
                    <SelectItem key={sport.value} value={sport.value}>
                      {sport.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                The primary sport for this workout
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the purpose and goals of this workout..."
                  className="resize-none"
                  rows={4}
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormDescription>
                Optional description of the workout's purpose and goals
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              {cancelLabel}
            </Button>
          )}
          <Button type="submit">{submitLabel}</Button>
        </div>
      </form>
    </Form>
  );
}
