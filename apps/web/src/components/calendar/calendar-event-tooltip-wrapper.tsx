import { Tooltip, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils/shadcn';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { Event } from '@openathlete/shared';

import { CalendarEventTooltipContent } from './calendar-event-tooltip';

interface CalendarEventTooltipWrapperProps {
  event: Event;
  children: React.ReactNode;
  disabled?: boolean;
}

export function CalendarEventTooltipWrapper({
  event,
  children,
  disabled = false,
}: CalendarEventTooltipWrapperProps) {
  return (
    <Tooltip open={disabled ? false : undefined}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side="top"
          align="start"
          sideOffset={8}
          className={cn(
            'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg p-4 max-w-sm z-50 min-w-64 pointer-events-none',
            'text-gray-900 dark:text-gray-100',
            'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 rounded-md',
          )}
          collisionPadding={16}
          avoidCollisions={true}
          alignOffset={-8}
        >
          <CalendarEventTooltipContent event={event} />
          <TooltipPrimitive.Arrow
            className={cn(
              'fill-white dark:fill-gray-900 pointer-events-none',
              'stroke-gray-200 dark:stroke-gray-700',
              'z-50 size-2',
            )}
            style={{
              strokeWidth: 1,
            }}
          />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </Tooltip>
  );
}
