import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Search } from 'lucide-react';
import { useState } from 'react';

interface ExercisePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

const PLACEHOLDER_EXERCISES = [
  'Push-ups',
  'Pull-ups',
  'Bench Press',
  'Shoulder Press',
  'Dumbbell Rows',
  'Bicep Curls',
  'Tricep Dips',
  'Squats',
  'Lunges',
  'Deadlifts',
  'Leg Press',
  'Calf Raises',
  'Bulgarian Split Squats',
  'Plank',
  'Crunches',
  'Russian Twists',
  'Mountain Climbers',
  'Bicycle Crunches',
  'Burpees',
  'Jumping Jacks',
  'Box Jumps',
  'Kettlebell Swings',
  'Downward Dog',
  'Warrior Pose',
  'Tree Pose',
  'Child Pose',
].sort();

export function ExercisePicker({
  value = '',
  onChange,
  placeholder = 'Search or type exercise name...',
  label,
}: ExercisePickerProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState(value);

  const filteredExercises = PLACEHOLDER_EXERCISES.filter((exercise) =>
    exercise.toLowerCase().includes(searchValue.toLowerCase()),
  );

  const handleSelect = (exercise: string) => {
    setSearchValue(exercise);
    onChange(exercise);
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <div className="relative">
          <Input
            value={searchValue}
            onChange={handleInputChange}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="pr-10"
          />
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setOpen(!open)}
            >
              <Search className="h-4 w-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
        </div>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
        >
          <Command>
            <CommandInput
              placeholder="Search exercises..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>
                No exercises found. You can still type your own.
              </CommandEmpty>
              <CommandGroup>
                {filteredExercises.map((exercise) => (
                  <CommandItem
                    key={exercise}
                    value={exercise}
                    onSelect={() => handleSelect(exercise)}
                  >
                    {exercise}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
