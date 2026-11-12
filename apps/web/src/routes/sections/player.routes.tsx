import { LoadingScreen } from '@/components/loading-screen';
import { AuthGuard } from '@/guards';
import { Suspense, lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

import { PLAYER_PATH } from '../paths';

const PlayerPage = lazy(() =>
  import('@/pages/player').then((module) => ({ default: module.PlayerPage })),
);

/** The session player takes the whole screen: no navigation around it */
export const playerRoutes: RouteObject[] = [
  {
    path: PLAYER_PATH,
    element: (
      <AuthGuard>
        <Suspense fallback={<LoadingScreen />}>
          <PlayerPage />
        </Suspense>
      </AuthGuard>
    ),
  },
];
