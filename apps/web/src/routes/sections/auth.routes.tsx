import { AuthLayout } from '@/components/layouts';
import { LoadingScreen } from '@/components/loading-screen';
import { AuthGuard, GuestGuard } from '@/guards';
import { Suspense, lazy } from 'react';
import { Outlet, RouteObject } from 'react-router-dom';

import { getPath, getPathEnd } from '../paths';

const LoginPage = lazy(() =>
  import('@/pages/auth/login').then((module) => ({
    default: module.LoginPage,
  })),
);

const CreateAccountPage = lazy(() =>
  import('@/pages/auth/create-account').then((module) => ({
    default: module.CreateAccountPage,
  })),
);

const PasswordResetPage = lazy(() =>
  import('@/pages/auth/password-reset').then((module) => ({
    default: module.PasswordResetPage,
  })),
);

const PasswordResetRequestPage = lazy(() =>
  import('@/pages/auth/password-reset-request').then((module) => ({
    default: module.PasswordResetRequestPage,
  })),
);

const OAuthCallbackPage = lazy(() =>
  import('@/pages/auth/oauth-callback').then((module) => ({
    default: module.OAuthCallbackPage,
  })),
);

const OAuthAuthorizePage = lazy(() =>
  import('@/pages/oauth/authorize').then((module) => ({
    default: module.OAuthAuthorizePage,
  })),
);

export const authRoutes: RouteObject[] = [
  {
    path: getPath(['auth']),
    element: (
      <GuestGuard>
        <Suspense fallback={<LoadingScreen />}>
          <Outlet />
        </Suspense>
      </GuestGuard>
    ),
    children: [
      {
        path: getPathEnd(getPath(['auth', 'login'])),
        element: (
          <AuthLayout>
            <LoginPage />
          </AuthLayout>
        ),
      },
      {
        path: getPathEnd(getPath(['auth', 'createAccount'])),
        element: (
          <AuthLayout>
            <CreateAccountPage />
          </AuthLayout>
        ),
      },
      {
        path: getPathEnd(getPath(['auth', 'passwordReset'])),
        element: (
          <AuthLayout>
            <PasswordResetPage />
          </AuthLayout>
        ),
      },
      {
        path: getPathEnd(getPath(['auth', 'passwordResetRequest'])),
        element: (
          <AuthLayout>
            <PasswordResetRequestPage />
          </AuthLayout>
        ),
      },
    ],
  },
  {
    path: getPath(['auth', 'oauth']),
    element: (
      <Suspense fallback={<LoadingScreen />}>
        <OAuthCallbackPage />
      </Suspense>
    ),
  },
  {
    // Signed in first: the guard brings the user back here after login
    path: getPath(['oauth', 'authorize']),
    element: (
      <AuthGuard>
        <AuthLayout>
          <Suspense fallback={<LoadingScreen />}>
            <OAuthAuthorizePage />
          </Suspense>
        </AuthLayout>
      </AuthGuard>
    ),
  },
];
