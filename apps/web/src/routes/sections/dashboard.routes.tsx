import { DashboardLayout } from '@/components/layouts';
import { LoadingScreen } from '@/components/loading-screen';
import { AuthGuard } from '@/guards';
import { RecordsPage } from '@/pages/dashboard/records';
import { SettingsPage } from '@/pages/dashboard/settings';
import { StatisticsPage } from '@/pages/dashboard/statistics';
import { Suspense, lazy } from 'react';
import { Outlet, RouteObject } from 'react-router-dom';

import { getPath } from '../paths';

const IndexPage = lazy(() =>
  import('@/pages/dashboard').then((module) => ({
    default: module.DashboardPage,
  })),
);

const CalendarPage = lazy(() =>
  import('@/pages/dashboard/calendar').then((module) => ({
    default: module.CalendarPage,
  })),
);

const AthleteCalendarPage = lazy(() =>
  import('@/pages/dashboard/calendar/athlete').then((module) => ({
    default: module.AthleteCalendarPage,
  })),
);

const RacePlanViewerPage = lazy(() =>
  import('@/pages/dashboard/race-plan/viewer').then((module) => ({
    default: module.RacePlanViewerPage,
  })),
);

export const dashboardRoutes: RouteObject[] = [
  {
    path: getPath(['dashboard']),
    element: (
      <AuthGuard>
        <DashboardLayout>
          <Suspense fallback={<LoadingScreen />}>
            <Outlet />
          </Suspense>
        </DashboardLayout>
      </AuthGuard>
    ),
    children: [
      { element: <IndexPage />, index: true },
      {
        path: getPath(['dashboard', 'calendar']),
        element: <CalendarPage />,
      },
      {
        path: getPath(['dashboard', 'calendar', 'athleteId']),
        element: <AthleteCalendarPage />,
      },
      {
        path: getPath(['dashboard', 'statistics']),
        element: <StatisticsPage />,
      },
      {
        path: getPath(['dashboard', 'records']),
        element: <RecordsPage />,
      },
      {
        path: getPath(['dashboard', 'settings']),
        element: <SettingsPage />,
      },
      {
        path: getPath(['dashboard', 'racePlan', 'viewer']),
        element: <RacePlanViewerPage />,
      },
    ],
  },
];
