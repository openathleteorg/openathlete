import { SportSelect } from '@/components/sport-select/sport-select';
import { m } from '@/paraglide/messages';
import { getLocale } from '@/paraglide/runtime';
import { getDateLocale } from '@/utils/locales';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import {
  SPORT_TYPE,
  getQuarterPeriod,
  getYearPeriod,
} from '@openathlete/shared';

import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';

interface P {
  onChange: (start: Date, end: Date) => void;
  period: { start: Date; end: Date };
  className?: string;
  firstActivityDate?: Date | null; // Date of first activity for "since beginning"
  sport?: SPORT_TYPE | null;
  onSportChange?: (sport: SPORT_TYPE | null) => void;
}

export function ProgressionPeriodSelect({
  onChange,
  period,
  className,
  firstActivityDate,
  sport,
  onSportChange,
}: P) {
  const [type, setType] = useState<'quarter' | 'year' | 'all'>('year');
  const [offset, setOffset] = useState(0);

  const handleChangeType = (t: 'quarter' | 'year' | 'all') => {
    setType(t);
    setOffset(0);
    let start: Date;
    let end: Date;

    if (t === 'all' && firstActivityDate) {
      start = new Date(firstActivityDate);
      end = new Date();
    } else {
      switch (t) {
        case 'quarter':
          ({ start, end } = getQuarterPeriod(new Date()));
          break;
        case 'year':
          ({ start, end } = getYearPeriod(new Date()));
          break;
        default:
          ({ start, end } = getYearPeriod(new Date()));
      }
    }
    onChange(start, end);
  };

  const handleOffset = (direction: 'prev' | 'next') => {
    if (type === 'all') return; // No offset for "all time"

    let newOffset = offset;
    if (direction === 'prev') newOffset = offset - 1;
    else newOffset = offset + 1;
    setOffset(newOffset);
    let start: Date;
    let end: Date;

    switch (type) {
      case 'quarter': {
        const quarterDate = new Date();
        quarterDate.setMonth(quarterDate.getMonth() + newOffset * 3);
        ({ start, end } = getQuarterPeriod(quarterDate));
        break;
      }
      case 'year': {
        const yearDate = new Date();
        yearDate.setFullYear(yearDate.getFullYear() + newOffset);
        ({ start, end } = getYearPeriod(yearDate));
        break;
      }
      default:
        ({ start, end } = getYearPeriod(new Date()));
    }
    onChange(start, end);
  };

  const formatPeriodLabel = () => {
    if (type === 'all') {
      return firstActivityDate
        ? `${new Date(firstActivityDate).toLocaleString(
            getDateLocale(getLocale()),
            {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            },
          )} ${m.to()} ${new Date().toLocaleString(getDateLocale(getLocale()), {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}`
        : m.all_time();
    }

    if (type === 'quarter') {
      const quarter = Math.floor(new Date(period.start).getMonth() / 3) + 1;
      return `Q${quarter} ${new Date(period.start).getFullYear()}`;
    }

    return `${new Date(period.start).getFullYear()}`;
  };

  return (
    <Card className={className}>
      <CardContent className="flex flex-col gap-4 p-4 md:p-6">
        {onSportChange && (
          <div>
            <SportSelect selected={sport || null} onChange={onSportChange} />
          </div>
        )}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 md:gap-0">
          <Tabs
            value={type}
            onValueChange={(t) =>
              handleChangeType(t as 'quarter' | 'year' | 'all')
            }
          >
            <TabsList className="w-full md:w-auto">
              <TabsTrigger value="quarter">{m.quarter()}</TabsTrigger>
              <TabsTrigger value="year">{m.year()}</TabsTrigger>
              <TabsTrigger value="all" disabled={!firstActivityDate}>
                {m.since_beginning()}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex gap-2 items-center justify-between md:justify-end">
            {type !== 'all' && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleOffset('prev')}
                >
                  <ChevronLeft />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleOffset('next')}
                  disabled={offset >= 0}
                >
                  <ChevronRight />
                </Button>
              </div>
            )}
            <Badge className="text-xs md:text-sm">{formatPeriodLabel()}</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
