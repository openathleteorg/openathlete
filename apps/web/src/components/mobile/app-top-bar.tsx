import { useGetMyCoachedAthletesQuery } from '@/api/athlete';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFinder } from '@/contexts/finder';
import { useAppBarConfig } from '@/hooks/use-app-bar';
import { usePageActions } from '@/hooks/use-page-actions';
import { m } from '@/paraglide/messages';
import { cn } from '@/utils/shadcn';
import { ChevronLeft, MoreHorizontal, Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import { coachedAthleteId, screenTitle } from './app-navigation';
import { AppSectionTabs } from './app-section-tabs';

interface P {
  onBack?: () => void;
  scrolled: boolean;
}

/** The title of the screen, its way back, and what can be done from it. */
export function AppTopBar({ onBack, scrolled }: P) {
  const { pathname } = useLocation();
  const config = useAppBarConfig();
  const actions = usePageActions();
  const { openFinder } = useFinder();
  const { data: athletes } = useGetMyCoachedAthletesQuery();
  const athleteId = coachedAthleteId(pathname);
  const athlete = athletes?.find(
    (item) => String(item.athleteId) === athleteId,
  );
  const athleteName = athlete
    ? [athlete.user?.firstName, athlete.user?.lastName]
        .filter(Boolean)
        .join(' ')
    : undefined;
  const title = config.title ?? athleteName ?? screenTitle(pathname);

  return (
    <header
      data-app-top-bar
      className={cn(
        'sticky top-0 z-30 bg-background/85 pt-[var(--safe-top)] backdrop-blur-xl backdrop-saturate-150 transition-[box-shadow]',
        scrolled && 'shadow-[0_1px_0_var(--border)]',
      )}
    >
      <div className="flex h-[var(--top-bar-height)] items-center gap-1 px-2">
        {onBack ? (
          <Button
            variant="ghost"
            size="icon"
            data-app-back
            className="size-11 shrink-0 rounded-full"
            aria-label={m.ui_back()}
            onClick={config.onBack ?? onBack}
          >
            <ChevronLeft className="size-6" />
          </Button>
        ) : (
          <span className="w-2 shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          {config.titleContent ?? (
            <>
              <h1 className="truncate text-[1.0625rem] leading-tight font-semibold tracking-tight">
                {title}
              </h1>
              {config.subtitle && (
                <p className="truncate text-xs text-muted-foreground">
                  {config.subtitle}
                </p>
              )}
            </>
          )}
        </div>
        {config.trailing ??
          (!onBack && (
            <Button
              variant="ghost"
              size="icon"
              data-app-finder
              className="size-11 shrink-0 rounded-full"
              aria-label={m.finder_open()}
              onClick={openFinder}
            >
              <Search className="size-5" />
            </Button>
          ))}
        {actions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-11 shrink-0 rounded-full"
                aria-label={m.ui_page_actions()}
              >
                <MoreHorizontal className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {actions.map((action) => (
                <DropdownMenuItem
                  key={action.label}
                  onClick={action.onClick}
                  variant={
                    action.variant === 'destructive' ? 'destructive' : 'default'
                  }
                >
                  {action.icon && <action.icon className="size-5" />}
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <AppSectionTabs />
    </header>
  );
}
