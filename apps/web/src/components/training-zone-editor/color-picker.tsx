import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/utils/shadcn';
import { Check } from 'lucide-react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

// Predefined colors from Tailwind CSS variables
const PRESET_COLORS = [
  { name: 'Gray', value: '#9CA3AF' }, // gray-400
  { name: 'Slate', value: '#64748B' }, // slate-500
  { name: 'Green', value: '#22C55E' }, // green-500
  { name: 'Emerald', value: '#10B981' }, // emerald-500
  { name: 'Teal', value: '#14B8A6' }, // teal-500
  { name: 'Cyan', value: '#06B6D4' }, // cyan-500
  { name: 'Blue', value: '#3B82F6' }, // blue-500
  { name: 'Indigo', value: '#6366F1' }, // indigo-500
  { name: 'Violet', value: '#8B5CF6' }, // violet-500
  { name: 'Purple', value: '#A855F7' }, // purple-500
  { name: 'Fuchsia', value: '#D946EF' }, // fuchsia-500
  { name: 'Pink', value: '#EC4899' }, // pink-500
  { name: 'Rose', value: '#F43F5E' }, // rose-500
  { name: 'Red', value: '#EF4444' }, // red-500
  { name: 'Orange', value: '#F97316' }, // orange-500
  { name: 'Amber', value: '#F59E0B' }, // amber-500
  { name: 'Yellow', value: '#EAB308' }, // yellow-500
  { name: 'Lime', value: '#84CC16' }, // lime-500
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
