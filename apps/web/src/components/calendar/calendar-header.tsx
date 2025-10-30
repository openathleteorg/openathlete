import { useAthleteInfo } from '@/hooks/use-athlete-info';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { getDateLocale } from '@/utils/locales';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import { EVENT_TYPE, Event, SPORT_TYPE } from '@openathlete/shared';

import { SportSelect } from '../sport-select/sport-select';
import { Button } from '../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { useCalendarContext } from './hooks/use-calendar-context';
import { COLORED_BY, coloredByLabelMap } from './types/filter';

interface P {}

export function CalendarHeader({}: P) {
  const {
    nextMonth,
    prevMonth,
    displayedMonth,
    setFilter,
    coloredBy,
    setColoredBy,
    athleteId,
  } = useCalendarContext();
  const [sportFilter, setSportFilter] = useState<SPORT_TYPE | null>(null);
  const { athlete, isCurrentUser } = useAthleteInfo({ athleteId });

  const handleChangeSportFilter = (value: string | null) => {
    setSportFilter(value as SPORT_TYPE);

    if (!value) {
      setFilter(() => () => true);
    } else {
      setFilter(
        () => (event: Event) =>
          event.type !== EVENT_TYPE.NOTE && event.sport === value,
      );
    }
  };

  const displayedMonthString = displayedMonth.toLocaleString(
    getDateLocale(getLocale()),
    {
      month: 'long',
      year: 'numeric',
    },
  );

  const calendarTitle = isCurrentUser
    ? m.calendar_of({ month: displayedMonthString })
    : m.calendar_of_athlete({
        firstName: athlete?.user?.firstName || '',
        lastName: athlete?.user?.lastName || '',
        month: displayedMonthString,
      });

  return (
    <div className="flex justify-between">
      <h1 className="text-2xl font-semibold">{calendarTitle}</h1>
      <div className="flex gap-2">
        <Select
          value={coloredBy || ''}
          onValueChange={(c) => {
            if (c === '') {
              setColoredBy(null);
            } else {
              setColoredBy(c as COLORED_BY);
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder={m.colored_by()} />
          </SelectTrigger>
          <SelectContent>
            {Object.values(COLORED_BY).map((colorProfile) => (
              <SelectItem key={colorProfile} value={colorProfile}>
                {coloredByLabelMap[colorProfile]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <SportSelect
          selected={sportFilter}
          onChange={(sport) => handleChangeSportFilter(sport)}
        />
        <Button size="icon" onClick={() => prevMonth()}>
          <ChevronLeft />
        </Button>
        <Button onClick={() => nextMonth()} size="icon">
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
