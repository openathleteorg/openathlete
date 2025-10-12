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
import { Activity, Calendar, MedalIcon, PieChart } from 'lucide-react';
import { ComponentProps, useMemo } from 'react';

import { UserRole } from '@openathlete/shared';

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  const { space } = useSpaceContext();
  const { data: athletes } = useGetMyCoachedAthletesQuery();

  const sidebarNavigation = useMemo(
    () => [
      space === 'COACH'
        ? {
            title: m.calendar(),
            icon: Calendar,
            spaces: ['ATHLETE', 'COACH'] as UserRole[],
            items: [
              {
                title: m.my_athletes(),
                url: getPath(['dashboard', 'calendar']),
              },
              ...(athletes?.map((athlete) => ({
                title: athlete.user?.firstName + ' ' + athlete.user?.lastName,
                url:
                  getPath(['dashboard', 'calendar']) + `/${athlete.athleteId}`,
              })) || []),
            ],
          }
        : {
            title: m.calendar(),
            url: getPath(['dashboard', 'calendar']),
            icon: Calendar,
            spaces: ['ATHLETE', 'COACH'] as UserRole[],
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
    ],
    [athletes, space],
  );

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
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
