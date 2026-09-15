import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { Check } from 'lucide-react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

// Predefined colors from Tailwind CSS variables
const PRESET_COLORS = [
  { name: m.color_gray(), value: '#9CA3AF' }, // gray-400
  { name: m.color_slate(), value: '#64748B' }, // slate-500
  { name: m.color_green(), value: '#22C55E' }, // green-500
  { name: m.color_emerald(), value: '#10B981' }, // emerald-500
  { name: m.color_teal(), value: '#14B8A6' }, // teal-500
  { name: m.color_cyan(), value: '#06B6D4' }, // cyan-500
  { name: m.color_blue(), value: '#3B82F6' }, // blue-500
  { name: m.color_indigo(), value: '#6366F1' }, // indigo-500
  { name: m.color_violet(), value: '#8B5CF6' }, // violet-500
  { name: m.color_purple(), value: '#A855F7' }, // purple-500
  { name: m.color_fuchsia(), value: '#D946EF' }, // fuchsia-500
  { name: m.color_pink(), value: '#EC4899' }, // pink-500
  { name: m.color_rose(), value: '#F43F5E' }, // rose-500
  { name: m.color_red(), value: '#EF4444' }, // red-500
  { name: m.color_orange(), value: '#F97316' }, // orange-500
  { name: m.color_amber(), value: '#F59E0B' }, // amber-500
  { name: m.color_yellow(), value: '#EAB308' }, // yellow-500
  { name: m.color_lime(), value: '#84CC16' }, // lime-500
];

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start gap-2 h-10"
          type="button"
        >
          <div
            className="w-6 h-6 rounded border"
            style={{ backgroundColor: value }}
          />
          <span className="text-sm font-mono">{value}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="grid grid-cols-6 gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color.value}
              type="button"
              className={cn(
                'w-8 h-8 rounded border-2 relative hover:scale-110 transition-transform',
                value === color.value
                  ? 'border-foreground'
                  : 'border-transparent',
              )}
              style={{ backgroundColor: color.value }}
              onClick={() => onChange(color.value)}
              title={color.name}
            >
              {value === color.value && (
                <Check className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow-lg" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
