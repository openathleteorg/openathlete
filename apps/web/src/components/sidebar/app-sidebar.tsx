import logoDarkSrc from '@/assets/logos/logo_dark.svg';
import logoWhiteSrc from '@/assets/logos/logo_white.svg';
import { NavMain } from '@/components/sidebar/nav-main';
import { NavUser } from '@/components/sidebar/nav-user';
import { SpaceSwitcher } from '@/components/sidebar/space-switcher';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { useSpaceContext } from '@/contexts/space';
import { m } from '@/paraglide/messages';
import { getPath } from '@/routes/paths';
import { useGetMyCoachedAthletesQuery } from '@/services/athlete';
import {
  Activity,
  Calendar,
  CogIcon,
  FileText,
  MedalIcon,
  PieChart,
  User,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { ComponentProps, useMemo } from 'react';

import { UserRole } from '@openathlete/shared';

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  const { space } = useSpaceContext();
  const { data: athletes } = useGetMyCoachedAthletesQuery();
  const { theme } = useTheme();

  const sidebarNavigation = useMemo(() => {
    if (space === 'COACH') {
      return (
        athletes?.map((athlete) => ({
          title: athlete.user?.firstName + ' ' + athlete.user?.lastName,
          icon: User,
          spaces: ['COACH'] as UserRole[],
          items: [
            {
              title: m.summary(),
              url: getPath(['dashboard', 'summary']) + `/${athlete.athleteId}`,
              icon: FileText,
            },
            {
              title: m.calendar(),
              url: getPath(['dashboard', 'calendar']) + `/${athlete.athleteId}`,
              icon: Calendar,
            },
            {
              title: m.statistics(),
              url:
                getPath(['dashboard', 'statistics']) + `/${athlete.athleteId}`,
              icon: PieChart,
            },
            {
              title: m.records(),
              url: getPath(['dashboard', 'records']) + `/${athlete.athleteId}`,
              icon: MedalIcon,
            },
            {
              title: m.metrics(),
              url: getPath(['dashboard', 'metrics']) + `/${athlete.athleteId}`,
              icon: Activity,
            },
            {
              title: m.settings(),
              url: getPath(['dashboard', 'settings']) + `/${athlete.athleteId}`,
              icon: CogIcon,
            },
          ],
        })) || []
      );
    }

    return [
      {
        title: m.calendar(),
        url: getPath(['dashboard', 'calendar']),
        icon: Calendar,
        spaces: ['ATHLETE'] as UserRole[],
      },
      {
        title: m.statistics(),
        url: getPath(['dashboard', 'statistics']),
        icon: PieChart,
        spaces: ['ATHLETE'] as UserRole[],
      },
      {
        title: m.records(),
        url: getPath(['dashboard', 'records']),
        icon: MedalIcon,
        spaces: ['ATHLETE'] as UserRole[],
      },
      {
        title: m.metrics(),
        url: getPath(['dashboard', 'metrics']),
        icon: Activity,
        spaces: ['ATHLETE'] as UserRole[],
      },
    ];
  }, [athletes, space]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2 px-0.5 py-1 w-full">
          <a
            href={getPath(['dashboard'])}
            className="flex items-center justify-center gap-2 w-full"
          >
            <img
              src={theme === 'dark' ? logoWhiteSrc : logoDarkSrc}
              alt="OpenAthlete Logo"
              className="h-10 w-10"
            />
          </a>
        </div>
        <SpaceSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarNavigation} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
