import { useGetMyCoachedAthletesQuery } from '@/api/athlete';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUserRoles } from '@/contexts/auth';
import { useSpaceContext } from '@/contexts/space';
import { m } from '@/paraglide/messages';
import { ChevronsUpDown, Medal, Users } from 'lucide-react';

import { UserRole } from '@openathlete/shared';

export function MobileSpaceSwitcher() {
  const roles = useUserRoles();
  const { space, setSpace } = useSpaceContext();
  const { data: coachedAthletes } = useGetMyCoachedAthletesQuery();

  const spaces =
    roles?.map((role) => {
      switch (role) {
        case 'ATHLETE':
          return {
            role: 'ATHLETE' as UserRole,
            name: m.athlete(),
            logo: Medal,
          };
        case 'COACH':
          return {
            role: 'COACH' as UserRole,
            name: m.coach(),
            logo: Users,
          };
      }
    }) || [];

  const activeSpace = spaces.find((s) => s?.role === space);
  const hasNoAthletes = !coachedAthletes || coachedAthletes.length === 0;

  if (!activeSpace || spaces.length <= 1 || hasNoAthletes) {
    return null;
  }

  const ActiveIcon = activeSpace.logo;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <ActiveIcon className="h-4 w-4" />
            </div>
            <span className="font-medium">{activeSpace.name}</span>
          </div>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-muted-foreground text-xs">
          {m.spaces()}
        </DropdownMenuLabel>
        {spaces.map((spaceOption) => {
          if (!spaceOption) return null;
          const Icon = spaceOption.logo;
          return (
            <DropdownMenuItem
              key={spaceOption.role}
              onClick={() => setSpace(spaceOption.role)}
              className="gap-2"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded border">
                <Icon className="h-4 w-4 shrink-0" />
              </div>
              {spaceOption.name}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
