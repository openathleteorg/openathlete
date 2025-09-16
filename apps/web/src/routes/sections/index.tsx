import { LoadingScreen } from '@/components/loading-screen';
import { PATH_AFTER_LOGIN } from '@/config';
import { useAuthContext } from '@/contexts/auth';
import { AppLayout as MarketingLayout } from '@/marketing/components/layout/app-layout';
import { Suspense, lazy } from 'react';
import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom';

import { authRoutes } from './auth.routes';
import { dashboardRoutes } from './dashboard.routes';
import { mainRoutes } from './main.routes';

const MarketingHome = lazy(() => import('@/marketing/pages'));
const MarketingServices = lazy(() => import('@/marketing/pages/services'));
const MarketingAbout = lazy(() => import('@/marketing/pages/about'));
const MarketingContact = lazy(() => import('@/marketing/pages/contact'));

// Wrapper to decide root landing page based on auth (runtime hook not directly usable in route object), using a component.
function RootRedirect() {
  try {
    // Hook usage inside component
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { user } = useAuthContext();
    if (user) return <Navigate to={PATH_AFTER_LOGIN} replace />;
  } catch (_) {
    // Fallback no auth provider yet
  }
  return (
    <MarketingLayout>
      <Suspense fallback={<LoadingScreen />}>
        <MarketingHome />
      </Suspense>
    </MarketingLayout>
  );
}

const router = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },
  {
    element: (
      <MarketingLayout>
        <Suspense fallback={<LoadingScreen />}>
          <Outlet />
        </Suspense>
      </MarketingLayout>
    ),
    children: [
      { path: '/services', element: <MarketingServices /> },
      { path: '/about', element: <MarketingAbout /> },
      { path: '/contact', element: <MarketingContact /> },
    ],
  },

  ...authRoutes,
  ...dashboardRoutes,
  ...mainRoutes,

  // No match 404
  { path: '*', element: <Navigate to="/404" replace /> },
]);

export default router;
