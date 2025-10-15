import { PATH_AFTER_LOGIN } from '@/config';
import { Navigate, createBrowserRouter } from 'react-router-dom';

import { authRoutes } from './auth.routes';
import { dashboardRoutes } from './dashboard.routes';
import { mainRoutes } from './main.routes';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to={PATH_AFTER_LOGIN} replace />,
  },

  ...authRoutes,
  ...dashboardRoutes,
  ...mainRoutes,

  // No match 404
  { path: '*', element: <Navigate to="/404" replace /> },
]);

export default router;
