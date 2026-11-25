import { UserAPI } from '@/api/user';
import { getPath } from '@/routes/paths';
import { getAccessToken } from '@/utils/auth';
import {
  type AuthAttempt,
  captureAuthAttempt,
  clearAuthTokens,
  isAuthAttemptCurrent,
} from '@/utils/auth-attempt';
import { isNetworkError } from '@/utils/axios';
import { signOutFirebase } from '@/utils/firebase-auth';
import { saveLanguageChoice } from '@/utils/language-choice';
import { clear } from '@/utils/local-storage';
import { initializePushNotifications } from '@/utils/push-notifications';
import { queryClient } from '@/utils/query-client';
import { saveTimeZone } from '@/utils/time-zone';
import {
  disconnectWatchScheduleOnExit,
  establishWatchScheduleSession,
  fenceWatchScheduleOnExit,
  forgetWatchScheduleScope,
  isWatchScheduleExitLatched,
  latchWatchScheduleExit,
  markFenceUnconfirmed,
  watchScheduleActiveScope,
  watchScheduleExitBoundary,
  watchScheduleSessionEpoch,
} from '@/utils/watch-schedule';
import posthog from 'posthog-js';
import { useCallback, useEffect, useMemo, useReducer } from 'react';

import { User } from '@openathlete/shared';

import { ActionMapType, AuthContextType, AuthStateType } from '../types';
import { AuthContext } from './auth-context';

const Types = {
  INITIAL: 'INITIAL',
  OFFLINE: 'OFFLINE',
  LOGOUT: 'LOGOUT',
} as const;

type Types = (typeof Types)[keyof typeof Types];

const reducer = (state: AuthStateType, action: ActionsType) => {
  if (action.type === Types.INITIAL) {
    return {
      loading: false,
      offline: false,
      user: action.payload.user,
    };
  }
  if (action.type === Types.OFFLINE) {
    return {
      loading: false,
      offline: true,
      user: null,
    };
  }
  if (action.type === Types.LOGOUT) {
    return {
      ...state,
      user: null,
    };
  }
  return state;
};

type Props = {
  children: React.ReactNode;
};

type Payload = {
  [Types.INITIAL]: {
    user: User | null;
  };
  [Types.OFFLINE]: undefined;
  [Types.LOGOUT]: undefined;
};

type ActionsType = ActionMapType<Payload>[keyof ActionMapType<Payload>];

const initialState: AuthStateType = {
  user: null,
  loading: true,
  offline: false,
};

