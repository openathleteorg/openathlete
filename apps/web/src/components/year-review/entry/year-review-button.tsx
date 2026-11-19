import { useSidebar } from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { ChevronRight } from 'lucide-react';

import { BrandLogoLayers } from '../brand-logo-layers';
import { preloadYearReviewStory } from '../load-story';
import { useYearReviewContext } from '../year-review-context';
import './year-review-entry.css';

/**
 * The way back into the year review while it is out: a line of the sidebar
 * on a computer, a card of the Today screen on a phone.
 */
export function YearReviewButton({ variant }: { variant: 'sidebar' | 'card' }) {
  const { available, year, seen, open } = useYearReviewContext();
  const sidebar = useSidebar();
  if (!available || year === null) return null;

  const label = m.year_review_entry({ year });
  const collapsed = variant === 'sidebar' && sidebar.state === 'collapsed';

  const button = (
    <button
      type="button"
      onClick={(event) => open(event.currentTarget)}
      onPointerEnter={preloadYearReviewStory}
      onFocus={preloadYearReviewStory}
      aria-label={collapsed ? label : undefined}
      data-year-review-entry={variant}
      className={cn(
        'yr-entry flex w-full items-center text-left transition-transform active:scale-[0.98]',
        variant === 'sidebar' &&
          (collapsed
            ? 'size-8 justify-center rounded-md'
            : 'h-11 gap-2.5 rounded-lg px-3'),
        variant === 'card' && 'min-h-18 gap-3.5 rounded-2xl p-4',
      )}
    >
      <BrandLogoLayers
        className={cn(
          'yr-entry-logo relative z-[2] shrink-0',
          variant === 'card' ? 'w-10' : collapsed ? 'w-5' : 'w-6',
        )}
      />
      {!collapsed && (
        <span className="relative z-[2] min-w-0 flex-1">
          <span
            className={cn(
              'yr-entry-text block truncate font-semibold',
              variant === 'card' ? 'text-base' : 'text-sm',
            )}
          >
            {label}
          </span>
          {variant === 'card' && (
            <span className="block text-sm text-oa-muted">
              {seen ? m.year_review_entry_again() : m.year_review_entry_new()}
            </span>
          )}
        </span>
      )}
      {variant === 'card' && (
        <ChevronRight className="relative z-[2] size-4 shrink-0 text-oa-muted" />
      )}
    </button>
  );

  if (!collapsed) return button;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}
