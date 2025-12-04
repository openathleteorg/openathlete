import { HomeRedirect } from '@/components/home-redirect';
import { Navigate, createBrowserRouter } from 'react-router-dom';

import { authRoutes } from './auth.routes';
import { dashboardRoutes } from './dashboard.routes';
import { mainRoutes } from './main.routes';

/**
 * Root component that shows landing page on web, or redirects on Capacitor
 */
// eslint-disable-next-line react-refresh/only-export-components
function RootElement() {
  return <HomeRedirect />;
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
