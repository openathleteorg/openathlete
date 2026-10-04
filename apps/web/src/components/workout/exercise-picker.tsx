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
import { m } from '@/paraglide/messages';
import { Search } from 'lucide-react';
import { useState } from 'react';

interface ExercisePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

const PLACEHOLDER_EXERCISES = [
  m.exercise_push_ups(),
  m.exercise_pull_ups(),
  m.exercise_bench_press(),
  m.exercise_shoulder_press(),
  m.exercise_dumbbell_rows(),
  m.exercise_bicep_curls(),
  m.exercise_tricep_dips(),
  m.exercise_squats(),
  m.exercise_lunges(),
  m.exercise_deadlifts(),
  m.exercise_leg_press(),
  m.exercise_calf_raises(),
  m.exercise_bulgarian_split_squats(),
  m.exercise_plank(),
  m.exercise_crunches(),
  m.exercise_russian_twists(),
  m.exercise_mountain_climbers(),
  m.exercise_bicycle_crunches(),
  m.exercise_burpees(),
  m.exercise_jumping_jacks(),
  m.exercise_box_jumps(),
  m.exercise_kettlebell_swings(),
  m.exercise_downward_dog(),
  m.exercise_warrior_pose(),
  m.exercise_tree_pose(),
  m.exercise_child_pose(),
].sort();

export function ExercisePicker({
  value = '',
  onChange,
  placeholder = m.exercise_search_placeholder(),
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
              placeholder={m.ui_search_exercises()}
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>{m.ui_no_exercises()} </CommandEmpty>
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
