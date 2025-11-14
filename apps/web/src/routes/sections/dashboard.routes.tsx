import { DashboardLayout } from '@/components/layouts';
import { LoadingScreen } from '@/components/loading-screen';
import { AuthGuard } from '@/guards';
import { SettingsPage } from '@/pages/dashboard/settings';
import { SummaryPage } from '@/pages/dashboard/summary/athlete';
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

const StatisticsPage = lazy(() =>
  import('@/pages/dashboard/statistics').then((module) => ({
    default: module.StatisticsPage,
  })),
);

const RecordsPage = lazy(() =>
  import('@/pages/dashboard/records').then((module) => ({
    default: module.RecordsPage,
  })),
);

const MetricsPage = lazy(() =>
  import('@/pages/dashboard/metrics').then((module) => ({
    default: module.MetricsPage,
  })),
);

const AthleteStatisticsPage = lazy(() =>
  import('@/pages/dashboard/statistics/athlete').then((module) => ({
    default: module.AthleteStatisticsPage,
  })),
);

const AthleteRecordsPage = lazy(() =>
  import('@/pages/dashboard/records/athlete').then((module) => ({
    default: module.AthleteRecordsPage,
  })),
);

const AthleteMetricsPage = lazy(() =>
  import('@/pages/dashboard/metrics/athlete').then((module) => ({
    default: module.AthleteMetricsPage,
  })),
);

const AthleteSettingsPage = lazy(() =>
  import('@/pages/dashboard/settings/athlete').then((module) => ({
    default: module.AthleteSettingsPage,
  })),
);

const RacePlanViewerPage = lazy(() =>
  import('@/pages/dashboard/race-plan/viewer').then((module) => ({
    default: module.RacePlanViewerPage,
  })),
);

const MessagesPage = lazy(() =>
  import('@/pages/dashboard/messages').then((module) => ({
    default: module.MessagesPage,
  })),
);

const ProfilePage = lazy(() =>
  import('@/pages/dashboard/profile').then((module) => ({
    default: module.ProfilePage,
  })),
);

const CoachDashboardPage = lazy(() =>
  import('@/pages/dashboard/coach').then((module) => ({
    default: module.CoachDashboardPage,
  })),
);

const OnboardingPage = lazy(() =>
  import('@/pages/dashboard/onboarding').then((module) => ({
    default: module.OnboardingPage,
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
        path: getPath(['dashboard', 'coach']),
        element: <CoachDashboardPage />,
      },
      {
        path: getPath(['dashboard', 'onboarding']),
        element: <OnboardingPage />,
      },
      {
        path: getPath(['dashboard', 'calendar']),
        element: <CalendarPage />,
      },
      {
        path: getPath(['dashboard', 'calendar', 'athleteId']),
        element: <AthleteCalendarPage />,
      },
      {
        path: getPath(['dashboard', 'summary', 'athleteId']),
        element: <SummaryPage />,
      },
      {
        path: getPath(['dashboard', 'statistics']),
        element: <StatisticsPage />,
      },
      {
        path: getPath(['dashboard', 'statistics', 'athleteId']),
        element: <AthleteStatisticsPage />,
      },
      {
        path: getPath(['dashboard', 'records']),
        element: <RecordsPage />,
      },
      {
        path: getPath(['dashboard', 'records', 'athleteId']),
        element: <AthleteRecordsPage />,
      },
      {
        path: getPath(['dashboard', 'metrics']),
        element: <MetricsPage />,
      },
      {
        path: getPath(['dashboard', 'metrics', 'athleteId']),
        element: <AthleteMetricsPage />,
      },
      {
        path: getPath(['dashboard', 'settings']),
        element: <SettingsPage />,
      },
      {
        path: getPath(['dashboard', 'settings', 'athleteId']),
        element: <AthleteSettingsPage />,
      },
      {
        path: getPath(['dashboard', 'racePlan', 'viewer']),
        element: <RacePlanViewerPage />,
      },
      {
        path: getPath(['dashboard', 'messages']),
        element: <MessagesPage />,
      },
      {
        path: getPath(['dashboard', 'profile']),
        element: <ProfilePage />,
      },
    ],
  },
];
