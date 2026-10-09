import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { Settings2 } from 'lucide-react';

import { CalendarDisplay } from '@openathlete/shared';

import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { useCalendarContext } from './hooks/use-calendar-context';

type CardField = keyof CalendarDisplay['card'];
type SummaryField = keyof CalendarDisplay['summary'];

const CARD_FIELDS: { key: CardField; label: () => string }[] = [
  { key: 'profile', label: m.calendar_display_profile },
  { key: 'duration', label: m.duration },
  { key: 'distance', label: m.distance },
  { key: 'elevation', label: m.elevation_gain },
  { key: 'load', label: m.calendar_display_load },
];

const SUMMARY_FIELDS: { key: SummaryField; label: () => string }[] = [
  { key: 'duration', label: m.duration },
  { key: 'distance', label: m.distance },
  { key: 'elevation', label: m.elevation_gain },
  { key: 'load', label: m.calendar_display_load },
  { key: 'form', label: m.calendar_week_form },
];

function Field({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex min-h-8 items-center gap-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onChange(value === true)}
      />
      <Label htmlFor={id} className="font-normal">
        {label}
      </Label>
    </div>
  );
}

/** What cards and week summaries show, saved with the account */
export function CalendarDisplaySettings() {
  const { display, updateDisplay } = useCalendarContext();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={m.calendar_display_title()}
          title={m.calendar_display_title()}
          className="text-muted-foreground"
        >
          <Settings2 className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        // Scrolls on short screens rather than running off them
        className="max-h-(--radix-popover-content-available-height) w-72 space-y-4 overflow-y-auto"
        data-calendar-display-settings
      >
        <p className="text-sm font-semibold">{m.calendar_display_title()}</p>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            {m.calendar_display_density()}
          </p>
          <div
            role="radiogroup"
            aria-label={m.calendar_display_density()}
            className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1"
          >
            {(['compact', 'comfortable'] as const).map((density) => (
              <button
                key={density}
                type="button"
                role="radio"
                aria-checked={display.density === density}
                onClick={() =>
                  updateDisplay((current) => ({ ...current, density }))
                }
                className={cn(
                  'rounded-sm px-2 py-1.5 text-sm transition-colors',
                  display.density === density
                    ? 'bg-background font-medium shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {density === 'compact'
                  ? m.calendar_display_compact()
                  : m.calendar_display_comfortable()}
              </button>
            ))}
          </div>
        </div>

        <fieldset className="space-y-1">
          <legend className="mb-1 text-xs font-medium text-muted-foreground">
            {m.calendar_display_cards()}
          </legend>
          {CARD_FIELDS.map(({ key, label }) => (
            <Field
              key={key}
              id={`calendar-card-${key}`}
              label={label()}
              checked={display.card[key]}
              onChange={(checked) =>
                updateDisplay((current) => ({
                  ...current,
                  card: { ...current.card, [key]: checked },
                }))
              }
            />
          ))}
        </fieldset>

        <fieldset className="space-y-1">
          <legend className="mb-1 text-xs font-medium text-muted-foreground">
            {m.calendar_display_summary()}
          </legend>
          {SUMMARY_FIELDS.map(({ key, label }) => (
            <Field
              key={key}
              id={`calendar-summary-${key}`}
              label={label()}
              checked={display.summary[key]}
              onChange={(checked) =>
                updateDisplay((current) => ({
                  ...current,
                  summary: { ...current.summary, [key]: checked },
                }))
              }
            />
          ))}
        </fieldset>

        <fieldset className="space-y-1">
          <legend className="mb-1 text-xs font-medium text-muted-foreground">
            {m.calendar_display_days()}
          </legend>
          <Field
            id="calendar-wellness"
            label={m.calendar_display_wellness()}
            checked={display.wellness}
            onChange={(wellness) =>
              updateDisplay((current) => ({ ...current, wellness }))
            }
          />
        </fieldset>
      </PopoverContent>
    </Popover>
  );
}