export function AuthProvider({ children }: Props) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const initialize = useCallback(
    async (options?: { authenticated?: boolean }) => {
      // Only a new explicit authentication (login, signup, provider or SSO)
      // may establish the successor and release the exit latch. A bootstrap or
      // refresh getMe still uses the old bearer and must never clear a newer
      // exit or publish its user.
      const authenticated = options?.authenticated === true;
      // Capture the exit latch before the first await. An initialization that
      // started before a logout must not release that newer exit when its old
      // token happens to resolve successfully later.
      const watchExitBoundary = watchScheduleExitBoundary();
      const startEpoch = watchScheduleSessionEpoch();
      const bootstrapIsStale = () =>
        !authenticated &&
        (isWatchScheduleExitLatched() ||
          watchScheduleSessionEpoch() !== startEpoch);
      if (bootstrapIsStale()) return;
      // Without an answer from the API the session is unknown, not signed out:
      // treating it as signed out would send the user to the login page
      let attempt = captureAuthAttempt();
      const signedOutOrOffline = (error: unknown) => {
        // A 401 for a bearer that is no longer installed must not clear the
        // account that won the race.
        if (!isAuthAttemptCurrent(attempt)) return;
        if (bootstrapIsStale()) return;
        if (isWatchScheduleExitLatched()) return;
        dispatch(
          isNetworkError(error)
            ? { type: Types.OFFLINE }
            : { type: Types.INITIAL, payload: { user: null } },
        );
      };

      const complete = async (user: User, attempt: AuthAttempt) => {
        // A getMe carries the bearer it actually used. If another login or
        // logout installed a newer session while it was in flight, publishing
        // this user would pair account A's profile with account B's token.
        if (!isAuthAttemptCurrent(attempt)) return;
        if (authenticated && attempt.accessToken === null) return;

        await saveLanguageChoice(user.language);
        // Not awaited: reminders can wait, the app should not
        void saveTimeZone(user.timeZone);

        if (authenticated) {
          // A newer exit or successor may have won while getMe was in flight.
          // Its boundary/epoch differs, so this result must not release it.
          if (watchScheduleSessionEpoch() !== startEpoch) return;
          if (!establishWatchScheduleSession(watchExitBoundary)) return;
        } else if (bootstrapIsStale()) {
          // A logout or a newer authenticated successor owns the session now;
          // this old bearer response is stale even if no latch remains.
          return;
        }
        if (isWatchScheduleExitLatched()) return;
        if (!isAuthAttemptCurrent(attempt)) return;

        dispatch({
          type: Types.INITIAL,
          payload: {
            user,
          },
        });

        // Initialize push notifications and send any pending token
        initializePushNotifications()
          .then(() => {
            // Import dynamically to avoid circular dependency
            import('@/utils/push-notifications').then(
              ({ sendPendingTokenIfAny }) => {
                sendPendingTokenIfAny();
              },
            );
          })
          .catch((error) => {
            console.error('Failed to initialize push notifications:', error);
          });
      };

      try {
        // Resolve the token before capturing the attempt. A refresh installs
        // through the generation-aware helper; getMe is then pinned to this
        // exact token and instance instead of re-reading storage later.
        await getAccessToken();
        attempt = captureAuthAttempt();
        if (bootstrapIsStale()) return;

        if (attempt.accessToken !== null) {
          const user = await UserAPI.getMe(attempt);
          if (bootstrapIsStale()) return;
          await complete(user, attempt);
        } else {
          try {
            const user = await UserAPI.getMe(attempt);
            if (bootstrapIsStale()) return;
            await complete(user, attempt);
          } catch (error) {
            signedOutOrOffline(error);
          }
        }
      } catch (error) {
        signedOutOrOffline(error);
      }
    },
    [],
  );

  const logout = useCallback((navigate?: (path: string) => void) => {
    const exitScope = watchScheduleActiveScope();
    const finish = () => {
      // Cleanup can finish later on the phone; it never holds up navigation.
      // The captured scope makes a delayed teardown unable to retire the
      // account that signs in next.
      void disconnectWatchScheduleOnExit(exitScope).then((report) => {
        if (
          report &&
          (!report.purgedCredential ||
            report.retainedEventIDs.length > 0 ||
            report.unresolvedEventIDs.length > 0)
        ) {
          markFenceUnconfirmed(exitScope, 'disconnect');
        }
      });
      posthog.capture('user_logged_out');
      posthog.reset();
      clearAuthTokens();
      forgetWatchScheduleScope();
      clear();
      // The cache outlives an in-app logout. The next account to sign in on
      // this tab would get this one's data, including the profile that tells
      // the guard whether to send a new account to the onboarding.
      queryClient.clear();
      signOutFirebase().catch((error) => {
        console.error('Failed to sign out Firebase:', error);
      });
      dispatch({
        type: Types.LOGOUT,
      });
      const loginPath = getPath(['auth', 'login']);
      if (navigate) {
        navigate(loginPath);
      } else {
        window.location.href = loginPath;
      }
    };
    // Fence Apple scheduling before the tokens disappear, and wait for that
    // acknowledgement (bounded) so a stale permission/fetch continuation cannot
    // opt the signed-out account in after storage was cleared. The synchronous
    // latch comes first: while the fence waits, even newly started work must be
    // refused because the old token is still in storage. If native does not
    // acknowledge, sign-out still escapes and the unconfirmed state is surfaced
    // in settings instead of being reported as a successful fence.
    const exitBoundary = latchWatchScheduleExit();
    void fenceWatchScheduleOnExit().then((acknowledged) => {
      // A successor (or a newer exit) owns the session now. Its storage and
      // latch must not be cleared by this older sign-out continuation.
      if (watchScheduleExitBoundary() !== exitBoundary) return;
      if (!acknowledged) markFenceUnconfirmed(exitScope, 'fence');
      finish();
    });
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Back online: try again without waiting for the user
  useEffect(() => {
    if (!state.offline) return;
    const retry = () => void initialize();
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, [state.offline, initialize]);

  const checkAuthenticated = state.user ? 'authenticated' : 'unauthenticated';

  const status = state.loading ? 'loading' : checkAuthenticated;

  const memoizedValue = useMemo<AuthContextType>(
    () => ({
      user: state.user,
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated' && !state.offline,
      offline: state.offline,
      initialize,
      logout,
    }),
    [state.user, state.offline, status, initialize, logout],
  );

  return (
    <AuthContext.Provider value={memoizedValue}>
      {children}
    </AuthContext.Provider>
  );
}
