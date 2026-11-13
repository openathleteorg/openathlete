import { AthleteGroupAPI, athleteGroupKeys, useMyClubsQuery } from '@/api/club';
import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';

import { AthleteGroupDto, isClubStaff } from '@openathlete/shared';

export type GroupFilterOption = {
  value: string;
  label: string;
  /** The group's own name, and the club holding it (null: the coach's own) */
  name: string;
  club: string | null;
  /** The group's athletes and its sub-groups' */
  athleteIds: Set<number>;
};

const optionsOf = (
  groups: AthleteGroupDto[],
  prefix: string | null,
): GroupFilterOption[] => {
  const byId = new Map(groups.map((group) => [group.athleteGroupId, group]));
  return groups.map((group) => {
    const ids = new Set(group.athleteIds);
    for (const child of groups) {
      if (child.parentId !== group.athleteGroupId) continue;
      for (const id of child.athleteIds) ids.add(id);
    }
    const parent =
      group.parentId !== null ? byId.get(group.parentId) : undefined;
    const name = parent ? `${parent.name} › ${group.name}` : group.name;
    return {
      value: `group:${group.athleteGroupId}`,
      label: prefix ? `${prefix} · ${name}` : name,
      name,
      club: prefix,
      athleteIds: ids,
    };
  });
};

/**
 * Every group a coach can filter their athletes by: their own, then those
 * of each club where they are staff, sub-groups under their group.
 */
export function useGroupFilterOptions(): GroupFilterOption[] {
  const { data: clubs } = useMyClubsQuery();
  const staffClubs = (clubs ?? []).filter((club) => isClubStaff(club.role));
  const results = useQueries({
    queries: [
      {
        queryKey: athleteGroupKeys.list(null),
        queryFn: () => AthleteGroupAPI.list(),
      },
      ...staffClubs.map((club) => ({
        queryKey: athleteGroupKeys.list(club.clubId),
        queryFn: () => AthleteGroupAPI.list(club.clubId),
      })),
    ],
  });

  const data = results.map((result) => result.data);
  return useMemo(
    () => {
      const sorted = (groups: AthleteGroupDto[] | undefined) =>
        [...(groups ?? [])].sort((a, b) => {
          const key = (group: AthleteGroupDto) =>
            group.parentId ?? group.athleteGroupId;
          return key(a) - key(b) || (a.parentId ?? 0) - (b.parentId ?? 0);
        });
      return [
        ...optionsOf(sorted(data[0]), null),
        ...staffClubs.flatMap((club, index) =>
          optionsOf(sorted(data[index + 1]), club.name),
        ),
      ];
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(data), JSON.stringify(staffClubs)],
  );
}
