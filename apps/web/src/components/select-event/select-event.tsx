import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { Check, ChevronsUpDown } from 'lucide-react';
import { ReactNode, useState } from 'react';

import { Event } from '@openathlete/shared';

import { Button } from '../ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

interface P {
  data: Event[] | undefined;
  className?: string;
  onChange: (eventId: number) => void;
  value?: number;
  displayRow?: (event: Event) => ReactNode | string;
  filter?: (event: Event, events: Event[]) => boolean;
}

export function SelectEvent({
  data,
  className,
  value,
  onChange,
  filter,
  displayRow,
}: P) {
  const [open, setOpen] = useState(false);

  const events = (filter ? data?.filter((e) => filter(e, data)) : data) || [];
  const currentEvent = data?.find((event) => event.eventId === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('justify-between', className)}
        >
          {value && currentEvent
            ? displayRow
              ? displayRow(currentEvent)
              : currentEvent.name
            : m.select_event()}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn('p-0', className)}>
        <Command
          filter={(value, search) =>
            events
              .find((event) => event.eventId === Number(value))
              ?.name.toLowerCase()
              .includes(search.toLowerCase())
              ? 1
              : 0
          }
        >
          <CommandInput placeholder={m.search_event()} className="h-9" />
          <CommandList>
            <CommandEmpty>{m.no_event_found()}</CommandEmpty>
            <CommandGroup>
              {events.map((event) => (
                <CommandItem
                  key={event.eventId}
                  value={event.eventId.toString()}
                  onSelect={(currentValue) => {
                    setOpen(false);
                    if (Number(currentValue) === value) return;
                    onChange(Number(currentValue));
                  }}
                >
                  {displayRow ? displayRow(event) : event.name}
                  <Check
                    className={cn(
                      'ml-auto',
                      value === event.eventId ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
