import { cn } from '@/utils/shadcn';

import { CycleSegment } from './utils/cycle-layout';

interface P {
  segment: CycleSegment;
}

export function CalendarCycle({ segment }: P) {
  const { cycle, startDayIndex, durationDays, row } = segment;

  // Calculate position and width
  // Each day column is ~14.28% wide (100% / 7 days)
  const leftPercent = (startDayIndex / 7) * 100;
  const widthPercent = (durationDays / 7) * 100;

  // Each row is 24px tall with 2px gap
  const topPx = row * 26; // 24px height + 2px gap

  const backgroundColor = cycle.color || '#3b82f6';

  return (
    <div
      className={cn(
        'absolute h-6 rounded-md px-2 text-xs font-semibold text-white flex items-center overflow-hidden cursor-pointer',
        'hover:brightness-110 transition-all select-none shadow-sm',
      )}
      style={{
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
        top: `${topPx}px`,
        backgroundColor,
      }}
      title={`${cycle.name}${cycle.description ? `\n${cycle.description}` : ''}`}
    >
      <span className="truncate">{cycle.name}</span>
    </div>
  );
}
