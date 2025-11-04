import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { CompactLayout } from '@/components/layouts';
import { LoadingScreen } from '@/components/loading-screen';

const LandingPage = lazy(() => import('@/pages/landing'));

import { authRoutes } from './auth.routes';
import { dashboardRoutes } from './dashboard.routes';
import { mainRoutes } from './main.routes';

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <CompactLayout>
        <Suspense fallback={<LoadingScreen />}>
          <LandingPage />
        </Suspense>
      </CompactLayout>
    ),
  },

  ...authRoutes,
  ...dashboardRoutes,
  ...mainRoutes,

  // No match 404
  { path: '*', element: <Navigate to="/404" replace /> },
]);

export default router;
