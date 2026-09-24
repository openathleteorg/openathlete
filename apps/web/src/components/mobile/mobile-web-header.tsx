import { useGetMyCoachedAthletesQuery } from '@/api/athlete';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { useSpaceContext } from '@/contexts/space';
import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import { Menu, Settings } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

/** Navigation for small browser windows. Native and desktop layouts stay separate. */
export function MobileWebHeader() {
  const { pathname, search } = useLocation();
  const { isMobile, openMobile, setOpenMobile } = useSidebar();
  const { space } = useSpaceContext();
  const { data: athletes } = useGetMyCoachedAthletesQuery();
  const section = pathname.split('/')[2];
  const titles: Record<string, string> = {
    calendar: m.calendar(),
    statistics: m.statistics(),
    progression: m.progression(),
    records: m.records(),
    metrics: m.metrics(),
    settings: m.settings(),
    messages: m.messages(),
    profile: m.profile(),
    coach: m.dashboard(),
  };
  const athleteId =
    /^\/dashboard\/(?:calendar|statistics|progression|records|metrics|settings)\/(\d+)$/.exec(
      pathname,
    )?.[1];
  const athlete = athletes?.find(
    (item) => String(item.athleteId) === athleteId,
  );
  const context = athlete
    ? [athlete.user?.firstName, athlete.user?.lastName]
        .filter(Boolean)
        .join(' ')
    : space === 'COACH'
      ? m.coach()
      : m.athlete();

  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, search, isMobile, setOpenMobile]);

  return (
    <header
      data-mobile-web-header
      className="fixed inset-x-0 top-0 z-30 flex h-[calc(4rem+env(safe-area-inset-top))] shrink-0 items-center gap-2 border-b bg-background px-3 py-2 md:hidden"
      style={{ paddingTop: 'calc(0.5rem + env(safe-area-inset-top))' }}
    >
      <Button
        data-mobile-menu-trigger
        variant="ghost"
        size="icon"
        className="size-11 shrink-0"
        aria-label={m.ui_toggle_sidebar()}
        aria-expanded={openMobile}
        onClick={() => setOpenMobile(true)}
      >
        <Menu className="size-6" />
      </Button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold">
          {titles[section] ?? 'OpenAthlete'}
        </p>
        <p className="truncate text-xs text-muted-foreground">{context}</p>
      </div>
      <Button asChild variant="ghost" size="icon" className="size-11 shrink-0">
        <Link to={getPath(['dashboard', 'settings'])} aria-label={m.settings()}>
          <Settings className="size-5" />
        </Link>
      </Button>
    </header>
  );
}
