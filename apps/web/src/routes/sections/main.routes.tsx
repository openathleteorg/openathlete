import { CompactLayout } from '@/components/layouts';
import { LoadingScreen } from '@/components/loading-screen';
import { Suspense, lazy } from 'react';
import { Outlet, RouteObject } from 'react-router-dom';

const Page500 = lazy(() => import('@/pages/500'));
const Page403 = lazy(() => import('@/pages/403'));
const Page404 = lazy(() => import('@/pages/404'));
const PrivacyPolicyPage = lazy(() => import('@/pages/privacy-policy'));
const LegalNoticePage = lazy(() => import('@/pages/legal-notice'));

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
      { path: 'privacy-policy', element: <PrivacyPolicyPage /> },
      { path: 'legal-notice', element: <LegalNoticePage /> },
    ],
  },
];
