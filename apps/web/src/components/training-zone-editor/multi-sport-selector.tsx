import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { m } from '@/paraglide/messages';
import { sportTypeLabelMap } from '@/utils/label-map/core';
import { cn } from '@/utils/shadcn';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { useState } from 'react';

import { SPORT_TYPE } from '@openathlete/shared';

interface MultiSportSelectorProps {
  value: SPORT_TYPE[];
  onChange: (sports: SPORT_TYPE[]) => void;
}

const ALL_SPORTS = Object.values(SPORT_TYPE);

export function MultiSportSelector({
  value,
  onChange,
}: MultiSportSelectorProps) {
  const [open, setOpen] = useState(false);

  const handleToggleSport = (sport: SPORT_TYPE) => {
    if (value.includes(sport)) {
      onChange(value.filter((s) => s !== sport));
    } else {
      onChange([...value, sport]);
    }
  };

  const handleRemoveSport = (sport: SPORT_TYPE) => {
    onChange(value.filter((s) => s !== sport));
  };

  const handleSelectAll = () => {
    onChange(ALL_SPORTS);
    setOpen(false);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const isAllSelected = value.length === ALL_SPORTS.length;

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            type="button"
          >
            <span className="truncate">
              {value.length === 0
                ? m.select_sports()
                : value.length === ALL_SPORTS.length
                  ? m.all_sports()
                  : `${value.length} ${m.sports().toLowerCase()}`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder={m.search_sports()} />
            <CommandList>
              <CommandEmpty>{m.no_sport_found()}</CommandEmpty>
              <CommandGroup>
                <CommandItem onSelect={handleSelectAll} className="font-medium">
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      isAllSelected ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {m.all_sports()}
                </CommandItem>
              </CommandGroup>
              <CommandGroup>
                {ALL_SPORTS.map((sport) => (
                  <CommandItem
                    key={sport}
                    value={sport}
                    onSelect={() => handleToggleSport(sport)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value.includes(sport) ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    {sportTypeLabelMap[sport]}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.length === ALL_SPORTS.length ? (
            <Badge variant="secondary" className="gap-1">
              {m.all_sports()}
              <button
                type="button"
                className="ml-1 rounded-full hover:bg-muted"
                onClick={handleClearAll}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ) : (
            value.map((sport) => (
              <Badge key={sport} variant="secondary" className="gap-1">
                {sportTypeLabelMap[sport]}
                <button
                  type="button"
                  className="ml-1 rounded-full hover:bg-muted"
                  onClick={() => handleRemoveSport(sport)}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))
          )}
        </div>
      )}
    </div>
  );
}
