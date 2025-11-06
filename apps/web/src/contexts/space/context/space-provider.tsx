/* eslint-disable no-console */
import { getPath } from '@/routes/paths';
import { CURRENT_SPACE, getItem, setItem } from '@/utils/local-storage';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { UserRole } from '@openathlete/shared';

import { SpaceContextType } from '../types';
import { SpaceContext } from './space-context';

type Props = {
  children: React.ReactNode;
};

export function SpaceProvider({ children }: Props) {
  const [currentSpace, setCurrentSpace] = useState<UserRole>(() => {
    const storedSpace = getItem(CURRENT_SPACE);
    return storedSpace ? (storedSpace as UserRole) : 'ATHLETE';
  });
  const nav = useNavigate();

  const handleSpaceChange = (space: UserRole) => {
    setCurrentSpace(space);
    setItem(CURRENT_SPACE, space);
    if (space === 'COACH') {
      nav(getPath(['dashboard', 'coach']));
    } else {
      nav(getPath(['dashboard', 'calendar']));
    }
  };

  const memoizedValue = useMemo<SpaceContextType>(
    () => ({
      space: currentSpace,
      setSpace: handleSpaceChange,
    }),
    [currentSpace],
  );

  return (
    <SpaceContext.Provider value={memoizedValue}>
      {children}
    </SpaceContext.Provider>
  );
}
