import { HomeRedirect } from '@/components/home-redirect';
import { CompactLayout } from '@/components/layouts';
import { LoadingScreen } from '@/components/loading-screen';
import { isCapacitor } from '@/utils/capacitor';
import { Suspense, lazy } from 'react';
import { Navigate, createBrowserRouter } from 'react-router-dom';

import { authRoutes } from './auth.routes';
import { dashboardRoutes } from './dashboard.routes';
import { mainRoutes } from './main.routes';

const LandingPage = lazy(() => import('@/pages/landing'));

/**
 * Root component that shows landing page on web, or redirects on Capacitor
 */
// eslint-disable-next-line react-refresh/only-export-components
function RootElement() {
  if (isCapacitor()) {
    // In Capacitor, redirect to dashboard/login
    return <HomeRedirect />;
  }
  // On web, show landing page
  return (
    <CompactLayout>
      <Suspense fallback={<LoadingScreen />}>
        <LandingPage />
      </Suspense>
    </CompactLayout>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootElement />,
  },

  ...authRoutes,
  ...dashboardRoutes,
  ...mainRoutes,

  // No match 404
  { path: '*', element: <Navigate to="/404" replace /> },
]);

export default router;
