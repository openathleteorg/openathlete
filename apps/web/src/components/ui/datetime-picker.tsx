'use client';

import { Button } from '@/components/ui/button';
import { getLocale } from '@/paraglide/runtime';
import { getDateFnsLocale } from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';

import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { ScrollArea, ScrollBar } from './scroll-area';

interface P {
  value?: Date;
  onChange: (date: Date) => void;
  className?: string;
}

export function DateTimePicker({ value, onChange, className }: P) {
  const [isOpen, setIsOpen] = useState(false);
  const locale = getLocale();

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  const handleTimeChange = (type: 'hour' | 'minute', timeValue: string) => {
    if (value) {
      const newDate = new Date(value);
      if (type === 'hour') {
        newDate.setHours(parseInt(timeValue));
      } else if (type === 'minute') {
        newDate.setMinutes(parseInt(timeValue));
      }
      onChange(newDate);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            className,
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? (
            format(value, 'MM/dd/yyyy HH:mm')
          ) : (
            <span>MM/DD/YYYY hh:mm</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="sm:flex">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleDateSelect}
            initialFocus
            locale={getDateFnsLocale(locale)}
          />
          <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
            <ScrollArea className="w-64 sm:w-auto">
              <div className="flex sm:flex-col p-2">
                {hours.reverse().map((hour) => (
                  <Button
                    key={hour}
                    size="icon"
                    variant={
                      value && value.getHours() === hour ? 'default' : 'ghost'
                    }
                    className="sm:w-full shrink-0 aspect-square"
                    onClick={() => handleTimeChange('hour', hour.toString())}
                  >
                    {hour}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="sm:hidden" />
            </ScrollArea>
            <ScrollArea className="w-64 sm:w-auto">
              <div className="flex sm:flex-col p-2">
                {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                  <Button
                    key={minute}
                    size="icon"
                    variant={
                      value && value.getMinutes() === minute
                        ? 'default'
                        : 'ghost'
                    }
                    className="sm:w-full shrink-0 aspect-square"
                    onClick={() =>
                      handleTimeChange('minute', minute.toString())
                    }
                  >
                    {minute.toString().padStart(2, '0')}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="sm:hidden" />
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
