import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { getDateLocale } from '@/utils/locales';
import { cn } from '@/utils/shadcn';
import { CalendarSearch, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { YEARS_PER_PAGE, yearPageStart } from './utils/year-page';

interface P {
  /** The month on screen, which the picker opens on */
  current: Date;
  /** Called with the first day of the chosen month */
  onSelect: (date: Date) => void;
  variant?: 'outline' | 'ghost';
  className?: string;
}

/**
 * Jumps to any month in two taps: the year, then the month. Arrows only step
 * one month or week, which takes dozens of clicks to reach last year.
 */
export function CalendarGoToDate({
  current,
  onSelect,
  variant = 'outline',
  className,
}: P) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(current.getFullYear());
  const [pickingYear, setPickingYear] = useState(false);
  const [pageStart, setPageStart] = useState(yearPageStart(year));
  const locale = getDateLocale(getLocale());
  const now = new Date();

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setYear(current.getFullYear());
      setPageStart(yearPageStart(current.getFullYear()));
      setPickingYear(false);
    }
  };

  const cell = (selected: boolean, today: boolean) =>
    cn(
      'h-11 capitalize md:h-9',
      today && !selected && 'border-primary text-primary',
    );

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          size="icon"
          className={className}
          aria-label={m.calendar_go_to_date()}
          title={m.calendar_go_to_date()}
        >
          <CalendarSearch />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full md:w-72" align="end">
        <div className="flex items-center justify-between gap-2 pb-3">
          <Button
            variant="ghost"
            size="icon"
            className="size-11 md:size-8"
            aria-label={
              pickingYear
                ? m.calendar_earlier_years()
                : m.calendar_previous_year()
            }
            onClick={() =>
              pickingYear
                ? setPageStart(pageStart - YEARS_PER_PAGE)
                : setYear(year - 1)
            }
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="ghost"
            className="h-11 font-semibold tabular-nums md:h-8"
            aria-label={m.calendar_pick_year()}
            aria-expanded={pickingYear}
            onClick={() => {
              setPageStart(yearPageStart(year));
              setPickingYear(!pickingYear);
            }}
          >
            {pickingYear
              ? `${pageStart} – ${pageStart + YEARS_PER_PAGE - 1}`
              : year}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-11 md:size-8"
            aria-label={
              pickingYear ? m.calendar_later_years() : m.calendar_next_year()
            }
            onClick={() =>
              pickingYear
                ? setPageStart(pageStart + YEARS_PER_PAGE)
                : setYear(year + 1)
            }
          >
            <ChevronRight />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {pickingYear
            ? Array.from({ length: YEARS_PER_PAGE }, (_, i) => {
                const value = pageStart + i;
                return (
                  <Button
                    key={value}
                    variant={value === year ? 'default' : 'outline'}
                    className={cell(
                      value === year,
                      value === now.getFullYear(),
                    )}
                    onClick={() => {
                      setYear(value);
                      setPickingYear(false);
                    }}
                  >
                    {value}
                  </Button>
                );
              })
            : Array.from({ length: 12 }, (_, month) => {
                const date = new Date(year, month, 1);
                const selected =
                  year === current.getFullYear() &&
                  month === current.getMonth();
                return (
                  <Button
                    key={month}
                    variant={selected ? 'default' : 'outline'}
                    className={cell(
                      selected,
                      year === now.getFullYear() && month === now.getMonth(),
                    )}
                    aria-label={date.toLocaleString(locale, {
                      month: 'long',
                      year: 'numeric',
                    })}
                    onClick={() => {
                      onSelect(date);
                      setOpen(false);
                    }}
                  >
                    {date.toLocaleString(locale, { month: 'short' })}
                  </Button>
                );
              })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
