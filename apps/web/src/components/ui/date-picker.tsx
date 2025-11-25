import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/utils/shadcn';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

interface DatePickerProps {
  date?: Date;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  max?: Date;
  min?: Date;
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = 'Pick a date',
  className,
  disabled,
  max,
  min,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'PPP') : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onDateChange}
          initialFocus
          disabled={(date) => {
            if (!max && !min) {
              return false;
            }
            if (max && date > max) {
              return true;
            }
            if (min && date < min) {
              return true;
            }
            return false;
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
