import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { ChevronDown, Trash2 } from 'lucide-react';
import { ReactNode, useState } from 'react';

import { ColorPicker } from './color-picker';
import { ZoneDraft, formatPace, parsePace } from './zone-profiles';

const limitClass = 'h-9 w-[4.25rem] px-2 text-right tabular-nums max-md:h-11';

/** Typed as 5:30; half-typed text stays in the field until it reads as a pace. */
function PaceInput({
  id,
  value,
  label,
  invalid,
  onChange,
}: {
  id: string;
  value: number;
  label: string;
  invalid: boolean;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <Input
      id={id}
      aria-label={label}
      aria-invalid={invalid}
      inputMode="text"
      placeholder="m:ss"
      className={limitClass}
      value={draft ?? formatPace(value)}
      onChange={(event) => {
        setDraft(event.target.value);
        const pace = parsePace(event.target.value);
        if (pace !== null) onChange(pace);
      }}
      onBlur={() => setDraft(null)}
    />
  );
}

interface ZoneRowProps {
  zone: ZoneDraft;
  index: number;
  /** What the zone starts from, which only the first zone sets */
  startField: 'min' | 'max';
  isPace: boolean;
  isPercentage: boolean;
  unit: string;
  invalid: boolean;
  openEnded: boolean;
  preview?: ReactNode;
  canRemove: boolean;
  onLimit: (field: 'min' | 'max', value: number) => void;
  onChange: (change: Partial<ZoneDraft>) => void;
  onRemove: () => void;
}

/**
 * A zone at a glance: where it ends. It starts where the previous one ended, so
 * there is one limit to think about; the rest is folded.
 */
export function ZoneRow({
  zone,
  index,
  startField,
  isPace,
  isPercentage,
  unit,
  invalid,
  openEnded,
  preview,
  canRemove,
  onLimit,
  onChange,
  onRemove,
}: ZoneRowProps) {
  const [open, setOpen] = useState(false);
  const endField = startField === 'min' ? 'max' : 'min';

  const limit = (field: 'min' | 'max', label: string) =>
    isPace ? (
      <PaceInput
        id={`zone-${index}-${field}`}
        value={zone[field]}
        label={`${zone.name} ${label}`}
        invalid={invalid}
        onChange={(value) => onLimit(field, value)}
      />
    ) : (
      <Input
        id={`zone-${index}-${field}`}
        aria-label={`${zone.name} ${label}`}
        aria-invalid={invalid}
        type="number"
        inputMode="decimal"
        step={isPercentage ? 0.01 : 1}
        min={0}
        max={isPercentage ? 100 : undefined}
        className={limitClass}
        placeholder={openEnded ? m.maximum_or_more() : undefined}
        value={Number.isNaN(zone[field]) ? '' : zone[field]}
        onChange={(event) => onLimit(field, parseFloat(event.target.value))}
      />
    );

  return (
    <div data-zone-row className="px-3 py-2">
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="size-3 shrink-0 rounded-full border"
          style={{ backgroundColor: zone.color }}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{zone.name}</p>
          {zone.description && !preview && (
            <p className="truncate text-xs text-muted-foreground">
              {zone.description}
            </p>
          )}
          {preview}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {index === 0 ? (
            limit(startField, m.minimum())
          ) : (
            <span className="w-11 text-right text-sm text-muted-foreground tabular-nums">
              {isPace ? formatPace(zone[startField]) : zone[startField]}
            </span>
          )}
          <span aria-hidden className="text-muted-foreground">
            –
          </span>
          {limit(endField, m.maximum())}
          <span className="hidden w-12 text-xs text-muted-foreground sm:block">
            {unit}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 max-md:size-11"
          aria-expanded={open}
          aria-label={`${m.zones_customize()} ${zone.name}`}
          onClick={() => setOpen(!open)}
        >
          <ChevronDown
            className={cn('size-4 transition-transform', open && 'rotate-180')}
          />
        </Button>
      </div>
      {open && (
        <div className="grid gap-3 pt-3 pb-1 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={`zone-${index}-name`}>{m.name()}</Label>
            <Input
              id={`zone-${index}-name`}
              value={zone.name}
              placeholder={m.zone_name()}
              onChange={(event) => onChange({ name: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`zone-${index}-description`}>
              {m.description()}
            </Label>
            <Input
              id={`zone-${index}-description`}
              value={zone.description}
              placeholder={m.optional()}
              onChange={(event) =>
                onChange({ description: event.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>{m.color()}</Label>
            <ColorPicker
              value={zone.color}
              onChange={(color) => onChange({ color })}
            />
          </div>
          {canRemove && (
            <div className="flex items-end justify-end">
              <Button
                type="button"
                variant="ghost"
                className="text-destructive-foreground"
                aria-label={`${m.delete_()} ${zone.name}`}
                onClick={onRemove}
              >
                <Trash2 className="size-4" />
                {m.delete_()}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
