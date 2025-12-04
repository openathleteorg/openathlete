import { CompactLayout } from '@/components/layouts';
import { LoadingScreen } from '@/components/loading-screen';
import { Suspense, lazy } from 'react';
import { Outlet, RouteObject } from 'react-router-dom';

const Page500 = lazy(() => import('@/pages/500'));
const Page403 = lazy(() => import('@/pages/403'));
const Page404 = lazy(() => import('@/pages/404'));

export const mainRoutes: RouteObject[] = [
  {
    element: (
      <CompactLayout>
        <Suspense fallback={<LoadingScreen />}>
          <Outlet />
        </Suspense>
      </CompactLayout>
    ),
    children: [
      { path: '500', element: <Page500 /> },
      { path: '404', element: <Page404 /> },
      { path: '403', element: <Page403 /> },
    ],
  },
];
